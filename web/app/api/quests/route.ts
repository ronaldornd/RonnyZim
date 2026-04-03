import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized, missing userId' }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();

        let { data: quests, error } = await supabaseAdmin
            .from('daily_quests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'Active')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }



        return NextResponse.json({ quests });
    } catch (e: any) {
        return NextResponse.json({ error: 'Erro interno', details: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createAdminClient();
        const { questId, userId } = await req.json();

        if (!questId || !userId) {
            return NextResponse.json({ error: 'Quest ID e User ID são obrigatórios' }, { status: 400 });
        }

        // 1. Validar e buscar a quest ativa
        const { data: questData, error: questError } = await supabaseAdmin
            .from('daily_quests')
            .select('*')
            .eq('id', questId)
            .eq('user_id', userId)
            .eq('status', 'Active')
            .single();

        if (questError || !questData) {
            return NextResponse.json({ error: 'Quest não encontrada ou já completada' }, { status: 404 });
        }

        // 2. Atualizar a Quest para 'Completed'
        const { error: completeError } = await supabaseAdmin
            .from('daily_quests')
            .update({ status: 'Completed' })
            .eq('id', questId)
            .eq('user_id', userId);

        if (completeError) {
            return NextResponse.json({ error: 'Falha ao atualizar status da quest' }, { status: 500 });
        }

        // 3. Processar XP no user_stack_mastery
        // Split target_stack by comma or dot to support multi-stack quests like "Node.js. TypeScript. SQL"
        const rawStackNames = questData.target_stack as string;
        // Regex split: vírgula ou ponto (que não seja o .js do Node.js)
        // Mais seguro: split por vírgula ou por " . " ou ", "
        const stackNames = rawStackNames.split(/[,\.]\s+/).map((s: string) => s.trim()).filter(Boolean);
        const rewardXp = questData.xp_reward;
        // Distribute XP evenly across all stacks
        const xpPerStack = Math.max(1, Math.floor(rewardXp / stackNames.length));

        // Helper: resolve or auto-create a global_stack, and apply XP to mastery
        const applyXpToStack = async (stackName: string, xp: number) => {
            let stackId: string | undefined;

            const { data: found } = await supabaseAdmin
                .from('global_stacks')
                .select('id')
                .ilike('name', stackName)
                .maybeSingle();

            if (found?.id) {
                stackId = found.id;
            } else {
                const { data: created } = await supabaseAdmin
                    .from('global_stacks')
                    .insert({ name: stackName, category: 'AI Generated', icon_slug: stackName.toLowerCase() })
                    .select('id')
                    .single();
                stackId = created?.id;
            }

            if (!stackId) return { leveledUp: false, newLevel: 0 };


            const { data: masteryData } = await supabaseAdmin
                .from('user_stack_mastery')
                .select('id, current_xp, current_level')
                .eq('user_id', userId)
                .eq('stack_id', stackId)
                .maybeSingle();

            if (masteryData) {
                let newXp = masteryData.current_xp + xp;
                let currentLevel = masteryData.current_level;
                let leveledUp = false;
                while (true) {
                    const needed = currentLevel * 100;
                    if (newXp >= needed) { newXp -= needed; currentLevel++; leveledUp = true; }
                    else break;
                }
                await supabaseAdmin
                    .from('user_stack_mastery')
                    .update({ current_xp: newXp, current_level: currentLevel })
                    .eq('id', masteryData.id);
                return { leveledUp, newLevel: currentLevel };
            } else {
                const newLevel = xp >= 100 ? 2 : 1;
                const remainingXp = xp >= 100 ? xp - 100 : xp;
                await supabaseAdmin
                    .from('user_stack_mastery')
                    .insert({ user_id: userId, stack_id: stackId, current_level: newLevel, current_xp: remainingXp, is_active: true });
                return { leveledUp: newLevel > 1, newLevel };
            }
        }

        // Run XP for all stacks in parallel
        const results = await Promise.all(stackNames.map(name => applyXpToStack(name, xpPerStack)));
        const anyLevelUp = results.some(r => r.leveledUp);
        const levelUps = results.filter(r => r.leveledUp).map((_, i) => stackNames[i]);

        return NextResponse.json({
            message: anyLevelUp
                ? `Quest concluída! LEVEL UP em: ${levelUps.join(', ')}`
                : `Quest concluída! +${xpPerStack} XP distribuídos em: ${stackNames.join(', ')}`,
            xpGained: rewardXp,
            leveledUp: anyLevelUp
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'Erro interno', details: e.message }, { status: 500 });
    }
}
