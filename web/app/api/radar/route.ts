import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const radarSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        targets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2 or 3 exact job titles of technical decision-makers (e.g. 'Engineering Manager', 'CTO').",
        },
        dm_template: {
            type: Type.STRING,
            description: "A short, punchy LinkedIn connection message (max 300 chars) highlighting a strong match.",
        }
    },
    required: ["targets", "dm_template"],
};

export async function POST(req: Request) {
    try {
        const { user_id, company_name, job_description, strong_matches } = await req.json();

        if (!company_name || !job_description) {
            return NextResponse.json({ error: 'Missing company_name or job_description' }, { status: 400 });
        }

        // 1. Fetch User Preferred Model
        let radarModel = 'gemini-2.0-flash'; // Standard fallback
        if (user_id) {
            const supabase = createAdminClient();
            const { data: modelFact } = await supabase
                .from('user_facts')
                .select('value')
                .eq('user_id', user_id)
                .eq('property_key', 'preferred_ai_model')
                .single();
            
            if (modelFact?.value) {
                radarModel = modelFact.value;
                console.log(`📡 [Radar API] Usando modelo preferido: ${radarModel}`);
            }
        }

        const systemInstruction = `
            Você é um Headhunter Técnico de Elite. Sua missão é ajudar o candidato a hackear o processo seletivo da empresa ${company_name}.
            
            OBJETIVOS:
            1. Identificar de 2 a 3 cargos exatos de decisores técnicos que o candidato deve buscar no LinkedIn para ignorar o ATS (ex: 'Engineering Manager', 'Head of Engineering', 'Líder Técnico').
            2. Escrever uma mensagem de conexão (DM) para o LinkedIn, curta, direta e "punchy" (máximo 300 caracteres).
            
            REGRAS DA DM:
            - Deve destacar um destes pontos fortes do candidato: [${strong_matches?.join(', ') || 'relevância técnica'}].
            - Deve provar valor imediato de forma agressiva porém profissional.
            - Deve estar em Português do Brasil (PT-BR).
            - Sem enrolação. Vá direto ao ponto.
            
            Retorne APENAS o JSON no formato sugerido.
        `;

        const userPrompt = `
            Analise esta descrição de vaga para a empresa ${company_name}:
            
            --- JOB DESCRIPTION ---
            ${job_description}
            --- END ---
            
            Pontos fortes do candidato para destacar: ${strong_matches?.join(', ') || 'experiência na área'}.
        `;

        // FIXED SDK CALL AND SYNTX
        const response = await ai.models.generateContent({
            model: radarModel,
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: radarSchema,
                temperature: 0.7
            }
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Gemini returned an empty response.");
        }

        const result = JSON.parse(responseText);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Radar API Error:', error);
        return NextResponse.json(
            { error: 'Falha ao ativar o Radar de Networking.', details: error.message },
            { status: 500 }
        );
    }
}
