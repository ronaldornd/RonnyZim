import { GoogleGenAI } from '@google/genai';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { getAvailableAudioModels } from '@/lib/gemini/fetchModels';

export async function GET(request: Request) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // Usar o utilitário de busca refinado (SDK v2)
        const modelsAvailable = await getAvailableAudioModels(process.env.GEMINI_API_KEY || '');

        return new Response(JSON.stringify({ models: modelsAvailable }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Gemini Models API Error:', error);
        return new Response(JSON.stringify({
            error: 'Server Error',
            details: error.message || String(error)
        }), { status: 500 });
    }
}
