import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';

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
            items: { type: Type.STRING },
            description: "An array of EXACTLY 6 surgical technical data points, strengths, or weaknesses found. No fluff.",
        },
        action_plan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of EXACTLY 6 concrete, numbered tactical action steps. Each step must be a direct, actionable technical sentence (e.g., 'Refatore o middleware de cache utilizando Redis Pub/Sub para lidar com race conditions'). No vague advice.",
        },
        gap_analysis: {
            type: Type.OBJECT,
            properties: {
                match_percentage: { type: Type.INTEGER, description: "Match percentage (0-100)." },
                missing_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "EXACTLY 6 skills based on job or market gaps (AI, Cloud, 2026 trends). MANDATORY for density." },
                strong_matches: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top matching tech stacks." },
                risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "EXACTLY 6 tactical/career risks identified. MANDATORY for density." }
            },
            required: ["missing_skills", "risks"],
            description: "Market intelligence crossing. If no job, identify 6 gaps and 6 risks relative to current 2026 market elite trends."
        },
        tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 technical tags."
        }
    },
    required: ["score", "summary", "key_points", "action_plan", "gap_analysis"],
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

            Regras de Retorno (RIGOR TOTAL - DENSIDADE DE 6 ITENS):
            - summary: 1-2 frases sarcásticas, ácidas e cirúrgicas sobre o estado técnico do arquivo.
            - score: de 0 a 100 baseado na soberania técnica.
            - action_plan: EXATAMENTE 6 PASSOS técnicos ultra-específicos. Nada de enchimento de linguiça.
            - key_points: EXATAMENTE 6 PONTOS táticos (forças/vulnerabilidades extraídas).
            - gap_analysis: Os campos 'missing_skills' e 'risks' DEVEM conter EXATAMENTE 6 itens cada. Se for um currículo solo, projete os gaps em relação ao topo do mercado de 2026 (IA, Agentic Systems, Rust, etc).
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

