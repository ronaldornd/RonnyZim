import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/client';

// Initialize the Google Gen AI client explicitly forcing GEMINI_API_KEY
// to prevent collisions with GOOGLE_API_KEY which might expect OAuth.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Strictly define the expected JSON structure from Gemini
const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "An overall score from 0 to 100 representing the quality or match.",
        },
        summary: {
            type: Type.STRING,
            description: "A concise executive summary of the document (appx 2-3 sentences).",
        },
        key_points: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "An array of 3-5 key data points, strengths, or weaknesses found.",
        },
        action_plan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3 to 5 concrete, numbered tactical action steps the user must take to improve or succeed. Each step must be a direct, actionable sentence (e.g., 'Adicione métricas quantificáveis ao cargo de Tech Lead, como: reduzi tempo de deploy em 40%.'). No vague advice.",
        },
        gap_analysis: {
            type: Type.OBJECT,
            properties: {
                match_percentage: { type: Type.INTEGER, description: "Percentage of match between user skills and job requirements (0-100)." },
                missing_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills requested by the job that the user lacks or has at a low level. MANDATORY for density." },
                strong_matches: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills where the user perfectly matches or exceeds the job requirements." },
                risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tactical or career risks identified in the document (Mínimo de 3). MANDATORY for density." }
            },
            description: "A cross-reference analysis. If no job is provided, analyze gaps and risks relative to current 2026 market trends (e.g., missing AI, Cloud or specific stack expertise)."
        },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3-5 technical or category tags for document organization (e.g., 'React', 'CV', 'Financial', 'API')."
        }
    },
    required: ["score", "summary", "key_points", "action_plan"],
};

export async function POST(req: Request) {
    try {
        const { fileUrl, fileType, agentId, userId, fileName, userStacks, intent } = await req.json();

        if (!fileUrl || !userId) {
            return NextResponse.json({ error: 'Missing necessary parameters (fileUrl or userId)' }, { status: 400 });
        }

        let analyzeModel = 'gemini-3-flash-preview';
        try {
            const adminClient = createAdminClient();
            const { data: facts } = await adminClient.from('user_facts').select('value').eq('user_id', userId).eq('property_key', 'preferred_ai_model').limit(1);
            if (facts && facts.length > 0 && facts[0].value) {
                analyzeModel = facts[0].value;
            }
        } catch (e) {
            console.error('Failed to fetch preferred_ai_model', e);
        }

        // 1. Download the file from the Signed URL
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download file from Storage. Status: ${fileResponse.status}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let geminiContents: any[] = [];
        const isPdf = fileType?.includes('pdf') || fileResponse.headers.get('content-type')?.includes('pdf');
        const isImage = fileType?.includes('image') || fileResponse.headers.get('content-type')?.includes('image');

        // 2. Multimodal Extraction
        if (isPdf || isImage) {
            const mimeType = isPdf ? 'application/pdf' : (fileType || fileResponse.headers.get('content-type') || 'image/jpeg');
            const base64Data = buffer.toString('base64');

            geminiContents = [
                {
                    role: 'user',
                    parts: [
                        { text: "Analyze the attached document carefully:" },
                        { inlineData: { data: base64Data, mimeType: mimeType } }
                    ]
                }
            ];
        } else {
            geminiContents = [
                { role: 'user', parts: [{ text: `Here is the content:\n\n${buffer.toString('utf-8')}` }] }
            ];
        }

        // 3. Invoke Google Gemini
        let systemInstruction = `
            Você é o HunterZim, uma IA impiedosa, irônica e profundamente técnica, focada em otimização de carreira e "hunting" de elite.
            Seu objetivo é analisar o documento (currículo ou descrição de vaga) e extrair inteligência tática.

            ${userStacks && userStacks.length > 0 ? `
            --- CLASH SIMULATOR PROTOCOL ---
            O usuário possui as seguintes habilidades confirmadas (User Stacks): ${userStacks.join(', ')}.
            Se o documento for uma descrição de vaga, você DEVE realizar um cross-reference agressivo entre os requisitos da vaga e os User Stacks.
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

            Regras de Retorno (DENSIDADE MÁXIMA):
            - summary: 1-2 frases sarcásticas e ácidas sobre o estado atual.
            - score: de 0 a 100 baseada na qualidade do documento ou no índice de poder de mercado.
            - action_plan: 4 a 6 passos CONCRETOS e densos. SEM CLICHÊS.
            - key_points: Principais extrações técnicas (4 a 6 itens).
            - gap_analysis: SEMPRE PREENCHIDO. Se não houver vaga, identifique GAPS DE MERCADO (tecnologias que faltam no CV para ser elite em 2026) e RISCOS TÁTICOS (ex: "Excesso de tempo em tecnologias legadas", "Falta de portfólio público").
            - Nenhum markdown externo. Apenas o objeto JSON puro.`;

        const response = await ai.models.generateContent({
            model: analyzeModel,
            contents: geminiContents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            }
        });

        const responseText = response.text;

        if (!responseText) {
            throw new Error("Gemini returned an empty response.");
        }

        // 4. Parse output and Validate
        const analysisResult = JSON.parse(responseText);

        // 5. Salvar Insight no banco de dados (CRM do Hub) usando Client Admin
        const supabaseAdmin = createAdminClient();

        // [Phase 5] Save Auto-Tags if applicable
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

        if (dbError) { /* Non-fatal: insight save failed, analysis still returned */ }

        return NextResponse.json(analysisResult);

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Falha ao processar análise do documento no Backend Native.', details: error.message },
            { status: 500 }
        );
    }
}

