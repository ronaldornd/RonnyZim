import { createRouteHandlerClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/ai-factory';

export async function POST(req: NextRequest) {
    try {
        const { audioBase64, audio_url, job_id } = await req.json();

        // 1. Setup Supabase (Autenticação Segura)
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ 
                error: 'Sessão expirada ou usuário não autenticado para análise de áudio.' 
            }, { status: 401 });
        }

        // 2. Resolve AI Config via Factory (Tipo: Audio)
        const { apiKey, modelId } = await getAIProvider(user.id, 'audio');
        const genAI = new GoogleGenAI({ apiKey });

        const fullModelId = modelId.startsWith('models/') ? modelId : `models/${modelId}`;

        // 3. Prompt de Análise Comportamental
        const prompt = `
        Aja como um especialista em análise vocal e comportamental para entrevistas de alta performance.
        Sua missão é realizar um post-mortem detalhado do áudio fornecido.
        
        CRITÉRIOS DE ANÁLISE:
        - Detecte micro-hesitações (ééé, hum, pausas maiores que 1.5s).
        - Identifique gagueira ou repetições de palavras iniciais (ex: "E-e-eu acho").
        - avalie o tom de voz (trêmulo, confiante, apressado).
        - Marque os instantes exatos (em SEGUNDOS) onde o candidato perdeu ou ganhou autoridade.
        
        RETORNE OBRIGATORIAMENTE APENAS UM JSON VÁLIDO:
        {
          "overall_confidence": 0-100,
          "summary": "Análise crítica do comportamento vocal",
          "markers": [
            { "timestamp": 2.5, "type": "hesitation" | "assertive" | "key_point", "label": "Gagueira detectada" }
          ]
        }
        `;

        // 4. Geração de Conteúdo
        const contents = [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
                ]
            }
        ];

        let result;
        try {
            result = await genAI.models.generateContent({
                model: modelId,
                contents: contents as any
            });
        } catch (genError: any) {
            console.warn(`Modelo ${fullModelId} falhou, tentando fallback para gemini-2.0-flash...`);
            result = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: contents as any
            });
        }

        const responseText = result.response.text();
        const jsonText = responseText.replace(/```json|```/gi, '').trim();
        
        if (!jsonText) {
            throw new Error("Falha na análise comportamental: resposta vazia.");
        }

        const analysis = JSON.parse(jsonText);

        // 5. Persistir no Banco
        const { data: sessionData, error: dbError } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: user.id,
                audio_url,
                behavioral_analysis: analysis,
                overall_confidence: analysis.overall_confidence,
                markers: analysis.markers,
                summary: analysis.summary,
                job_id: job_id
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error("Analysis API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
