import { createRouteHandlerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders });
}

export async function GET() {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ user_id: null }, { status: 401, headers: corsHeaders });
        }

        return NextResponse.json({ user_id: user.id }, { headers: corsHeaders });
    } catch {
        return NextResponse.json({ user_id: null }, { status: 500, headers: corsHeaders });
    }
}
