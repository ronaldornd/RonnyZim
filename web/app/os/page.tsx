import { Suspense } from 'react';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import AuthGuard from '@/components/auth/AuthGuard';
import DesktopShell from '@/components/os/DesktopShell';
import HolographicFallback from '@/components/ui/HolographicFallback';
import { getProfileData } from '@/app/actions/profile';

export const metadata = {
    title: 'RonnyZim OS | Neural Terminal',
    description: 'Sistema Operacional de Inteligência e Carreira',
};

// Força a página a ser dinâmica para garantir dados frescos
export const dynamic = 'force-dynamic';

export default async function OSPage() {
    const supabase = await createRouteHandlerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return (
            <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em]">
                    [ ACCESS DENIED: SESSION REQUIRED ]
                </span>
            </div>
        );
    }

    const userId = session.user.id;

    // Fetch inicial rápido para o Shell (calibração etc)
    const { data: facts } = await supabase
        .from('user_facts')
        .select('id')
        .eq('user_id', userId)
        .eq('property_key', 'system_calibration_answer')
        .limit(1);

    const initialApp = (facts && facts.length > 0) ? 'workspace' : 'genesis';

    // Os dados pesados do IdentityMatrix serão buscados via Streaming no componente de ação
    // ou passados via Promise para o componente cliente (Next.js 16 pattern)
    const profilePromise = getProfileData(userId);

    return (
        <AuthGuard>
            <DesktopShell 
                userId={userId} 
                initialApp={initialApp}
                profilePromise={profilePromise} 
            />
        </AuthGuard>
    );
}
