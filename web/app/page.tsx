import { createRouteHandlerClient } from '@/lib/supabase/server';
import AuthGuard from '@/components/auth/AuthGuard';
import DesktopShell from '@/components/os/DesktopShell';
import { getProfileDataAction } from '@/app/actions/os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const userId = user?.id || "";
    // Inicia a promise de dados (Next.js 16/Streaming pattern)
    const profilePromise = getProfileDataAction(userId);
    const profileData = await profilePromise;
    
    // Se não estiver calibrado, força Genesis.
    const initialApp = ((profileData as any).isCalibrated || (profileData as any).facts?.system_calibration_answer === 'completed') ? "workspace" : "genesis";

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
