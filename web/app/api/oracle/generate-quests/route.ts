import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { user_id, top_trends } = await req.json();

        if (!user_id || !top_trends) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Get user preferences for AI model
        const { data: userFact } = await supabase
            .from('user_facts')
            .select('value')
            .eq('user_id', user_id)
            .eq('property_key', 'preferred_ai_model')
            .single();

        const modelId = userFact?.value || 'gemini-2.0-flash';

        // 2. Get current active quests for progression check
        const { data: currentQuests } = await supabase
            .from('daily_quests')
            .select('title, target_stack')
            .eq('user_id', user_id);

        const currentQuestsStr = currentQuests?.map(q => `- ${q.title} (${q.target_stack})`).join('\n') || 'Nenhuma quest ativa.';

        const prompt = `
Contexto: RonnyZim OS - Oráculo de Mercado.
Seu objetivo é gerar 3 Missões Diárias (Daily Quests) baseadas nas tendências detectadas.

Tendências Críticas (Gaps):
${top_trends.map((t: any) => `- ${t.skill} (Frequência: ${t.count}x)`).join('\n')}

Quests Atuais (EVITE DUPLICAR):
${currentQuestsStr}

ESTRUTURA DA MISSÃO:
1. Título: Curto, técnico e agressivo.
2. Briefing: 1 ou 2 parágrafos de contexto narrativo (sem passos).
3. Passos: Exatamente 4 objetivos técnicos curtos.
4. Critérios: Como provar a conclusão.

Formato de Resposta (JSON ARRAY):
[
  { 
    "title": "...", 
    "briefing": "...", 
    "steps": ["passo 1", "passo 2", "passo 3", "passo 4"],
    "completion_criteria": "...",
    "target_stack": "...", 
    "xp_reward": 300 
  }
]
`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
                responseMimeType: "application/json"
            }
        });

        const responseText = response.text;
        if (!responseText) throw new Error("Gemini returned empty.");
        
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const quests = JSON.parse(jsonStr);

        const questsWithIds = quests.map((q: any) => ({
            title: q.title,
            description: `[BRIEFING]\n${q.briefing}\n\n[STEPS]\n${q.steps.map((s: string, i: number) => `${i+1}. ${s}`).join('\n')}\n\n[CRITERIA]\n${q.completion_criteria}`,
            target_stack: q.target_stack,
            xp_reward: q.xp_reward,
            user_id: user_id,
            status: 'Active'
        }));

        const { error: insertError } = await supabase
            .from('daily_quests')
            .insert(questsWithIds);

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            message: `${quests.length} missões injetadas com sucesso na Matrix.`,
            quests
        });

    } catch (error: any) {
        console.error('📡 [Oracle Quest Error]:', error);
        return NextResponse.json(
            { error: 'Falha ao induzir missões em massa.', details: error.message },
            { status: 500 }
        );
    }
}
