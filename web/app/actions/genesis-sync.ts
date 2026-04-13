"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { revalidateTag, revalidatePath } from "next/cache";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const genesisSyncSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        bioSummary: {
            type: Type.STRING,
            description: "Uma biografia rica, muito humorada (estilo nerd sarcástico) que detalha a jornada do usuário cruzando os astros com as linguagens que ele odeia/ama.",
        },
        integrity: {
            type: Type.INTEGER,
            description: "Nível de integridade (70 até 100).",
        },
        sync_level: {
            type: Type.INTEGER,
            description: "Nível de sincronia (50 até 100).",
        },
        quests: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    xp_reward: { type: Type.INTEGER },
                    type: { type: Type.STRING },
                    target_stack: { type: Type.STRING }
                },
                required: ["title", "description", "xp_reward", "type"]
            },
            description: "Exatamente 3 missões diárias técnicas correlacionadas à energia astrológica.",
        }
    },
    required: ["bioSummary", "integrity", "sync_level", "quests"],
};

export async function genesisSyncAction(userId: string) {
    if (!userId) throw new Error("User ID is required for Genesis Sync");

    const supabase = createAdminClient();

    // 1. Coletar fatos de nascimento
    const { data: facts } = await supabase
        .from('user_facts')
        .select('property_key, value')
        .eq('user_id', userId)
        .in('property_key', ['birth_date', 'birth_time', 'birth_city', 'seniority']);

    let birthDataStr = '';
    let seniority = '';
    if (facts) {
        facts.forEach(f => {
            if (f.property_key === 'birth_date') birthDataStr += `Nascimento: ${f.value} `;
            if (f.property_key === 'birth_time') birthDataStr += `às ${f.value} `;
            if (f.property_key === 'birth_city') birthDataStr += `(Cidade: ${f.value}) `;
            if (f.property_key === 'seniority') seniority = f.value;
        });
    }

    if (!birthDataStr.trim()) birthDataStr = 'Dados astrais desconhecidos.';

    // 2. Coletar Stacks
    const { data: stacks } = await supabase
        .from('user_stack_mastery')
        .select(`
            id,
            global_stacks (name)
        `)
        .eq('user_id', userId);

    const activeStacks = stacks?.map((s: any) => s.global_stacks?.name).filter(Boolean) || [];
    const stackStr = activeStacks.length > 0 ? activeStacks.join(', ') : 'Nenhuma stack técnica definida';

    // 3. Chamar Gemini para Correlação
    const systemInstruction = `
        Você é o ASTRO-KERNEL. O motor neural e místico por trás do RonnyZim OS.
        Você analisa a combinação do signo solar (baseado na data de nascimento) e o nível técnico.
        
        Dados Astrais: ${birthDataStr}
        Stack Tecnológico (${seniority}): ${stackStr}

        Sua tarefa: 
        1. Gerar uma "bioSummary": Crie uma bio incrível, com cerca de 3 a 5 parágrafos curtos. O tom deve ser nerd, inteligente, extremamente perspicaz e com um humor ácido mas encorajador. Combine a essência mística dos astros dele com os perrengues diários nas tecnologias que ele usa. Tem que ser prazeroso e fácil de ler, mas recheado de referências técnicas e astrais muito criativas. Exemplo de vibe: Sarcasmo do Rick Sanchez misturado com Mestre Yoda Hacker.
        2. Determinar integridade e sincronia baseada nos astros no momento atual (invente com lógica cósmica).
        3. Criar EXATAMENTE 3 missões diárias de código ou carreira baseadas nas Stacks ativas e na intuição astral do dia. Type deve ser 'HARD_SKILL', 'SOFT_SKILL' ou 'AURA'. xp_reward entre 10 e 100. target_stack string (nome da tech).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [{ text: "Gere a sincronização inicial" }] }
        ],
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: genesisSyncSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Gemini returned an empty response.");

    const syncData = JSON.parse(responseText);

    // 4. Injetar na base os dados vitais
    const telemetryFacts = [
        { user_id: userId, category: 'telemetry', property_key: 'telemetry_biosummary', value: syncData.bioSummary },
        { user_id: userId, category: 'telemetry', property_key: 'telemetry_integrity', value: syncData.integrity.toString() },
        { user_id: userId, category: 'telemetry', property_key: 'telemetry_sync', value: syncData.sync_level.toString() }
    ];

    await supabase.from('user_facts').upsert(telemetryFacts, { onConflict: 'user_id,property_key' });

    // 5. Injetar Quests (Deleta antigas pendentes para esse reset limpo)
    await supabase.from('daily_quests').delete().eq('user_id', userId).eq('status', 'pending');

    const questsToInsert = syncData.quests.map((q: any) => {
        return {
            user_id: userId,
            title: q.title,
            description: q.description,
            xp_reward: q.xp_reward,
            stack_name: q.target_stack || 'General',
            status: 'pending'
        };
    });

    if (questsToInsert.length > 0) {
        await supabase.from('daily_quests').insert(questsToInsert);
    }

    revalidateTag(`profile-${userId}`, 'max');
    revalidatePath('/os');

    return { success: true, data: syncData };
}
