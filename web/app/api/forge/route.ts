import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/ai-factory';

const cvSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        cover_letter: {
            type: Type.STRING,
            description: "A punchy, 2-paragraph Cover Letter.",
        },
        resume_summary: {
            type: Type.STRING,
            description: "A 3-line Resume Objective/Summary.",
        }
    },
    required: ["cover_letter", "resume_summary"]
};

export async function POST(request: Request) {
    try {
        const supabaseAuth = await createRouteHandlerClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await request.json();
        const { job_requirements, strong_matches, missing_skills } = body;
        const user_id = user.id;

        if (!job_requirements) {
            return new Response(JSON.stringify({ error: 'Missing requirements.' }), { status: 400 });
        }

        const prompt = `You are an expert tech recruiter rewriting a candidate's presentation. 
Based on the job requirements, the candidate's strong matches, and missing skills, write:
1. A punchy, 2-paragraph Cover Letter.
2. A 3-line Resume Objective/Summary.
Focus heavily on the strong matches and use a confident, professional tone to mitigate the missing skills.
Respond in clear, professional Portuguese (PT-BR).
Return JSON.

JOB REQUIREMENTS:
${job_requirements}

STRONG MATCHES:
${strong_matches?.join(', ') || 'N/A'}

MISSING SKILLS:
${missing_skills?.join(', ') || 'N/A'}
`;

        const supabase = createAdminClient();

        // 1. Resolve AI Config via Factory
        const { apiKey, modelId } = await getAIProvider(user_id);
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: cvSchema,
                temperature: 0.7
            }
        });

        const result = JSON.parse(response.text || '{}');
        return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error('CV Forge Error:', err);
        return new Response(JSON.stringify({ error: 'Forge Error', details: err.message }), { status: 500 });
    }
}
