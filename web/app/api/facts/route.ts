import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { user_id, fact_key, fact_value } = await request.json();

        if (!user_id || !fact_key || !fact_value) {
            return NextResponse.json(
                { error: 'Missing required payload fields' },
                { status: 400 }
            );
        }

        const supabase = await createRouteHandlerClient();

        // Em vez de usar Service Role (bypass), resgatamos o usuário logado via Cookies SSR
        // RLS puro vai barrar o insert se session.user.id != user_id
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.id !== user_id) {
            return NextResponse.json(
                { error: 'Unauthorized: Cookie mismatch with user_id payload.' },
                { status: 401 }
            );
        }

        // Executa a persistência usando o RLS do usuário logado
        const { error } = await supabase.from('user_facts').upsert({
            user_id: session.user.id,
            property_key: fact_key,
            value: fact_value,
            category: 'calibrated_learning'
        }, { onConflict: 'user_id,property_key' });

        if (error) {
            console.error('[Active Learning API] Superbase Error:', error);
            throw error;
        }

        return NextResponse.json(
            { message: 'Fact acquired and securely stored', success: true },
            { status: 200 }
        );
    } catch (err: any) {
        console.error('Failed to process /api/facts request:', err);
        return NextResponse.json(
            { error: 'Server validation or RLS failed', details: err.message },
            { status: 500 }
        );
    }
}
