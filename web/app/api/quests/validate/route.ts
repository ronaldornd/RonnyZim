import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAstralXpMultiplier } from '@/lib/astral';
import { getAIProvider } from '@/lib/ai/ai-factory';

// Injetado via Factory no POST

const validationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN, description: "Whether the proof provided satisfies the quest requirements." },
        feedback: { type: Type.STRING, description: "A brief feedback message (1 sentence) about the validation result." }
    },
    required: ["success", "feedback"]
};

export async function POST(req: Request) {
    try {
        const { questId, userId, proof } = await req.json();

        if (!questId || !userId || !proof) {
            return NextResponse.json({ error: 'Missing parameters (questId, userId, or proof)' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Get Quest Details
        const { data: quest, error: questError } = await supabaseAdmin
            .from('daily_quests')
            .select('*')
            .eq('id', questId)
            .eq('user_id', userId)
            .single();

        if (questError || !quest) {
            return NextResponse.json({ error: 'Quest not found or unauthorized' }, { status: 404 });
        }

        if (quest.status === 'Completed') {
            return NextResponse.json({ error: 'Quest already completed' }, { status: 400 });
        }

        // 2. Fetch Astral State from user_facts
        const { data: astralFacts } = await supabaseAdmin
            .from('user_facts')
            .select('property_key, value')
            .eq('user_id', userId)
            .in('property_key', ['moon_sign', 'mercury_retrograde', 'astro_technical_focus']);

        const astralState: any = {
            moonSign: null,
            mercuryRetrograde: false,
            technicalFocus: null
        };

        if (astralFacts) {
            const fMap: Record<string, string> = {};
            astralFacts.forEach((f: any) => { fMap[f.property_key] = f.value; });
            astralState.moonSign = fMap.moon_sign ?? null;
            astralState.mercuryRetrograde = fMap.mercury_retrograde === 'true';
            if (fMap.astro_technical_focus) {
                try {
                    astralState.technicalFocus = JSON.parse(fMap.astro_technical_focus);
                } catch (e) {
                    console.error('Failed to parse astro_technical_focus in backend', e);
                }
            }
        }

        // 3. Resolve AI Config via Factory
        const { apiKey, modelId } = await getAIProvider(userId);
        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({ 
            model: modelId,
            contents: [{ role: 'user', parts: [{ text: `
            Você é um Auditor de Código e Instrutor Técnico do RonnyZim OS.
            Sua missão é validar se o usuário realmente completou o objetivo técnico abaixo.
            
            MISSÃO: ${quest.title}
            OBJETIVO: ${quest.description}
            STACK: ${quest.target_stack}
            
            PROVA ENVIADA PELO USUÁRIO:
            ---
            ${proof}
            ---
            
            Analise se o conteúdo enviado demonstra minimamente o cumprimento do objetivo. 
            Seja levemente crítico mas encorajador.
            Não aceite textos genéricos como "fiz o código". Exija ver lógica ou explicação técnica.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: validationSchema
            }
        });

        const validationText = result.text;
        if (!validationText) {
            return NextResponse.json({ error: 'IA falhou em gerar resposta de validação' }, { status: 500 });
        }

        const validation = JSON.parse(validationText);

        if (validation.success) {
            // 4. Update Quest Status
            await supabaseAdmin
                .from('daily_quests')
                .update({ status: 'Completed' })
                .eq('id', questId);

            // 5. Determine astral XP multiplier for the quest stack
            const { multiplier: xpMultiplier, message: astralMessage } = getAstralXpMultiplier(
                quest.target_stack,
                astralState
            );

            // Append astral buff message to AI feedback if active
            if (astralMessage) {
                validation.feedback = `${validation.feedback}\n\n${astralMessage}`;
                validation.astralBuff = true;
                validation.xpMultiplier = xpMultiplier;
            }

import { XPService } from '@/lib/services/xp-service';

            // 6. Grant XP (with astral multiplier applied via XPService)
            const stackNames = (quest.target_stack as string).split(',').map(s => s.trim()).filter(Boolean);
            const baseXpPerStack = Math.max(1, Math.floor(quest.xp_reward / stackNames.length));

            await Promise.all(stackNames.map(async (name) => {
                const { multiplier: stackMultiplier } = getAstralXpMultiplier(name, astralState);
                return XPService.applyXpToStack(supabaseAdmin, userId, name, baseXpPerStack, stackMultiplier);
            }));
        }

        return NextResponse.json(validation);

    } catch (error: any) {
        console.error('Validation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
