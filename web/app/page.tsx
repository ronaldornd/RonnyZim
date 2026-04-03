import { createRouteHandlerClient } from '@/lib/supabase/server';
import AuthGuard from '@/components/auth/AuthGuard';
import DesktopShell from '@/components/os/DesktopShell';
import { getProfileDataAction } from '@/app/actions/os';

export default async function Home() {
    const supabase = await createRouteHandlerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const userId = session?.user?.id || "";
    // Pré-busca dos dados de perfil (Promise enviada para o Client Component)
    const profilePromise = getProfileDataAction(userId);

    return (
        <AuthGuard>
            <DesktopShell 
                userId={userId} 
                initialApp="genesis" 
                profilePromise={profilePromise} 
            />
        </AuthGuard>
    );
}
