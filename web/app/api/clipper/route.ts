import { createAdminClient } from '@/lib/supabase/client';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configurações unificadas de CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER },
        summary: { type: Type.STRING },
        key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        action_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
        gap_analysis: {
            type: Type.OBJECT,
            properties: {
                match_percentage: { type: Type.INTEGER },
                missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                strong_matches: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
    },
    required: ["score", "summary", "key_points", "action_plan"],
};

// Lida com o preflight do CORS
export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const { url, title, content, user_id } = await request.json();

        if (!content || !title) {
            return new Response(JSON.stringify({ error: 'Faltam dados da vaga' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createAdminClient();
        const fallbackUserId = 'b3e88b68-5f42-40f5-9b84-54169c58b11a';
        const finalUserId = user_id || fallbackUserId;
        
        // Limpando o conteúdo para focar apenas nas palavras e economizar tokens
        const cleanContent = content.substring(0, 15000);

        // Fetch User Stacks Reais para personalização profunda do Fit (Gap Analysis)
        const { data: stackData } = await supabase.from('user_stack_mastery')
            .select(`
                global_stacks (
                    name
                )
            `)
            .eq('user_id', finalUserId)
            .eq('is_active', true);
        
        let userStacks = stackData?.map((s: any) => s.global_stacks?.name).filter(Boolean) || [];
        if (userStacks.length === 0) {
           userStacks = ['React', 'Node.js', 'PostgreSQL', 'TypeScript']; // Fallback básico
        }
        
        // Chamada Assíncrona Ativa para a API Local do Gemini
        const systemInstruction = `
Você é o HunterZim, uma IA impiedosa, irônica e profundamente técnica, focada em otimização de carreira e "hunting" de elite.
Analise a descrição dessa vaga crua capturada da web e extraia a inteligência.
--- CLASH SIMULATOR PROTOCOL ---
O usuário possui as seguintes habilidades confirmadas (User Stacks): ${userStacks.join(', ')}.
Realize um cross-reference agressivo entre os requisitos da vaga e as habilidades do usuário.
Calcule um match_percentage REALISTA (não seja bonzinho) e identifique exatamente o que falta (missing_skills) e onde ele domina (strong_matches).
A vaga de origem era da URL: ${url}
Regras: Retorne APENAS o JSON válido preenchido com a análise crua e real.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analise a seguinte vaga capturada: \n\n TÍTULO: ${title}\n\n CONTEÚDO RAW (Scraped): \n${cleanContent}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            }
        });

        const analysisResult = JSON.parse(response.text || '{}');

        // Salvando em hunter_insights AGORA 100% ANALISADO
        const { data, error } = await supabase.from('hunter_insights').insert({
            user_id: finalUserId,
            document_name: title.substring(0, 100),
            score: analysisResult.score || 0,
            summary: analysisResult.summary || "Resumo Indisponível.",
            key_points: analysisResult.key_points || ["URL: " + url],
            action_plan: analysisResult.action_plan || [],
            status: 'Evaluating',
            gap_analysis: analysisResult.gap_analysis || {
                match_percentage: 0,
                missing_skills: [],
                strong_matches: []
            }
        }).select().single();

        if (error) {
            console.error('Falha ao inserir vaga via Clipper', error);
            return new Response(JSON.stringify({ error: 'Erro no Banco de Dados', details: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, insight_id: data.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Falha Crítica na Extensão', details: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}
