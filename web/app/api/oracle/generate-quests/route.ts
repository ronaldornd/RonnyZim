import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';

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
Contexto: RonnyZim OS - Oráculo de Estratégia Black-Ops Corporativa.
Seu objetivo é gerar 3 Missões Diárias (Daily Quests). 
ESTILO: Uma mistura de "Hacking de Infraestrutura" com "Estratégia Corporativa de Alto Nível".
As missões devem ser tratadas como "Intervenções de Mercado" ou "Aquisições Técnicas Hostis".

Tendências Críticas (Gaps detectados no mercado):
${top_trends.map((t: any) => `- ${t.skill} (Frequência: ${t.count}x)`).join('\n')}

Quests Atuais (EVITE QUALQUER DUPLICAÇÃO):
${currentQuestsStr}

DIRETRIZES DE RIQUEZA EM DETALHES (Dossiê Black-Ops):
1. Título: Formato "[NOME DA OPERAÇÃO] Nome do Alvo". Use termos agressivos como REDENÇÃO, SENTINELA, PROTOCOLO, INFILTRAÇÃO, AQUISIÇÃO, OVERLOAD. Ex: "[PROTOCOLO HELIOS] Exploit de Performance em Micro-Ações".
2. Briefing Tático: Exatamente 2 parágrafos densos. Misture jargão corporativo (ROI, Stakeholders, Equity, Market Share) com jargão técnico (Low Latency, Race Conditions, Sharding, Root Cause). Explique como o cumprimento dessa missão aumenta o valor de mercado (Alpha) do operador.
3. Objetivos de Campo (Steps): EXATAMENTE 6 passos. Cada passo deve ser uma instrução técnica rica, descrevendo ferramentas (ex: React, Node, Redis, K8s) e métricas de sucesso (ex: REDUCE LATENCY POR 20%, ZERO-DOWNTIME). Use frases como "Implemente o middleware de interceptação utilizando X para garantir a integridade de Y".
4. Critérios de Validação: Evidências frias (Logs de produção, links de commit, screenshots de Dashboards de Performance).
5. Target Stack: Liste as tecnologias separadas por barra (ex: "NEXT.JS / REDIS / DOCKER / PROMETHEUS").
6. XP Reward: Varie entre 300 e 500 baseado na complexidade.

Formato de Resposta (MANDATÓRIO JSON ARRAY):
[
  { 
    "title": "...", 
    "briefing": "Obrigatório: 2 parágrafos densos unindo estratégia de mercado e tática técnica para preencher o campo de visão.", 
    "steps": ["Step 1: instrução técnica detalhada", "Step 2: instrução técnica detalhada", "Step 3: instrução técnica detalhada", "Step 4: instrução técnica detalhada", "Step 5: instrução técnica detalhada", "Step 6: instrução técnica detalhada (OBRIGATÓRIO PREENCHER 6 ITENS)"],
    "completion_criteria": "Detalhamento técnico da evidência necessária.",
    "target_stack": "STACK / STACK / STACK", 
    "xp_reward": 500 
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
