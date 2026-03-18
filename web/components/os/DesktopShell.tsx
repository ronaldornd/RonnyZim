"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import GenesisMonolith from '@/components/apps/genesis/GenesisMonolith';
import AgentWorkspace from '@/components/apps/workspace/AgentWorkspace';
import IdentityMatrix from '@/components/apps/identity/IdentityMatrix';
import DataVault from '@/components/apps/vault/DataVault';
import HunterBoard from '@/components/apps/hunter/HunterBoard';
import AstroDash from '@/components/apps/rndmind/AstroDash';
import {
    TerminalSquare,
    Settings2,
    Power,
    UserCircle2,
    DatabaseZap,
    Target,
    Sparkles
} from 'lucide-react';

export default function DesktopShell() {
    const [activeApp, setActiveApp] = useState<'loading' | 'genesis' | 'workspace' | 'identity' | 'vault' | 'hunter' | 'rndmind'>('loading');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function checkCalibration() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Fallback estranho, AuthGuard deveria ter pego. 
                return;
            }

            setUserId(session.user.id);

            // Checar se existem fatos de calibração salvas
            const { data: facts } = await supabase
                .from('user_facts')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('property_key', 'system_calibration_answer')
                .limit(1);

            if (facts && facts.length > 0) {
                setActiveApp('workspace');
            } else {
                setActiveApp('genesis');
            }
        }

        checkCalibration();
    }, []);

    const handleGenesisComplete = () => {
        setActiveApp('workspace');
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.reload();
    }

    // Se loading, não mostra nada
    if (activeApp === 'loading') {
        return <div className="h-screen w-full bg-[#050505]"></div>;
    }

    // Se Genesis, não mostra a Dock (total isolamento)
    if (activeApp === 'genesis') {
        return <GenesisMonolith onComplete={handleGenesisComplete} userId={userId || ''} />;
    }

    // O Immersive Shell
    return (
        <div className="h-[100dvh] w-full bg-[#050505] relative overflow-hidden overscroll-none flex flex-col">

            {/* Área do App Ativo (Full Screen) */}
            <div className="flex-1 w-full min-h-0 relative z-0">
                <div className={activeApp === 'workspace' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <AgentWorkspace userId={userId || ''} />
                </div>

                <div className={activeApp === 'identity' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <IdentityMatrix userId={userId || ''} isActive={activeApp === 'identity'} />
                </div>

                <div className={activeApp === 'vault' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <DataVault userId={userId || ''} onNavigate={setActiveApp} />
                </div>

                <div className={activeApp === 'hunter' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <HunterBoard userId={userId || ''} />
                </div>

                <div className={activeApp === 'rndmind' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <AstroDash />
                </div>
            </div>

            {/* Ghost Dock (Navegação Escondida) */}
            {/* Um trigger zone transparente na parte inferior de 30px captura o hover */}
            <div className="absolute bottom-0 w-full h-[40px] group z-50 flex justify-center items-end pb-2">

                {/* The Dock */}
                <div className="
          translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 
          transition-all duration-300 ease-out
          bg-[#0a0a0a]/90 backdrop-blur-md border border-green-500/20 rounded-2xl px-6 py-3 flex gap-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]
        ">

                    <button
                        onClick={() => setActiveApp('workspace')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'workspace' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <TerminalSquare className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Console</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('identity')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'identity' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <UserCircle2 className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Identity</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('vault')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'vault' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <DatabaseZap className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Vault</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('hunter')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'hunter' ? 'text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-slate-500 hover:text-red-400 hover:bg-white/5'}`}
                    >
                        <Target className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">CRM</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('rndmind')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            activeApp === 'rndmind'
                                ? 'text-violet-400 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                : 'text-slate-500 hover:text-violet-400 hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">RND Mind</span>
                    </button>

                    <div className="w-[1px] h-full bg-slate-800 mx-2"></div>

                    <button
                        onClick={handleLogout}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-slate-500 hover:text-red-500 hover:bg-red-500/10`}
                    >
                        <Power className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Logout</span>
                    </button>

                </div>

                {/* Glow Line Indicator (quando a dock ta escondida, mostra uma listra que brilha no hover) */}
                <div className="absolute bottom-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-green-500/20 group-hover:via-green-500 to-transparent pointer-events-none transition-colors duration-500"></div>

            </div>
        </div >
    );
}
