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
export const revalidate = 0;

export default async function OSPage() {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em]">
                    [ ACCESS DENIED: SESSION REQUIRED ]
                </span>
            </div>
        );
    }

    const userId = user.id;

    // Fetch inicial robusto para o Shell (calibração etc)
    const { data: facts } = await supabase
        .from('user_facts')
        .select('property_key, value')
        .eq('user_id', userId)
        .in('property_key', ['system_calibration_answer', 'full_name', 'display_name']);

    // Se tiver a resposta de calibração OU se já tiver nome cadastrado, vai pro workspace
    const hasCalibration = facts?.some(f => f.property_key === 'system_calibration_answer' && f.value === 'completed');
    const hasProfileData = facts?.some(f => ['full_name', 'display_name'].includes(f.property_key) && f.value);

    const initialApp = (hasCalibration || hasProfileData) ? 'workspace' : 'genesis';

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
