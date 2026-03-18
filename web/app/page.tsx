import AuthGuard from '@/components/auth/AuthGuard';
import DesktopShell from '@/components/os/DesktopShell';

export default function Home() {
    return (
        <AuthGuard>
            <DesktopShell />
        </AuthGuard>
    );
}
