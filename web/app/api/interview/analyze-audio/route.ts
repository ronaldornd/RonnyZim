import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
});

export async function POST(req: NextRequest) {
    try {
        const { audioBase64, audio_url, job_id } = await req.json();

        // 1. Setup Supabase (Admin para ler user_facts)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Obter preferências do usuário
        const { data: { user }, error: userError } = await supabase.auth.getUser(
            req.headers.get('Authorization')?.split(' ')[1] || ''
        );

        // Buscar modelo preferido nas configurações (user_facts)
        console.log("DEBUG: Iniciando análise comportamental para o usuário:", user?.id);
        
        const { data: settings, error: settingsError } = await supabase
            .from('user_facts')
            .select('value')
            .eq('user_id', user?.id)
            .eq('property_key', 'preferred_audio_model')
            .maybeSingle();

        if (settingsError) {
            console.error("DEBUG: Erro de busca nas configurações:", settingsError);
        }

        // Se não houver configuração, usar o novo sucessor estável Gemini 2.0 Flash
        const modelId = settings?.value || 'gemini-2.0-flash';
        console.log("DEBUG: Modelo selecionado pelo usuário ou fallback inicial (2.0):", modelId);

        // O SDK v2 as vezes precisa do prefixo completo 'models/' dependendo da configuração.
        // Vamos garantir que passamos como o SDK espera para a v1beta.
        const fullModelId = modelId.startsWith('models/') ? modelId : `models/${modelId}`;
        console.log("DEBUG: FullModelId sendo enviado ao GenAI:", fullModelId);

        // 3. Prompt de Análise Comportamental (Ultra-Sensível)
        const prompt = `
        Aja como um especialista em análise vocal e comportamental para entrevistas de alta performance.
        Sua missão é realizar um post-mortem detalhado do áudio fornecido.
        
        CRITÉRIOS DE ANÁLISE:
        - Detecte micro-hesitações (ééé, hum, pausas maiores que 1.5s).
        - Identifique gagueira ou repetições de palavras iniciais (ex: "E-e-eu acho").
        - avalie o tom de voz (trêmulo, confiante, apressado).
        - Marque os instantes exatos (em SEGUNDOS) onde o candidato perdeu ou ganhou autoridade.
        
        REGRA: Seja rigoroso. Se o candidato gaguejou, marque como 'hesitation'.
        
        RETORNE OBRIGATORIAMENTE APENAS UM JSON VÁLIDO:
        {
          "overall_confidence": 0-100,
          "summary": "Análise crítica do comportamento vocal",
          "markers": [
            { "timestamp": 2.5, "type": "hesitation" | "assertive" | "key_point", "label": "Gagueira detectada" }
          ]
        }
        `;

        // 4. Geração de Conteúdo com Fallback Automático
        let result;
        const contents = [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "audio/webm", data: audioBase64 } }
                ]
            }
        ];

        try {
            result = await genAI.models.generateContent({
                model: fullModelId,
                contents: contents as any
            });
        } catch (genError: any) {
            console.warn(`Modelo ${fullModelId} falhou, tentando fallback para models/gemini-2.0-flash:`, genError.message);
            // Fallback para a família 2.0, sucessora da 1.5 descontinuada
            result = await genAI.models.generateContent({
                model: 'models/gemini-2.0-flash',
                contents: contents as any
            });
        }

        // Extração robusta de texto no SDK v2
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonText = responseText.replace(/```json|```/gi, '').trim();
        
        if (!jsonText) {
            console.error("Gemini retornou resposta vazia para áudio.");
            throw new Error("Falha na análise comportamental: resposta vazia.");
        }

        const analysis = JSON.parse(jsonText);

        // 4. Persistir no Banco (Normalizado para facilitar consulta rápida)
        const { data: sessionData, error: dbError } = await supabase
            .from('interview_sessions')
            .insert({
                user_id: user?.id,
                audio_url,
                behavioral_analysis: analysis,
                overall_confidence: analysis.overall_confidence,
                markers: analysis.markers,
                summary: analysis.summary,
                job_id: job_id // Vincular ao ID do Job/Dossiê
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
