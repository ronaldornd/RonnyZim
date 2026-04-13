import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIProvider } from '@/lib/ai/ai-factory';

const radarSchema = z.object({
    targets: z.array(z.string()).min(2).max(3).describe("2 or 3 exact job titles of technical decision-makers (e.g. 'Engineering Manager', 'CTO')."),
    dm_template: z.string().max(300).describe("A short, punchy LinkedIn connection message highlighting a strong match.")
});

export async function POST(req: Request) {
    try {
        const { user_id, company_name, job_description, strong_matches } = await req.json();

        if (!company_name || !job_description || !user_id) {
            return NextResponse.json({ error: 'Missing company_name, job_description or user_id' }, { status: 400 });
        }

        // 1. Get Dynamic Provider via AI Factory
        const { provider, modelId } = await getAIProvider(user_id);

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
        `;

        const userPrompt = `
            Analise esta descrição de vaga para a empresa ${company_name}:
            
            --- JOB DESCRIPTION ---
            ${job_description}
            --- END ---
            
            Pontos fortes do candidato para destacar: ${strong_matches?.join(', ') || 'experiência na área'}.
        `;

        // 2. Invoke AI SDK (generateObject)
        const { object: result } = await generateObject({
            model: provider(modelId),
            schema: radarSchema,
            system: systemInstruction,
            prompt: userPrompt,
            temperature: 0.7,
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Radar API Error:', error);
        return NextResponse.json(
            { error: 'Falha ao ativar o Radar de Networking.', details: error.message },
            { status: 500 }
        );
    }
}
