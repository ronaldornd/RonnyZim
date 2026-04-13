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
