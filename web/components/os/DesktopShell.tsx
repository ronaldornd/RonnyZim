"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import GenesisMonolith from '@/components/apps/genesis/GenesisMonolith';
import AgentWorkspace from '@/components/apps/workspace/AgentWorkspace';
import IdentityMatrix from '@/components/apps/identity/IdentityMatrix';
import DataVault from '@/components/apps/vault/DataVault';
import HunterBoard from '@/components/apps/hunter/HunterBoard';
import AstroDash from '@/components/apps/rndmind/AstroDash';
import SettingsApp from '@/components/apps/settings/SettingsApp';
import {
    TerminalSquare,
    Settings2,
    Power,
    UserCircle2,
    DatabaseZap,
    Target,
    Sparkles
} from 'lucide-react';

interface DesktopShellProps {
    userId: string;
    initialApp: 'loading' | 'genesis' | 'workspace' | 'identity' | 'vault' | 'hunter' | 'rndmind' | 'settings';
    profilePromise: Promise<{
        stacks: any[];
        facts: any;
        quests: any[];
    }>;
}

export default function DesktopShell({ userId: initialUserId, initialApp, profilePromise }: DesktopShellProps) {
    const [activeApp, setActiveApp] = useState<'loading' | 'genesis' | 'workspace' | 'identity' | 'vault' | 'hunter' | 'rndmind' | 'settings'>(initialApp);
    const [userId, setUserId] = useState<string | null>(initialUserId);

    useEffect(() => {
        // No longer need to fetch session or calibration here as it's passed from OSPage
        setUserId(initialUserId);
        setActiveApp(initialApp);
    }, [initialUserId, initialApp]);

    const handleGenesisComplete = () => {
        setActiveApp('workspace');
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/'; // Hard redirect to clear server state
    }

    // Se Genesis, não mostra a Dock (total isolamento)
    if (activeApp === 'genesis') {
        return <GenesisMonolith onComplete={handleGenesisComplete} userId={userId || ''} />;
    }

    // O Immersive Shell
    return (
        <main className="h-[100dvh] w-full bg-[#050505] relative overflow-hidden overscroll-none flex flex-col">
            <h1 className="sr-only">RonnyZim OS - {activeApp === 'workspace' ? 'Console de Inteligência' : activeApp.toUpperCase()}</h1>

            {/* Área do App Ativo (Full Screen) */}
            <div className="flex-1 w-full min-h-0 relative z-0" role="region" aria-live="polite">
                <div className={activeApp === 'workspace' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <AgentWorkspace userId={userId || ''} />
                </div>

                <div className={activeApp === 'identity' ? 'absolute inset-0 z-0' : 'hidden'}>
                    <IdentityMatrix 
                        userId={userId || ''} 
                        isActive={activeApp === 'identity'} 
                        profilePromise={profilePromise}
                    />
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

                <div className={activeApp === 'settings' ? 'absolute inset-0 z-0 bg-[#050505]' : 'hidden'}>
                    <SettingsApp userId={userId || ''} />
                </div>
            </div>


            {/* Ghost Dock (Navegação Escondida) */}
            {/* Um trigger zone transparente na parte inferior de 40px captura o hover */}
            <nav 
                className="absolute bottom-0 w-full h-[40px] group z-50 flex justify-center items-end pb-2"
                aria-label="Barra de Tarefas do OS"
            >

                {/* The Dock */}
                <div className="
          translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 
          transition-all duration-300 ease-out
          bg-[#0a0a0a]/90 backdrop-blur-md border border-green-500/20 rounded-2xl px-6 py-3 flex gap-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]
        ">

                    <button
                        onClick={() => setActiveApp('workspace')}
                        aria-label="Abrir Console de IA"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'workspace' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <TerminalSquare className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Console</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('identity')}
                        aria-label="Abrir Matrix de Identidade"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'identity' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <UserCircle2 className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Identidade</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('vault')}
                        aria-label="Abrir Cofre de Dados"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'vault' ? 'text-green-400 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-white/5'}`}
                    >
                        <DatabaseZap className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Cofre</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('hunter')}
                        aria-label="Abrir Hunter Board (CRM)"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'hunter' ? 'text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-slate-500 hover:text-red-400 hover:bg-white/5'}`}
                    >
                        <Target className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">CRM</span>
                    </button>

                    <button
                        onClick={() => setActiveApp('rndmind')}
                        aria-label="Abrir RND Mind (Dashboard Astro)"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            activeApp === 'rndmind'
                                ? 'text-violet-400 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                : 'text-slate-500 hover:text-violet-400 hover:bg-white/5'
                        }`}
                    >
                        <Sparkles className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">RND Mind</span>
                    </button>

                    <div className="w-[1px] h-full bg-slate-800 mx-2" role="separator" aria-hidden="true"></div>

                    <button
                        onClick={() => setActiveApp('settings')}
                        aria-label="Configurações do Sistema"
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeApp === 'settings' ? 'text-zinc-300 bg-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Settings2 className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Config</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        aria-label="Encerrar Sessão"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-4"
                    >
                        <Power className="w-6 h-6" aria-hidden="true" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Sair</span>
                    </button>

                </div>

                {/* Glow Line Indicator (quando a dock ta escondida, mostra uma listra que brilha no hover) */}
                <div className="absolute bottom-0 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-green-500/20 group-hover:via-green-500 to-transparent pointer-events-none transition-colors duration-500" aria-hidden="true"></div>

            </nav>
        </main>
    );
}
