import { NextResponse } from 'next/server';
import { Type, Schema, GoogleGenAI } from '@google/genai';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/ai-factory';

const interviewSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        transcribed_user_text: {
            type: Type.STRING,
            description: "A transcrio literal ou resumida do que o usurio disse no udio.",
        },
        evaluation_score: {
            type: Type.INTEGER,
            description: "De 0 a 100, baseado na preciso tcnica e confiana demonstrada.",
        },
        feedback: {
            type: Type.STRING,
            description: "Feedback curto, direto e levemente irnico sobre a resposta.",
        },
        next_question: {
            type: Type.STRING,
            description: "A prxima pergunta tcnica difcil, baseada no contexto da vaga e nas lacunas do usurio.",
        },
        redemption_quest: {
            type: Type.OBJECT,
            nullable: true,
            description: "OBRIGATRIO se evaluation_score < 60. Um desafio tcnico prtico para corrigir o erro do usurio.",
            properties: {
                title: { type: Type.STRING, description: "Ttulo agressivo estilo RPG, ex: '[REDENO] Domnio de Hooks Reativos'" },
                description: { type: Type.STRING, description: "Dossi tcnico denso com briefing de erro e exatamente 4 passos de execuo detalhados." },
                target_stack: { type: Type.STRING, description: "Tecnologia principal (React, Node, etc)" },
                xp_reward: { type: Type.INTEGER, description: "Sempre 100 para redeno." }
            },
            required: ["title", "description", "target_stack", "xp_reward"]
        }
    },
    required: ["transcribed_user_text", "evaluation_score", "feedback", "next_question"],
};

export async function POST(req: Request) {
    try {
        const { audioBase64, jobDescription, gapAnalysis, history = [], userName = 'Operador' } = await req.json();

        if (!audioBase64) {
            return NextResponse.json({ error: 'Faltando udio para processamento.' }, { status: 400 });
        }

        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Usurio no autenticado.' }, { status: 401 });
        }

        // 1. Resolve AI Config via Factory
        const { apiKey, modelId } = await getAIProvider(user.id);
        const ai = new GoogleGenAI({ apiKey });

        const callGemini = async (targetModel: string) => {
            const result = await ai.models.generateContent({
                model: targetModel, 
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `USURIO ATUAL: ${userName}.
                                CONTEXTO DA VAGA: ${jobDescription}. 
                                LACUNAS TCNICAS DO USURIO: ${JSON.stringify(gapAnalysis)}.
                                HISTRICO DA ENTREVISTA: ${JSON.stringify(history)}.
                                
                                Analise a resposta em udio do usurio. Seja o HunterZim: direto e implacvel.
                                Se ele falhou feio (score < 60), voc DEVE preencher o campo 'redemption_quest' com um desafio de cdigo prtico.`
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
                    systemInstruction: `Voc o HunterZim, recrutador tcnico implacvel da RonnyZim OS. 
                    Chame o usurio pelo nome: ${userName}. 
                    Sua misso  testar o DNA tcnico. Se o ${userName} errar algo bsico, d uma nota baixa e crie uma Misso de Redeno rica em detalhes tcnicos no Knowledge Nexus via 'redemption_quest'. O campo 'description' da quest deve ser um mini-dossi com 4 passos claros.`,
                    responseMimeType: "application/json",
                    responseSchema: interviewSchema,
                }
            });
            return result.text;
        };

        let responseText;
        try {
            // Usa o modelo preferido do usurio (j mapeado para um estvel se necessrio)
            responseText = await callGemini(modelId);
        } catch (err: any) {
            console.warn(`Modelo primrio ${modelId} falhou (${err.message}). Tentando fallback para gemini-1.5-flash...`);
            try {
                // Fallback seguro de ltima instncia
                responseText = await callGemini('gemini-1.5-flash');
            } catch (fallbackErr: any) {
                throw new Error(`Todos os modelos falharam na simulao crtica. Erro final: ${fallbackErr.message}`);
            }
        }

        if (!responseText) {
            throw new Error("Gemini retornou resposta vazia aps todas as tentativas.");
        }

        const parsedResponse = JSON.parse(responseText);
        let questGenerated = false;

        // Se houver uma quest de redeno e um usurio logado, salva no Supabase
        if (parsedResponse.evaluation_score < 60 && parsedResponse.redemption_quest) {
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
                console.error("Erro ao inserir quest de redeno:", questError);
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
