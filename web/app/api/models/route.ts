import { GoogleGenAI } from '@google/genai';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { provider = 'google', apiKey: clientApiKey } = await request.json();

        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        let models: any[] = [];

        if (provider === 'google') {
            const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('Gemini API Key missing');
            
            const genAI = new GoogleGenAI({ apiKey });
            const response = await genAI.models.list();
            
            for await (const model of response as any) {
                const name = model.name.toLowerCase();
                // Filtro liberal para atingir a meta de 20 modelos (incluindo exp e flash)
                if (name.includes('embedding') || name.includes('imagen') || name.includes('aqa')) continue;
                
                models.push({
                    id: model.name.replace('models/', ''),
                    displayName: model.displayName || model.name,
                    description: model.description,
                    family: name.includes('gemini-3.1') ? 'Gemini 3.1' : 
                            name.includes('gemini-3') ? 'Gemini 3.0' : 
                            name.includes('gemini-2.5') ? 'Gemini 2.5' : 'Gemini Legacy'
                });
            }
        } 
        else if (provider === 'openai') {
            const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OpenAI API Key missing');

            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            
            if (!res.ok) throw new Error('Failed to fetch OpenAI models');
            const data = await res.json();
            
            models = data.data
                .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o2'))
                .map((m: any) => ({
                    id: m.id,
                    displayName: m.id.toUpperCase(),
                    family: m.id.includes('o2') ? 'o2 (New)' :
                            m.id.includes('o1') ? 'o1 (Reasoning)' :
                            m.id.includes('gpt-4o') ? 'GPT-4o (Standard)' : 'GPT-Legacy'
                }));
        }
        else if (provider === 'anthropic') {
            const apiKey = clientApiKey || process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error('Anthropic API Key missing');

            const res = await fetch('https://api.anthropic.com/v1/models', {
                headers: { 
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });
            
            if (!res.ok) throw new Error('Failed to fetch Anthropic models');
            const data = await res.json();
            
            models = (data.data || []).map((m: any) => ({
                id: m.id,
                displayName: m.display_name || m.id,
                family: m.id.includes('claude-4') ? 'Claude 4' :
                        m.id.includes('claude-3-5') ? 'Claude 3.5' : 'Claude Legacy'
            }));
        }

        return new Response(JSON.stringify({ models }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Models API Error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Server Error'
        }), { status: 500 });
    }
}
