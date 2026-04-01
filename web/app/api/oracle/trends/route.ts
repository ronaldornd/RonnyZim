import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(req: Request) {
    try {
        const { user_id } = await req.json();

        if (!user_id) {
            return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch only 'Evaluating' targets (active market temperature)
        const { data: insights, error } = await supabase
            .from('hunter_insights')
            .select('gap_analysis')
            .eq('user_id', user_id)
            .eq('status', 'Evaluating');

        if (error) throw error;

        // 2. Aggregate missing skills
        const skillCounts: Record<string, number> = {};
        let totalTargets = insights?.length || 0;

        insights?.forEach(insight => {
            const missing = insight.gap_analysis?.missing_skills || [];
            missing.forEach((skill: string) => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        // 3. Format and Sort
        const trends = Object.entries(skillCounts)
            .map(([skill, count]) => {
                // Determine heat based on frequency relative to total targets
                const ratio = count / totalTargets;
                let heat: 'low' | 'mid' | 'high' = 'low';
                if (ratio > 0.6) heat = 'high';
                else if (ratio > 0.3) heat = 'mid';

                return { skill, count, heat };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // Top 8 trends

        return NextResponse.json({
            trends,
            total_targets: totalTargets
        });

    } catch (error: any) {
        console.error('Oracle Trends API Error:', error);
        return NextResponse.json(
            { error: 'Falha ao processar oráculo de tendências.', details: error.message },
            { status: 500 }
        );
    }
}