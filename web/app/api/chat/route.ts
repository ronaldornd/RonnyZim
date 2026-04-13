import { generateText, tool, jsonSchema } from 'ai';
import { getAIProvider } from '@/lib/ai/ai-factory';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const routingSchema = z.object({
    agent_id: z.string().describe("The unique ID of the selected agent (e.g., 'hunterzim', 'orchestrator')"),
});

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

        const { model, provider } = await getAIProvider(user_id);

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
        let systemInstruction = dynamic_system_prompt || '';

        // 2. Fetch User Context (Facts + AI Model Preference) early
        let chatModel = 'gemini-2.0-flash'; // Default globals
        let userContextStr = '';
        try {
            const [factsRes, masteryRes, questsRes, hunterRes, lastInterviewRes] = await Promise.all([
                supabase.from('user_facts').select('category, property_key, value').eq('user_id', user_id),
                supabase.from('user_stack_mastery').select('current_level, current_xp, global_stacks(name)').eq('user_id', user_id),
                supabase.from('daily_quests').select('title, xp_reward, status').eq('user_id', user_id).eq('status', 'Active'),
                supabase.from('hunter_insights').select('document_name, match_score, status').eq('user_id', user_id).in('status', ['Evaluating', 'Applied', 'Interview']),
                supabase.from('interview_sessions').select('behavioral_analysis, created_at').eq('user_id', user_id).not('behavioral_analysis', 'is', null).order('created_at', { ascending: false }).limit(1)
            ]);

            const facts = factsRes.data || [];
            
            const modelFact = facts.find(f => f.property_key === 'preferred_ai_model');
            if (modelFact && modelFact.value) {
                chatModel = modelFact.value;
                console.log(`📡 [Chat API] Usando modelo preferido: ${chatModel}`);
            }

            if (facts.length > 0) {
                userContextStr += "\n\n### FATOS CONHECIDOS SOBRE O USUÁRIO:\n";
                facts.forEach(f => {
                    const factVal = f.value || '';
                    userContextStr += `- [${f.category || 'Geral'}] ${f.property_key}: ${factVal}\n`;
                });

                // Energy Feedback Loop
                const energyFact = facts.find(f => f.property_key === 'astro_daily_energy');
                if (energyFact) {
                    const energy = parseInt(energyFact.value || '50');
                    userContextStr += `\n\n### ESTADO ATUAL (ASTRODASH ENERGY): ${energy}%\n`;
                    if (energy > 80) {
                        userContextStr += "- O usuário está em um PICO de energia. Sugira quests de ALTO IMPACTO e GRIND intenso.\n";
                    } else if (energy < 40) {
                        userContextStr += "- O usuário está em BAIXA energia. Sugira quests LEVES, de manutenção ou organização básica.\n";
                    }
                }
            }

            const mastery = masteryRes.data || [];
            if (mastery.length > 0) {
                userContextStr += "\n\n### STACK TECNOLÓGICA E NÍVEL DE XP DO USUÁRIO:\n";
                mastery.forEach((m: any) => {
                    const stackName = m.global_stacks?.name || 'Skill Desconhecida';
                    userContextStr += `- ${stackName}: Nível ${m.current_level} (${m.current_xp} XP na barra atual)\n`;
                });
            }

            const quests = questsRes.data || [];
            if (quests.length > 0) {
                userContextStr += "\n\n### MISSÕES ATIVAS DO USUÁRIO:\n";
                quests.forEach((q: any) => {
                    userContextStr += `- Missão Pendente: ${q.title} (Recompensa: ${q.xp_reward} XP)\n`;
                });
            }

            const hunters = hunterRes.data || [];
            if (hunters.length > 0) {
                userContextStr += "\n\n### VAGAS/ALVOS EM ANDAMENTO NO HUNTER BOARD:\n";
                hunters.forEach((h: any) => {
                    userContextStr += `- Vaga: ${h.document_name} | Status: ${h.status} | Match Score: ${h.match_score}%\n`;
                });
            }

            const lastInterview = lastInterviewRes.data?.[0];
            if (lastInterview && lastInterview.behavioral_analysis) {
                userContextStr += "\n\n### ÚLTIMA ANÁLISE COMPORTAMENTAL (SENSORIAL/AUDITIVA):\n";
                const analysis = lastInterview.behavioral_analysis as any;
                const score = analysis.overall_confidence || 0;
                userContextStr += `Identificada em: ${new Date(lastInterview.created_at).toLocaleDateString()}\n`;
                userContextStr += `- Score de Confiança REAL: ${score}/100 (Atenção: 0-40 é PÉSSIMO, 40-70 é REGULAR, 70-100 é EXCELENTE)\n`;
                
                if (analysis.markers && analysis.markers.length > 0) {
                    userContextStr += "- EVENTOS DETECTADOS (Neural Events):\n";
                    analysis.markers.slice(0, 6).forEach((m: any) => {
                        userContextStr += `  * [${m.timestamp}s] ${m.type.toUpperCase()}: ${m.label}\n`;
                    });
                }

                userContextStr += `- Pontos Fortes: ${analysis.strengths?.join(', ') || 'Nenhum detectado'}\n`;
                userContextStr += `- Pontos de Atenção (Red Flags): ${analysis.red_flags?.join(', ') || 'Nenhum'}\n`;
                userContextStr += `- Resumo Tático: ${analysis.summary || 'N/A'}\n`;
                userContextStr += `\nINSTRUÇÃO CRÍTICA: Se o Score de Confiança for baixo (abaixo de 50), você DEVE ser crítico e apontar as falhas detectadas nos eventos acima (hesitações, pausas, gagueira). NÃO dê parabéns se a performance foi ruim. Aja como um mentor exigente.\n`;
            }
        } catch (ctxErr) {
            console.error('Falha ao buscar user context:', ctxErr);
        }

        // 3. The Semantic Router Step
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
                const { object } = await generateText({
                    model: model,
                    messages: [{ role: 'user', content: routingPrompt }],
                    experimental_output: {
                        schema: routingSchema
                    },
                    temperature: 0.1
                });

                if (object.agent_id && agents.some(a => a.id === object.agent_id)) {
                    targetAgentId = object.agent_id;
                    console.log(`🧭 [Semantic Router] Decidiu rotear para: ${targetAgentId} (Anterior: ${agent_id})`);
                }
            } catch (routeErr) {
                console.error("Routing inference failed, falling back to current agent:", routeErr);
            }
        }

        // 4. Fetch Persona Context from Supabase
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

        // 5. Universal System Constraint
        if (typeof systemInstruction === 'string') {
            systemInstruction += userContextStr;
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: Em absolutamente toda e qualquer interação sua, independente do seu tom, você DEVE terminar a sua resposta sugerindo ao usuário exatamente 3 ideias concisas de próximos passos práticos ou dúvidas acionáveis ('Next Steps'). Formate como uma lista enumerada curta no final.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: If you need specific personal/professional facts about the user to give a highly accurate answer, DO NOT guess or give generic advice. Call the declare_knowledge_gap tool instead. NEVER output raw JSON in the text message if you should be calling this tool.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: If the user asks for a study plan, a challenge, or a quest, DO NOT just list it in text. Call the create_daily_quest tool to formally assign statistical XP progression to their Matrix. Considere o estado de energia do usuário (ASTRODASH ENERGY) para calibrar a dificuldade e recompensas.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: Always respond using Markdown formatting (bold, italics, lists, headers) to make your output clear and professional. NEVER respond with raw JSON objects in the final message content.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE: The 'description' field of create_daily_quest MUST be an immersive 'Technical Dossier'. It MUST start with a [NOME DA OPERAÇÃO] in the title, followed by a dense briefing and EXACTLY 4 highly detailed technical steps (numbered 1 to 4). Each step must describe a complex action and specifying relevant tools/technologies. DO NOT provide short or generic steps.";
            systemInstruction += "\n\nCRITICAL SYSTEM RULE [CONTEXT AWARE]: Se o usuário possui missões ativas listadas acima, encoraje-o a completá-las antes de sugerir novas missões. NÃO crie missões ou desafios aleatoriamente se o usuário apenas disser 'olá' ou mensagens curtas. Nesse caso, faça um breve resumo motivacional do estado atual (missões ativas, vagas em andamento, energia) e direcione o foco dele SEM chamar a tool create_daily_quest.";
        }

        // 6. Main Agent Generation
        const response = await generateText({
            model: model,
            system: systemInstruction,
            messages: (messages || []).map((m: any) => ({
                role: m.role,
                content: m.content || m.text || ''
            })),
            tools: {
                declare_knowledge_gap: tool({
                    description: 'When you lack crucial context or facts to answer a users prompt accurately (e.g., you do not know their seniority, salary, or current tech stack), CALL THIS TOOL to ask the user. DO NOT GUESS.',
                    parameters: z.object({
                        category: z.string().describe('The category of this fact. E.g., career, emotional, habits, preference, identity, stack.'),
                        question_to_user: z.string().describe('The direct question to the user asking for the missing fact, in your persona tone.'),
                        importance: z.string().describe('High or medium priority flag.')
                    }),
                }),
                create_daily_quest: tool({
                    description: 'Generates a new daily quest/challenge for the user based on their skills or learning goals. Call this whenever the user asks for a challenge, study plan, or quest. Provide realistic XP rewards based on difficulty (e.g., 50 for easy, 100 for medium, 200 for hard).',
                    parameters: z.object({
                        title: z.string().describe('A catchy, game-like title for the quest (e.g., "Refatoração Profunda", "Mestre do Hook").'),
                        description: z.string().describe('Detailed instructions on what the user needs to build or analyze to complete the quest.'),
                        target_stack: z.string().describe('The specific technology stack this quest trains (e.g., React, Node.js, TypeScript, PostgreSQL).'),
                        xp_reward: z.number().describe('The amount of XP the user will earn upon completing this quest.')
                    }),
                })
            }
        });

        // 7. Active Learning Check & Return
        if (response.toolCalls && response.toolCalls.length > 0) {
            const call = response.toolCalls[0];
            if (call.toolName === 'declare_knowledge_gap') {
                return new Response(JSON.stringify({
                    type: 'knowledge_gap',
                    gapData: call.args
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            if (call.toolName === 'create_daily_quest') {
                const adminClient = createAdminClient();
                const qArgs = call.args as any;
                
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
