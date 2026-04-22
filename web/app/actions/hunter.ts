"use server";

import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createStreamableValue } from "@ai-sdk/rsc";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAIProvider } from "@/lib/ai/ai-factory";

// Schema para blindagem de entrada
const SearchSchema = z.object({
  query: z.string().min(3),
});

// Tipagem baseada no retorno do Tavily MCP
interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

// genAI agora é instanciado via Factory dentro de cada Action

/**
 * AÇÃO: Busca ativa de vagas via MCP Tavily
 */
export async function searchJobsAction(formData: FormData) {
  const query = formData.get("query") as string;
  const validated = SearchSchema.safeParse({ query });

  if (!validated.success) {
    throw new Error("Consulta inválida. Mínimo de 3 caracteres.");
  }

  const stream = createStreamableValue();

  // Execução em background
  (async () => {
    try {
      stream.update({ status: "SEARCHING", message: "Iniciando Varredura de Mercado..." });

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${query} developer jobs last 7 days`,
          search_depth: "advanced",
          max_results: 6
        })
      });

      const data = await response.json();
      const results: TavilyResult[] = data.results || [];

      // Stream das vagas encontradas
      for (const res of results) {
        stream.update({ 
          status: "FOUND", 
          data: {
            id: crypto.randomUUID(),
            title: res.title,
            url: res.url,
            summary: (res.content || "").substring(0, 200) + "...",
            full_content: res.content || "",
            published_at: res.published_date || new Date().toISOString()
          } 
        });
        // Pequeno delay para efeito visual holográfico
        await new Promise(r => setTimeout(r, 400));
      }

      stream.done({ status: "COMPLETED" });
    } catch (error) {
      console.error("Scanner Error:", error);
      stream.error("UPLINK_FAILED: Falha na conexão com Tavily.");
    }
  })();

  return { output: stream.value };
}

/**
 * AÇÃO: Cálculo de Match Score via Gemini 3.1
 */
export async function calculateMatchAction(jobContent: string, profileSummary: string) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { apiKey, modelId } = await getAIProvider(user.id);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    
    const prompt = `
      Analise o fit cultural e técnico entre este usuário e a vaga.
      USUÁRIO: ${profileSummary}
      VAGA: ${jobContent}
      
      Retorne APENAS um JSON no formato:
      {
        "score": number (0-100),
        "reasoning": "string curta e tática",
        "missing_skills": ["string"],
        "strong_matches": ["string"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Cleaning the response to ensure valid JSON
    const jsonString = text.replace(/```json|```/g, "").trim();
    const json = JSON.parse(jsonString);

    return json;
  } catch (error) {
    console.error("Match Analysis Error:", error);
    return { score: 0, reasoning: "Falha na análise neural.", missing_skills: [], strong_matches: [] };
  }
}

/**
 * AÇÃO: Persistência Explícita (Adquirir Alvo)
 */
export async function saveTargetAction(jobData: any) {
  const supabase = await createRouteHandlerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado.");

  const { data, error } = await supabase
    .from("hunter_insights")
    .insert([{
      user_id: user.id,
      document_name: jobData.title,
      document_type: "Job",
      score: jobData.score || 0,
      summary: jobData.summary || "",
      status: "Evaluating",
      gap_analysis: {
        match_percentage: jobData.score,
        missing_skills: jobData.missing_skills || [],
        strong_matches: jobData.strong_matches || []
      }
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * AÇÃO: Análise Multimodal de Entrevista (Listening Room)
 * Processa o áudio da resposta e gera o feedback do HunterZim
 */
export async function analyzeInterviewAction(formData: FormData) {
  try {
    const audioFile = formData.get("audio") as File;
    const jobDescription = formData.get("jobDescription") as string;
    const historyJson = formData.get("history") as string;
    const userName = formData.get("userName") as string;
    const jobId = formData.get("jobId") as string;

    if (!audioFile) throw new Error("Áudio não detectado.");

    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const { apiKey, modelId } = await getAIProvider(user.id, 'audio');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    
    // Converter File para Base64 para o SDK do Gemini
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Você é o HunterZim, um recrutador técnico sarcástico e extremamente exigente de uma elite hacker.
      Analise a resposta em áudio do candidato "${userName}" para a vaga descrita abaixo.
      
      CONTEXTO DA VAGA:
      ${jobDescription}
      
      HISTÓRICO DA CONVERSA:
      ${historyJson}
      
      SUA TAREFA:
      1. Transcreva o que o usuário disse.
      2. Avalie a resposta tecnicamente (0-100).
      3. Forneça um feedback curto, ácido e tático (Hacker Critique).
      4. Identifique "Red Flags" ou erros técnicos gritantes.
      5. Analise o tom: ele soa confiante, arrogante, inseguro ou prolixo?
      6. Elabore a PRÓXIMA pergunta desafiadora.
      
      Retorne APENAS um JSON no formato:
      {
        "transcribed_text": "text",
        "evaluation_score": number,
        "feedback": "critique",
        "next_question": "next",
        "quest_generated": boolean,
        "analysis": {
          "technical_gaps": ["skill1", "skill2"],
          "behavioral_traits": ["trait1", "trait2"],
          "red_flags": ["flag1"]
        }
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioFile.type || "audio/webm"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json|```/g, "").trim();
    const json = JSON.parse(jsonString);

    // 2. Upload do Áudio para o Storage (para o Listening Room)
    const fileName = `${user.id}/${Date.now()}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('interview_audio')
        .upload(fileName, audioFile);

    if (uploadError) console.warn("Erro ao subir áudio:", uploadError);
    const audioUrl = uploadData ? supabase.storage.from('interview_audio').getPublicUrl(fileName).data.publicUrl : "";

    // 3. Persistir sessão para análise posterior (Listening Room)
    await supabase.from('interview_sessions').insert({
        user_id: user.id,
        job_id: jobId,
        audio_url: audioUrl,
        summary: json.feedback,
        behavioral_analysis: {
            overall_confidence: json.evaluation_score,
            summary: json.feedback,
            technical_gaps: json.analysis?.technical_gaps || [],
            behavioral_traits: json.analysis?.behavioral_traits || [],
            red_flags: json.analysis?.red_flags || [],
            markers: [
                { timestamp: 2, type: 'key_point', label: 'Início da Resposta' },
                { timestamp: 5, type: json.evaluation_score > 60 ? 'assertive' : 'hesitation', label: 'Análise de Tom' }
            ]
        }
    });

    // 4. Criar Missão de Redenção real se necessário
    if (json.quest_generated) {
        await supabase.from('quests').insert({
            user_id: user.id,
            title: `Redenção: ${json.analysis?.technical_gaps?.[0] || 'Desafio Técnico'}`,
            description: `O Hunter-Zim detectou uma falha crítica na sua entrevista. Domine este tópico para recuperar sua reputação. Feedback: ${json.feedback}`,
            difficulty: 'hard',
            xp_reward: 250,
            status: 'active'
        });
    }

    // 5. Salvar histórico no Insight para persistência (Continuidade)
    await supabase.from('hunter_insights')
        .update({ action_plan: { history: JSON.parse(historyJson), last_state: 'waiting_for_user' } })
        .eq('id', jobId);

    return { success: true, ...json };
  } catch (error: any) {
    console.error("Interview Analysis Error:", error);
    return { success: false, error: error.message || "Erro na análise neural do áudio." };
  }
}
