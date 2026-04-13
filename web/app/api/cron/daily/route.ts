import { NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/supabase/admin";
import { genesisSyncAction } from '@/app/actions/genesis-sync';

// Força a execução dinâmica para cron
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Validação de Secret de Cron (Mandatário para produção)
        const cronSecret = process.env.CRON_SECRET;
        
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            console.warn(`[CRON] Acesso não autorizado detectado.`);
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const supabase = createAdminClient();

        console.log("[CRON] Iniciando rotina diária de Neuro-Sync do Astro-Kernel...");

        // Pegar todos os usuários únicos que possuam "seniority" preenchido (significa que completaram Genesis)
        const { data: activeUsers, error } = await supabase
            .from('user_facts')
            .select('user_id')
            .eq('property_key', 'seniority');

        if (error) {
            console.error("[CRON] Falha ao coletar usuários para sincronização:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Remover duplicatas caso a base suje
        const userIds = Array.from(new Set(activeUsers?.map(u => u.user_id) || []));

        console.log(`[CRON] Encontrados ${userIds.length} alvos para Sincronização neural.`);

        const results = [];

        // Loop sequencial respeitando os rate limits do Gemini e do banco
        for (const uid of userIds) {
            console.log(`[CRON] Call genesisSync para: ${uid}`);
            try {
                await genesisSyncAction(uid);
                results.push({ user_id: uid, status: 'success' });
            } catch (syncError: any) {
                console.error(`[CRON] Erro ao sincronizar o alvo ${uid}:`, syncError);
                results.push({ user_id: uid, status: 'error', error: syncError.message });
            }
        }

        return NextResponse.json({ 
            message: "Sync completado com sucesso", 
            synced_count: results.filter(r => r.status === 'success').length,
            errors_count: results.filter(r => r.status === 'error').length,
            results 
        });

    } catch (error: any) {
        console.error('[CRON] Erro Crítico:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
