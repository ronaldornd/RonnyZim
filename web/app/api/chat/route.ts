import { GoogleGenAI, Type, Schema } from '@google/genai';
import { declareKnowledgeGapFunctionDeclaration, createDailyQuestFunctionDeclaration } from '@/lib/active-learning/tools';
import { createAdminClient } from '@/lib/supabase/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const routingSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        agent_id: {
            type: Type.STRING,
            description: "The unique ID of the selected agent (e.g., 'hunterzim', 'orchestrator')",
        }
    },
    required: ["agent_id"]
};

export async function POST(request: Request) {
    try {
        const {
            messages,
            agent_id,
            dynamic_system_prompt,
            user_id
        } = await request.json();

        if (!user_id || (!agent_id && !dynamic_system_prompt)) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch available agents to build routing context
        const { data: agents, error: agentsError } = await supabase
            .from('internal_agents')
            .select('id, name, role');

        if (agentsError || !agents) {
            console.warn("Failed to fetch internal_agents. Bypassing router.", agentsError);
        }

        const lastMessage = messages?.[messages.length - 1]?.content || '';
        let targetAgentId = agent_id;
        let systemInstruction = dynamic_system_prompt;

        // 2. The Semantic Router Step (only run if not explicitly overridden by dynamic prompt logic elsewhere)
        if (!dynamic_system_prompt && agents && agents.length > 0) {
            const routingPrompt = `
You are the Semantic Router for the RonnyZim OS. 
Your job is to analyze the user's latest message and pick the BEST matching agent to respond.

Available Agents:
${agents.map(a => `- ID: ${a.id} | Name: ${a.name} | Role: ${a.role}`).join('\n')}

Rules:
1. STICKY ROUTING: The user is currently speaking with the agent ID: "${agent_id}". If the user's message is ambiguous, short (e.g., "Yes", "Explain more"), or clearly a follow-up to the current conversation, you MUST return the current agent ID ("${agent_id}").
2. Only switch agents if there is a CLEAR AND OBVIOUS change in intent that directly maps to another agent's role (e.g. asking for resume review maps to 'hunterzim', emotional support maps to 'emotional-analyst').
3. You must return EXACTLY ONLY valid JSON adhering to the schema.

User's Latest Message: "${lastMessage}"
`;
            try {
                const routeResponse = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: routingPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: routingSchema,
                        temperature: 0.1
                    }
                });

                if (routeResponse.text) {
                    const parsed = JSON.parse(routeResponse.text);
                    if (parsed.agent_id && agents.some(a => a.id === parsed.agent_id)) {
                        targetAgentId = parsed.agent_id;
                        console.log(`🧭 [Semantic Router] Decidiu rotear para: ${targetAgentId} (Anterior: ${agent_id})`);
                    }
                }
            } catch (routeErr) {
                console.error("Routing inference failed, falling back to current agent:", routeErr);
            }
        }

        // 3. Fetch Persona Context from Supabase
        if (!dynamic_system_prompt) {
            const { data: activeAgent } = await supabase
                .from('internal_agents')
                .select('system_prompt, tone')
                .eq('id', targetAgentId)
                .single();

            if (activeAgent) {
                systemInstruction = `Você é o agente ID: ${targetAgentId}. Tone: ${activeAgent.tone}.\nInstruções: ${activeAgent.system_prompt}`;
            } else {
                systemInstruction = `Você é o agente ID: ${targetAgentId}. Aja de acordo com sua função sistêmica.`;
            }
        }

        // 3.1 Fetch User Context (Facts + Stack)
        let userContextStr = '';
        try {
            const [factsRes, masteryRes] = await Promise.all([
                supabase.from('user_facts').select('category, property_key, value').eq('user_id', user_id),
                supabase.from('user_stack_mastery').select('current_level, current_xp, global_stacks(name)').eq('user_id', user_id)
            ]);

            const facts = factsRes.data || [];
            if (facts.length > 0) {
                userContextStr += "\n\n### FATOS CONHECIDOS SOBRE O USUÁRIO:\n";
                facts.forEach(f => {
                    userContextStr += `- [${f.category || 'Geral'}] ${f.property_key}: ${f.value}\n`;
                });
            }

            const mastery = masteryRes.data || [];
            if (mastery.length > 0) {
                userContextStr += "\n\n### STACK TECNOLÓGICA E NÍVEL DE XP DO USUÁRIO:\n";
                mastery.forEach((m: any) => {
                    const stackName = m.global_stacks?.name || 'Skill Desconhecida';
                    userContextStr += `- ${stackName}: Nível ${m.current_level} (${m.current_xp} XP na barra atual)\n`;
                });
            }
        } catch (ctxErr) {
            console.error('Falha ao buscar user context:', ctxErr);
        }

        // 3.5. Universal System Constraint
        if (typeof systemInstruction === 'string') {
            systemInstruction += userContextStr;
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: Em absolutamente toda e qualquer interação sua, independente do seu tom, você DEVE terminar a sua resposta sugerindo ao usuário exatamente 3 ideias concisas de próximos passos práticos ou dúvidas acionáveis ('Next Steps'). Formate como uma lista enumerada curta no final.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: If you need specific personal/professional facts about the user to give a highly accurate answer, DO NOT guess or give generic advice. Call the declare_knowledge_gap tool instead.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: If the user asks for a study plan, a challenge, or a quest, DO NOT just list it in text. Call the create_daily_quest tool to formally assign statistical XP progression to their Matrix. IMPORTANT: The 'description' field MUST contain a clear execution guide with at least 4 numbered steps (e.g., '1. Abra o projeto... 2. Crie o arquivo... 3. Implemente a lógica... 4. Teste com...') so the user knows exactly how to complete the quest.";
        }

        // Processamento do history para a chamada principal
        const geminiHistory = (messages || []).map((m: any) => {
            let role = m.role === 'assistant' ? 'model' : m.role;
            return {
                role: role,
                parts: [{ text: m.content || m.text || ' ' }]
            };
        });

        // 4. Main Agent Generation
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: geminiHistory,
            config: {
                systemInstruction: systemInstruction,
                tools: [{
                    functionDeclarations: [declareKnowledgeGapFunctionDeclaration, createDailyQuestFunctionDeclaration]
                }],
            }
        });

        // 5. Active Learning Check & Return
        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === 'declare_knowledge_gap') {
                return new Response(JSON.stringify({
                    type: 'knowledge_gap',
                    gapData: call.args
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            if (call.name === 'create_daily_quest') {
                const adminClient = createAdminClient();
                const qArgs = call.args as any;
                
                // Fire and forget or await the insert, we'll await to ensure it's saved before returning
                const { data: insertedQuest, error } = await adminClient.from('daily_quests').insert({
                    user_id: user_id,
                    title: qArgs.title,
                    description: qArgs.description,
                    target_stack: qArgs.target_stack,
                    xp_reward: qArgs.xp_reward,
                    status: 'Active'
                }).select().single();

                if (error) {
                    console.error('Failed to save AI Quest:', error);
                }

                return new Response(JSON.stringify({
                    type: 'quest_generated',
                    questData: insertedQuest || qArgs
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({
            role: 'model',
            is_function_call: false,
            active_agent_id: targetAgentId,
            content: response.text
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Gemini Chat API Error:', error);
        return new Response(JSON.stringify({
            error: 'Server Error',
            details: error.message || String(error),
            stack: error.stack
        }), { status: 500 });
    }
}
