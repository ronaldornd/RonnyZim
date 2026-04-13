import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createRouteHandlerClient();
        console.log("Exchanging code for session...");
        try {
            await supabase.auth.exchangeCodeForSession(code);
        } catch (error) {
            console.error("Auth callback exchange error:", error);
        }
    }

    // Proteção contra Open Redirect: valida se 'next' é um caminho relativo seguro
    const isSafeRedirect = next.startsWith('/') && !next.includes('://');
    const safeNext = isSafeRedirect ? next : '/';

    return NextResponse.redirect(new URL(safeNext, request.url));
}
