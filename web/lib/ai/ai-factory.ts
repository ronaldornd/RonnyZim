import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createAdminClient } from '../supabase/admin';

export type AIProvider = 'google' | 'openai' | 'anthropic';

/**
 * Funo de Sanidade: Mapeia nomes de modelos inexistentes ou legados para verses estveis.
 */
function mapModelId(modelId: string, provider: AIProvider): string {
    const id = modelId.toLowerCase();

    if (provider === 'google') {
        if (id.includes('gemini-3')) return 'gemini-2.0-flash'; 
        if (id.includes('gemini-3.1')) return 'gemini-2.0-flash';
        if (!id || id === 'default') return 'gemini-2.0-flash';
        return modelId;
    }

    if (provider === 'openai') {
        if (!id || id === 'default') return 'gpt-4o';
        return modelId;
    }

    if (provider === 'anthropic') {
        if (!id || id === 'default') return 'claude-3-5-sonnet-latest';
        return modelId;
    }

    return modelId;
}

/**
 * AI FACTORY (Single Source of Truth)
 * Resolve a configurao de IA do usurio e retorna instncias prontas do AI SDK.
 */
export async function getAIProvider(userId: string | undefined, type: 'chat' | 'audio' = 'chat') {
    const supabase = createAdminClient();

    // Se no houver usurio, usa defaults do servidor via .env
    if (!userId) {
        const apiKey = process.env.GEMINI_API_KEY;
        const google = createGoogleGenerativeAI({ apiKey });
        const modelId = 'gemini-2.0-flash';
        return { 
            model: google(modelId), 
            providerName: 'google' as AIProvider, 
            apiKey: apiKey!, 
            modelId,
            instance: google 
        };
    }

    // 1. Busca configuraes do usurio
    const preferredModelKey = type === 'audio' ? 'preferred_audio_model' : 'preferred_ai_model';
    
    const { data: facts } = await supabase
        .from('user_facts')
        .select('property_key, value')
        .eq('user_id', userId)
        .in('property_key', [
            'preferred_ai_provider',
            preferredModelKey,
            'gemini_api_key',
            'openai_api_key',
            'anthropic_api_key'
        ]);

    const config = (facts || []).reduce((acc: any, curr) => {
        acc[curr.property_key] = curr.value;
        return acc;
    }, {});

    const providerName: AIProvider = (config.preferred_ai_provider as AIProvider) || 'google';
    const rawModelId = config[preferredModelKey] || 'default';
    const modelId = mapModelId(rawModelId, providerName);

    // 2. Determina a API Key
    let apiKey: string | undefined;
    
    switch (providerName) {
        case 'openai':
            apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error("API Key da OpenAI no configurada.");
            const openai = createOpenAI({ apiKey });
            return { model: openai(modelId), providerName, apiKey, modelId, instance: openai };
            
        case 'anthropic':
            apiKey = config.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error("API Key da Anthropic no configurada.");
            const anthropic = createAnthropic({ apiKey });
            return { model: anthropic(modelId), providerName, apiKey, modelId, instance: anthropic };

        case 'google':
        default:
            apiKey = config.gemini_api_key || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key do Google Gemini no configurada.");
            const google = createGoogleGenerativeAI({ apiKey });
            return { model: google(modelId), providerName: 'google' as AIProvider, apiKey, modelId, instance: google };
    }
}
