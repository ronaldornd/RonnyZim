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
            type: Type.STRING,
            description: "A suggested next strategic action or improvement plan.",
        }
    },
    required: ["score", "summary", "key_points", "action_plan"],
};

export async function POST(req: Request) {
    try {
        const { fileUrl, fileType, agentId, userId, fileName } = await req.json();

        if (!fileUrl || !userId) {
            return NextResponse.json({ error: 'Missing necessary parameters (fileUrl or userId)' }, { status: 400 });
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
        const systemInstruction = "Você é o HunterZim. O usuário enviou um documento que pode ser um Currículo (CV) ou uma Descrição de Vaga (Job). Analise-o criticamente. Retorne ESTRITAMENTE um JSON com as chaves: score (0 a 100 indicando senioridade ou dificuldade), summary (resumo executivo curto), key_points (lista de pontos fortes/fracos) e action_plan (próxima ação recomendada). Sem markdown ao redor, apenas o objeto JSON.";

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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

        const { error: dbError } = await supabaseAdmin
            .from('hunter_insights')
            .insert({
                user_id: userId,
                document_name: fileName || 'Documento Desconhecido',
                score: analysisResult.score,
                summary: analysisResult.summary,
                key_points: analysisResult.key_points,
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
