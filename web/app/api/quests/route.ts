import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const supabaseAuth = await createRouteHandlerClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

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

import { XPService } from '@/lib/services/xp-service';

export async function POST(req: Request) {
    try {
        const supabaseAuth = await createRouteHandlerClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();
        const { questId } = await req.json();
        const userId = user.id;

        if (!questId) {
            return NextResponse.json({ error: 'Quest ID é obrigatório' }, { status: 400 });
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

        // 3. Processar XP via XPService
        const rawStackNames = questData.target_stack as string;
        const stackNames = rawStackNames.split(/[,\.]\s+/).map((s: string) => s.trim()).filter(Boolean);
        const rewardXp = questData.xp_reward;
        const xpPerStack = Math.max(1, Math.floor(rewardXp / stackNames.length));

        // Aplicar XP em todas as stacks em paralelo usando o serviço unificado
        const results = await Promise.all(
            stackNames.map(name => XPService.applyXpToStack(supabaseAdmin, userId, name, xpPerStack))
        );

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
