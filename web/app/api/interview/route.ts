import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createRouteHandlerClient } from '@/lib/supabase/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const interviewSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        transcribed_user_text: {
            type: Type.STRING,
            description: "A transcrição literal ou resumida do que o usuário disse no áudio.",
        },
        evaluation_score: {
            type: Type.INTEGER,
            description: "De 0 a 100, baseado na precisão técnica e confiança demonstrada.",
        },
        feedback: {
            type: Type.STRING,
            description: "Feedback curto, direto e levemente irônico sobre a resposta.",
        },
        next_question: {
            type: Type.STRING,
            description: "A próxima pergunta técnica difícil, baseada no contexto da vaga e nas lacunas do usuário.",
        },
        redemption_quest: {
            type: Type.OBJECT,
            nullable: true,
            description: "OBRIGATÓRIO se evaluation_score < 60. Um desafio técnico prático para corrigir o erro do usuário.",
            properties: {
                title: { type: Type.STRING, description: "Título agressivo estilo RPG, ex: '[REDENÇÃO] Domínio de Hooks Reativos'" },
                description: { type: Type.STRING, description: "Dossiê técnico denso com briefing de erro e exatamente 4 passos de execução detalhados." },
                target_stack: { type: Type.STRING, description: "Tecnologia principal (React, Node, etc)" },
                xp_reward: { type: Type.INTEGER, description: "Sempre 100 para redenção." }
            },
            required: ["title", "description", "target_stack", "xp_reward"]
        }
    },
    required: ["transcribed_user_text", "evaluation_score", "feedback", "next_question"],
};

export async function POST(req: Request) {
    try {
        const { audioBase64, jobDescription, gapAnalysis, history = [], userName = 'Operador', modelId: localModelId } = await req.json();

        if (!audioBase64) {
            return NextResponse.json({ error: 'Faltando áudio para processamento.' }, { status: 400 });
        }

        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        let modelId = localModelId || 'gemini-1.5-flash'; // Fallback base
        if (user) {
            const { data: facts } = await supabase.from('user_facts').select('value').eq('user_id', user.id).eq('property_key', 'preferred_ai_model').limit(1);
            if (facts && facts.length > 0 && facts[0].value) {
                modelId = facts[0].value;
            }
        }

        const callGemini = async (targetModel: string) => {
            const result = await ai.models.generateContent({
                model: targetModel, 
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `USUÁRIO ATUAL: ${userName}.
                                CONTEXTO DA VAGA: ${jobDescription}. 
                                LACUNAS TÉCNICAS DO USUÁRIO: ${JSON.stringify(gapAnalysis)}.
                                HISTÓRICO DA ENTREVISTA: ${JSON.stringify(history)}.
                                
                                Analise a resposta em áudio do usuário. Seja o HunterZim: direto e implacável.
                                Se ele falhou feio (score < 60), você DEVE preencher o campo 'redemption_quest' com um desafio de código prático.`
                            },
                            {
                                inlineData: {
                                    data: audioBase64,
                                    mimeType: "audio/webm"
                                }
                            }
                        ]
                    }
                ],
                config: {
                    systemInstruction: `Você é o HunterZim, recrutador técnico implacável da RonnyZim OS. 
                    Chame o usuário pelo nome: ${userName}. 
                    Sua missão é testar o DNA técnico. Se o ${userName} errar algo básico, dê uma nota baixa e crie uma Missão de Redenção rica em detalhes técnicos no Knowledge Nexus via 'redemption_quest'. O campo 'description' da quest deve ser um mini-dossiê com 4 passos claros.`,
                    responseMimeType: "application/json",
                    responseSchema: interviewSchema,
                }
            });
            return result.text;
        };

        let responseText;
        try {
            responseText = await callGemini(modelId);
        } catch (err: any) {
            console.warn(`Modelo primário ${modelId} falhou (${err.message}). Tentando fallback para gemini-3.1-pro-preview...`);
            try {
                // Se o erro foi no 3.1-pro, tenta o flash-lite antes de desistir
                const fallbackModel = modelId === 'gemini-3.1-pro-preview' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3.1-pro-preview';
                responseText = await callGemini(fallbackModel);
            } catch (fallbackErr: any) {
                console.warn(`Fallback ${modelId === 'gemini-3.1-pro-preview' ? '3.1-flash-lite' : '3.1-pro'} falhou. Tentando último recurso: gemini-2.5-pro...`);
                try {
                    responseText = await callGemini('gemini-2.5-pro');
                } catch (finalErr: any) {
                    throw new Error(`Todos os modelos falharam na simulação crítica. Erro final: ${finalErr.message}`);
                }
            }
        }

        if (!responseText) {
            throw new Error("Gemini retornou resposta vazia após todas as tentativas.");
        }

        const parsedResponse = JSON.parse(responseText);
        let questGenerated = false;

        // Se houver uma quest de redenção e um usuário logado, salva no Supabase
        if (parsedResponse.evaluation_score < 60 && parsedResponse.redemption_quest && user) {
            const { error: questError } = await supabase
                .from('daily_quests')
                .insert({
                    user_id: user.id,
                    title: parsedResponse.redemption_quest.title,
                    description: parsedResponse.redemption_quest.description,
                    target_stack: parsedResponse.redemption_quest.target_stack,
                    xp_reward: parsedResponse.redemption_quest.xp_reward,
                    status: 'Active'
                });

            if (!questError) {
                questGenerated = true;
            } else {
                console.error("Erro ao inserir quest de redenção:", questError);
            }
        }

        return NextResponse.json({
            ...parsedResponse,
            quest_generated: questGenerated
        });

    } catch (error: any) {
        console.error("Interview API Error:", error);
        
        // Detectar especificamente erro de Quota (429 ou RESOURCE_EXHAUSTED)
        const isQuotaError = error.message?.includes('429') || 
                            error.message?.includes('RESOURCE_EXHAUSTED') ||
                            JSON.stringify(error).includes('quota');

        if (isQuotaError) {
            return NextResponse.json(
                { 
                    error: 'ENERGIA ESGOTADA (Quota Excedida)', 
                    details: 'O limite de uso gratuito do Gemini foi atingido. O HunterZim precisa de tempo para recarregar. Tente novamente em alguns minutos ou mude de modelo.',
                    code: 'QUOTA_EXHAUSTED'
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'Falha ao processar entrevista de voz.', details: error.message },
            { status: 500 }
        );
    }
}
