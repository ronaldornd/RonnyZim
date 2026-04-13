import { SupabaseClient } from '@supabase/supabase-js';

export interface XpGainResult {
    leveledUp: boolean;
    newLevel: number;
    xpGained: number;
}

/**
 * Serviço centralizado de Gamificação do RonnyZim OS.
 */
export class XPService {
    /**
     * Aplica XP a uma stack específica de um usuário.
     * @param supabase Instância do Supabase (Admin preferencialmente)
     * @param userId ID do usuário
     * @param stackName Nome da tecnologia (ex: 'React', 'TypeScript')
     * @param baseXp Quantidade base de XP a ser aplicada
     * @param multiplier Multiplicador (ex: astral buff)
     */
    static async applyXpToStack(
        supabase: SupabaseClient,
        userId: string,
        stackName: string,
        baseXp: number,
        multiplier: number = 1
    ): Promise<XpGainResult> {
        const finalXpToApply = Math.round(baseXp * multiplier);
        let stackId: string | undefined;

        // 1. Resolver Stack ID (Busca por nome Insensitive)
        const { data: found } = await supabase
            .from('global_stacks')
            .select('id')
            .ilike('name', stackName)
            .maybeSingle();

        if (found?.id) {
            stackId = found.id;
        } else {
            // Auto-provisionamento de stack desconhecida (AI Generated)
            const { data: created } = await supabase
                .from('global_stacks')
                .insert({ 
                    name: stackName, 
                    category: 'AI Generated', 
                    icon_slug: stackName.toLowerCase().replace(/[^a-z0-9]/g, '-') 
                })
                .select('id')
                .single();
            stackId = created?.id;
        }

        if (!stackId) return { leveledUp: false, newLevel: 0, xpGained: 0 };

        // 2. Buscar Maestria Atual
        const { data: masteryData } = await supabase
            .from('user_stack_mastery')
            .select('id, current_xp, current_level')
            .eq('user_id', userId)
            .eq('stack_id', stackId)
            .maybeSingle();

        if (masteryData) {
            let newXp = masteryData.current_xp + finalXpToApply;
            let currentLevel = masteryData.current_level;
            let leveledUp = false;

            // Lógica de Level Up Progressivo (XP necessário = Level * 100)
            while (true) {
                const needed = currentLevel * 100;
                if (newXp >= needed) {
                    newXp -= needed;
                    currentLevel++;
                    leveledUp = true;
                } else {
                    break;
                }
            }

            await supabase
                .from('user_stack_mastery')
                .update({ current_xp: newXp, current_level: currentLevel })
                .eq('id', masteryData.id);

            return { leveledUp, newLevel: currentLevel, xpGained: finalXpToApply };
        } else {
            // Inicialização de Maestria (Level 1)
            // Se XP >= 100, sobe para level 2 imediatamente (raro em missões iniciais)
            const isLevelUp = finalXpToApply >= 100;
            const newLevel = isLevelUp ? 2 : 1;
            const remainingXp = isLevelUp ? finalXpToApply - 100 : finalXpToApply;

            await supabase
                .from('user_stack_mastery')
                .insert({ 
                    user_id: userId, 
                    stack_id: stackId, 
                    current_level: newLevel, 
                    current_xp: remainingXp, 
                    is_active: true 
                });

            return { leveledUp: isLevelUp, newLevel, xpGained: finalXpToApply };
        }
    }
}
