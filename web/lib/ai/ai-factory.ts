import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createAdminClient } from '../supabase/admin';

export type AIProvider = 'google' | 'openai' | 'anthropic';

export async function getAIProvider(userId: string) {
    const supabase = createAdminClient();

    // 1. Fetch User AI Configs
    const { data: facts } = await supabase
        .from('user_facts')
        .select('property_key, value')
        .eq('user_id', userId)
        .in('property_key', [
            'preferred_ai_provider',
            'gemini_api_key',
            'openai_api_key',
            'anthropic_api_key',
            'preferred_ai_model'
        ]);

    const config = (facts || []).reduce((acc: any, curr) => {
        acc[curr.property_key] = curr.value;
        return acc;
    }, {});

    const providerType: AIProvider = (config.preferred_ai_provider as AIProvider) || 'google';
    const modelId = config.preferred_ai_model || (providerType === 'google' ? 'gemini-2.0-flash' : providerType === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-latest');

    // 2. Determine API Key
    let apiKey: string | undefined;
    
    switch (providerType) {
        case 'openai':
            apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
            const openai = createOpenAI({ apiKey });
            return { model: openai(modelId), provider: 'openai' };
            
        case 'anthropic':
            apiKey = config.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
            const anthropic = createAnthropic({ apiKey });
            return { model: anthropic(modelId), provider: 'anthropic' };

        case 'google':
        default:
            apiKey = config.gemini_api_key || process.env.GEMINI_API_KEY;
            const google = createGoogleGenerativeAI({ apiKey });
            return { model: google(modelId), provider: 'google' };
    }
}
