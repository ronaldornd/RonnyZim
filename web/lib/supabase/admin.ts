import { createClient } from '@supabase/supabase-js';

// Usado para server-side tasks apenas (API Routes, Server actions)
// O Service Role tem permissão de BYPASS RLS, crucial para inserir as facts 
// coletadas com "alta prioridade" pela IA, independente da row-level security.
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase environment variables (URL or SERVICE_ROLE_KEY) are missing.');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
