import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/ai-factory';
import { normalizeSkill } from '@/lib/utils/skill-normalizer';

// Strictly define the expected JSON structure using Zod for the AI SDK
const analysisSchema = z.object({
    score: z.number().int().min(0).max(100).describe("An overall score from 0 to 100 representing the quality or match."),
    summary: z.string().describe("A concise executive summary of the document (appx 2-3 sentences)."),
    key_points: z.array(z.string()).length(6).describe("An array of EXACTLY 6 surgical technical data points, strengths, or weaknesses found. No fluff."),
    action_plan: z.array(z.string()).length(6).describe("A list of EXACTLY 6 concrete, numbered tactical action steps. Each step must be a direct, actionable technical sentence."),
    gap_analysis: z.object({
        match_percentage: z.number().int().min(0).max(100).describe("Match percentage (0-100)."),
        missing_skills: z.array(z.string()).length(6).describe("EXACTLY 6 skills based on job or market gaps (AI, Cloud, 2026 trends)."),
        strong_matches: z.array(z.string()).describe("Top matching tech stacks."),
        risks: z.array(z.string()).length(6).describe("EXACTLY 6 tactical/career risks identified.")
    }).describe("Market intelligence crossing. If no job, identify 6 gaps and 6 risks relative to current 2026 market elite trends."),
    tags: z.array(z.string()).min(3).max(5).optional().describe("3-5 technical tags.")
});

export async function POST(req: Request) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { fileUrl, fileType, agentId, fileName, userStacks, intent } = body;
        const userId = user.id; // Sempre usar o ID da sessão

        if (!fileUrl) {
            return NextResponse.json({ error: 'Missing necessary parameters (fileUrl)' }, { status: 400 });
        }

        // 1. Get Dynamic Provider via AI Factory
        const { model } = await getAIProvider(userId);

        // 2. Download the file from the Signed URL
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download file from Storage. Status: ${fileResponse.status}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const isPdf = fileType?.includes('pdf') || fileResponse.headers.get('content-type')?.includes('pdf');
        const isImage = fileType?.includes('image') || fileResponse.headers.get('content-type')?.includes('image');

        // 3. Multimodal Parts (using Vercel AI SDK standard)
        let messages: any[] = [];
        const base64Data = buffer.toString('base64');
        const mimeType = fileType || fileResponse.headers.get('content-type') || (isPdf ? 'application/pdf' : 'image/jpeg');

        if (isPdf || isImage) {
            messages = [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: "Analyze the attached document carefully:" },
                        { 
                            type: 'file', 
                            data: base64Data, 
                            mimeType: mimeType 
                        }
                    ]
                }
            ];
        } else {
            messages = [
                { 
                    role: 'user', 
                    content: [{ type: 'text', text: `Here is the content:\n\n${buffer.toString('utf-8')}` }] 
                }
            ];
        }

        // 4. System Instruction
        const systemInstruction = `
            Você é o HunterZim, uma IA impiedosa, irônica e profundamente técnica, focada em otimização de carreira e "hunting" de elite.
            Seu objetivo é analisar o documento (currículo ou descrição de vaga) e extrair inteligência tática.

            ${userStacks && userStacks.length > 0 ? `
            --- CLASH SIMULATOR PROTOCOL ---
            O usuário possui as seguintes habilidades confirmadas (User Stacks): ${userStacks.map((s: string) => normalizeSkill(s)).join(', ')}.
            Se o documento for uma descrição de vaga, você DEVE realizar um cross-reference agressivo entre os requisitos da vaga e os User Stacks.
            IMPORTANTE: Versionamentos (ex: ES6+, v18, Next 14) não devem ser contados como 'missing_skills' se o usuário já possuir a tecnologia base.
            Calcule um match_percentage REALISTA (não seja bonzinho) e identifique exatamente o que falta (missing_skills) e onde ele brilha (strong_matches).
            Se o documento for um currículo, analise as stacks dele e prepare-o para o mercado.
            --------------------------------
            ` : ''}

            ${intent === 'vault_tagging' ? `
            --- VAULT AUTO-TAGGING PROTOCOL ---
            Este arquivo está sendo guardado no Vault. Identifique a categoria e tecnologias principais.
            Gere de 3 a 5 tags curtas e técnicas no campo 'tags'.
            -----------------------------------
            ` : ''}

            Regras de Retorno (RIGOR TOTAL - DENSIDADE DE 6 ITENS):
            - summary: 1-2 frases sarcásticas, ácidas e cirúrgicas sobre o estado técnico do arquivo.
            - score: de 0 a 100 baseado na soberania técnica.
            - action_plan: EXATAMENTE 6 PASSOS técnicos ultra-específicos. Nada de enchimento de linguiça.
            - key_points: EXATAMENTE 6 PONTOS táticos (forças/vulnerabilidades extraídas).
            - gap_analysis: Os campos 'missing_skills' e 'risks' DEVEM conter EXATAMENTE 6 itens cada. Se for um currículo solo, projete os gaps em relação ao topo do mercado de 2026 (IA, Agentic Systems, Rust, etc).`;

        // 5. Invoke AI SDK (generateObject ensures strict structure across ANY provider)
        const { object: analysisResult } = await generateObject({
            model: model,
            schema: analysisSchema,
            system: systemInstruction,
            messages: messages,
            temperature: 0.4,
        });

        // 6. Save Insight to Database (Client Admin)
        const supabaseAdmin = createAdminClient();

        // Save Auto-Tags if applicable
        if (intent === 'vault_tagging' && analysisResult.tags && fileName) {
            const tagsToInsert = analysisResult.tags.map((t: string) => ({
                user_id: userId,
                file_name: fileName,
                tag: t
            }));
            await supabaseAdmin.from('vault_file_tags').insert(tagsToInsert);
        }

        const { error: dbError } = await supabaseAdmin
            .from('hunter_insights')
            .insert({
                user_id: userId,
                document_name: fileName || 'Documento Desconhecido',
                score: analysisResult.score,
                summary: analysisResult.summary,
                key_points: analysisResult.key_points,
                action_plan: analysisResult.action_plan ?? [],
                gap_analysis: analysisResult.gap_analysis || {},
                status: 'Evaluating'
            });

        if (dbError) { console.error('Failed to save insight:', dbError); }

        return NextResponse.json(analysisResult);

    } catch (error: any) {
        console.error('Analyze API Error:', error);
        return NextResponse.json(
            { error: 'Falha ao processar análise do documento no Backend Neural.', details: error.message },
            { status: 500 }
        );
    }
}

