'use server';

import { createRouteHandlerClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/security/encryption';
import { revalidatePath } from 'next/cache';

export interface SettingUpdate {
    category: string;
    property_key: string;
    value: string;
}

/**
 * Salva as configurações do usuário de forma segura.
 * Criptografa chaves de API ('Security' category) antes de persistir.
 */
export async function saveSettingsAction(updates: SettingUpdate[]) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('Usuário não autenticado.');
        }

        const userId = user.id;

        for (const update of updates) {
            let finalValue = update.value;

            // Se for uma chave de segurança, criptografa
            if (update.category === 'Security' && update.property_key.endsWith('_api_key') && finalValue) {
                // Só criptografa se não for uma string vazia ou placeholder
                if (finalValue.length > 5 && !finalValue.startsWith('enc:')) {
                    finalValue = `enc:${encrypt(finalValue)}`;
                }
            }

            const { error: upsertError } = await supabase
                .from('user_facts')
                .upsert({
                    user_id: userId,
                    category: update.category,
                    property_key: update.property_key,
                    value: finalValue
                }, { onConflict: 'user_id,property_key' });

            if (upsertError) throw upsertError;
        }

        revalidatePath('/os');
        return { success: true };

    } catch (error: any) {
        console.error('saveSettingsAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Protocolo de Limpeza Profunda (Wipe Memory).
 * Remove TODOS os dados do usuário do banco e storage.
 */
export async function wipeMemoryAction() {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Usuário não autenticado.');
        const userId = user.id;

        // 1. Limpar Banco de Dados (Ordem de dependência)
        const tablesToDelete = [
            'dossiers', // Depende de jobs
            'interview_sessions', // Depende de hunter_insights
            'hunter_insights',
            'jobs',
            'user_stack_mastery',
            'user_facts',
            'quests',
            'daily_quests',
            'posts',
            'vault_file_tags'
        ];

        for (const table of tablesToDelete) {
            // Alguns podem falhar se a tabela não existir ou não tiver user_id direto (fazemos check por segurança)
            try {
                // Para dossiers, precisamos de uma lógica diferente pois não tem user_id direto,
                // mas é deletado em cascata ou via join se necessário. 
                // Simplificando: a maioria tem user_id.
                if (table === 'dossiers') {
                    // Dossiers são vinculados a jobs, deletando jobs com Cascade deve resolver, 
                    // mas forçaremos via subquery se possível
                    await supabase.from('dossiers').delete().filter('job_id', 'in', 
                        supabase.from('jobs').select('id').eq('user_id', userId)
                    );
                } else {
                    await supabase.from(table).delete().eq('user_id', userId);
                }
            } catch (e) {
                console.warn(`Wipe warning on ${table}:`, e);
            }
        }

        // 2. Resetar Perfil
        await supabase.from('profiles').update({
            full_name: null,
            display_name: null,
            bio: null,
            avatar_url: null,
            xp: 0,
            xp_total: 0,
            level: 1,
            skills: {},
            natal_chart: null
        }).eq('id', userId);

        // 3. Limpar Storage
        const buckets = ['user_files', 'interview_audio', 'flowgenius_media', 'audio-cache'];
        for (const bucket of buckets) {
            try {
                const { data: files } = await supabase.storage.from(bucket).list(userId);
                if (files && files.length > 0) {
                    const paths = files.map(f => `${userId}/${f.name}`);
                    await supabase.storage.from(bucket).remove(paths);
                }
                
                // Limpar arquivos na raiz se o bucket for de cache direto
                const { data: rootFiles } = await supabase.storage.from(bucket).list();
                if (rootFiles && bucket === 'audio-cache') {
                    const paths = rootFiles.map(f => f.name);
                    await supabase.storage.from(bucket).remove(paths);
                }
            } catch (e) {
                console.warn(`Storage wipe warning on bucket ${bucket}:`, e);
            }
        }

        revalidatePath('/', 'layout');
        return { success: true };

    } catch (error: any) {
        console.error('wipeMemoryAction Error:', error);
        return { success: false, error: error.message };
    }
}
