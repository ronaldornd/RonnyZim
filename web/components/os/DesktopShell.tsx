"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/browser';
import { useOSStore, AppName } from '@/lib/store';
import {
    TerminalSquare,
    Settings2,
    Power,
    UserCircle2,
    DatabaseZap,
    Target,
    Sparkles,
    Loader2
} from 'lucide-react';
import NeuralLinkWizard from './NeuralLinkWizard';

// Dynamic Imports for Code Splitting
const GenesisMonolith = dynamic(() => import('@/components/apps/genesis/GenesisMonolith'), { 
    loading: () => <AppLoader name="Genesis" /> 
});
const AgentWorkspace = dynamic(() => import('@/components/apps/workspace/AgentWorkspace'), { 
    loading: () => <AppLoader name="Workspace" /> 
});
const IdentityMatrix = dynamic(() => import('@/components/apps/identity/IdentityMatrix'), { 
    loading: () => <AppLoader name="Identity" /> 
});
const DataVault = dynamic(() => import('@/components/apps/vault/DataVault'), { 
    loading: () => <AppLoader name="Vault" /> 
});
const HunterBoard = dynamic(() => import('@/components/apps/hunter/HunterBoard'), { 
    loading: () => <AppLoader name="Hunter" /> 
});
const AstroDash = dynamic(() => import('@/components/apps/rndmind/AstroDash'), { 
    loading: () => <AppLoader name="Astro-Kernel" /> 
});
const SettingsApp = dynamic(() => import('@/components/apps/settings/SettingsApp'), { 
    loading: () => <AppLoader name="Settings" /> 
});

function AppLoader({ name }: { name: string }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-50">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
            <span className="text-[10px] font-mono text-green-500/50 uppercase tracking-[0.3em]">Carregando {name}...</span>
        </div>
    );
}

interface DesktopShellProps {
    userId: string;
    initialApp: AppName;
    profilePromise: Promise<any>;
}

export default function DesktopShell({ userId: initialUserId, initialApp, profilePromise }: DesktopShellProps) {
    const { activeApp, setActiveApp, setUserId, setProfileData, userId, profileData } = useOSStore();
    const [isDockOpen, setIsDockOpen] = useState(false);
    const [requiresNeuralLink, setRequiresNeuralLink] = useState(false);

    useEffect(() => {
        setUserId(initialUserId);
        setActiveApp(initialApp);
        
        // Resolve profile data and sync with store
        profilePromise.then(data => {
            setProfileData(data);
            
            // Check if Neural Link is required (no AI keys)
            const facts = data?.facts || {};
            const hasAIKey = facts.gemini_api_key || facts.openai_api_key || facts.anthropic_api_key;
            
            if (!hasAIKey) {
                setRequiresNeuralLink(true);
            }
        });
    }, [initialUserId, initialApp, profilePromise, setUserId, setActiveApp, setProfileData]);

    const handleNeuralLinkSuccess = () => {
        setRequiresNeuralLink(false);
        // Opcional: Recarregar dados se necessário, mas o wizard já salva no DB
        // Para garantir consistência no store local:
        window.location.reload(); 
    };

    const handleGenesisComplete = () => {
        setActiveApp('workspace');
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    // Accessibility navigation handler
    const handleKeyDown = (e: React.KeyboardEvent, app: AppName) => {
        if (e.key === 'Enter' || e.key === ' ') {
            setActiveApp(app);
        }
    };

    // Removed early return to allow NeuralLinkWizard overlay to function across all states

    return (
        <main 
            data-user-id={userId || initialUserId}
            className="fixed inset-0 h-[100dvh] w-full bg-[#050505] overflow-hidden overscroll-none flex flex-col"
        >
            <h1 className="sr-only">RonnyZim OS - {activeApp.toUpperCase()}</h1>

            {/* MANDATORY NEURAL LINK BLOCK */}
            {requiresNeuralLink && (
                <NeuralLinkWizard 
                    userId={userId || initialUserId} 
                    onSuccess={handleNeuralLinkSuccess} 
                />
            )}

            {/* App Viewport */}
            <div className="flex-1 w-full min-h-0 relative z-0" role="region" aria-live="polite">
                {activeApp === 'genesis' && <GenesisMonolith onComplete={handleGenesisComplete} userId={userId || ''} />}
                {activeApp === 'workspace' && <AgentWorkspace userId={userId || ''} />}
                {activeApp === 'identity' && (
                    <IdentityMatrix 
                        userId={userId || ''} 
                        isActive={activeApp === 'identity'} 
                        profilePromise={profilePromise}
                    />
                )}
                {activeApp === 'vault' && <DataVault userId={userId || ''} onNavigate={setActiveApp} />}
                {activeApp === 'hunter' && <HunterBoard userId={userId || ''} />}
                {activeApp === 'rndmind' && <AstroDash userId={userId || ''} />}
                {activeApp === 'settings' && <SettingsApp userId={userId || ''} />}
            </div>

            {/* Ghost Dock with Neon Pulse */}
            <nav 
                className="absolute bottom-0 w-full flex justify-center z-50 pointer-events-none"
                aria-label="Barra de Tarefas do OS"
                onMouseEnter={() => setIsDockOpen(true)}
                onMouseLeave={() => setIsDockOpen(false)}
            >
                {/* Hover trigger zone for desktop */}
                <div className="absolute bottom-0 w-full h-[30px] pointer-events-auto" aria-hidden="true" />

                {/* Glowing Trigger Line / Mobile Click Target */}
                <button
                    onClick={() => setIsDockOpen(!isDockOpen)}
                    className={`absolute bottom-0 w-[45%] md:w-1/3 h-[5px] md:h-[4px] cursor-pointer pointer-events-auto transition-all duration-300 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1),0_0_40px_rgba(34,197,94,0.4)] animate-pulse rounded-t-md ${
                        isDockOpen ? "opacity-0 translate-y-full" : "opacity-100"
                    }`}
                    aria-label="Alternar Dock"
                />

                {/* Dock Container */}
                <div className={`
                    pointer-events-auto transition-all duration-400 ease-out relative
                    bg-[#0a0a0a]/95 backdrop-blur-md border justify-center border-green-500/20 rounded-t-2xl md:rounded-2xl px-4 md:px-6 py-2 flex gap-2 md:gap-4 shadow-[0_0_30px_rgba(34,197,94,0.1)] mb-0 md:mb-2
                    ${isDockOpen ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+10px)] opacity-0"}
                `}>
                    <DockIcon 
                        icon={<TerminalSquare className="w-6 h-6" />} 
                        label="Console" 
                        active={activeApp === 'workspace'} 
                        onClick={() => setActiveApp('workspace')}
                        onKeyDown={(e) => handleKeyDown(e, 'workspace')}
                    />
                    <DockIcon 
                        icon={<UserCircle2 className="w-6 h-6" />} 
                        label="Identidade" 
                        active={activeApp === 'identity'} 
                        onClick={() => setActiveApp('identity')}
                        onKeyDown={(e) => handleKeyDown(e, 'identity')}
                    />
                    <DockIcon 
                        icon={<DatabaseZap className="w-6 h-6" />} 
                        label="Cofre" 
                        active={activeApp === 'vault'} 
                        onClick={() => setActiveApp('vault')}
                        onKeyDown={(e) => handleKeyDown(e, 'vault')}
                    />
                    <DockIcon 
                        icon={<Target className="w-6 h-6" />} 
                        label="CRM" 
                        colorClass={activeApp === 'hunter' ? 'text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-slate-500 hover:text-red-400 hover:bg-white/5'}
                        active={activeApp === 'hunter'} 
                        onClick={() => setActiveApp('hunter')}
                        onKeyDown={(e) => handleKeyDown(e, 'hunter')}
                    />
                    <DockIcon 
                        icon={<Sparkles className="w-6 h-6" />} 
                        label="ASTRO-KERNEL" 
                        colorClass={activeApp === 'rndmind' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'}
                        active={activeApp === 'rndmind'} 
                        onClick={() => setActiveApp('rndmind')}
                        onKeyDown={(e) => handleKeyDown(e, 'rndmind')}
                    />

                    <div className="w-[1px] h-[30px] self-center bg-slate-800 mx-1 md:mx-2" role="separator" aria-hidden="true"></div>

                    <DockIcon 
                        icon={<Settings2 className="w-6 h-6" />} 
                        label="Config" 
                        active={activeApp === 'settings'} 
                        onClick={() => setActiveApp('settings')}
                        onKeyDown={(e) => handleKeyDown(e, 'settings')}
                    />

                    <button
                        onClick={handleLogout}
                        aria-label="Encerrar Sessão"
                        className="flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors w-[44px] h-[44px] md:w-[40px] md:h-[40px]"
                    >
                        <Power className="w-6 h-6 md:w-5 md:h-5" aria-hidden="true" />
                    </button>
                </div>
            </nav>
        </main>
    );
}

interface DockIconProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    colorClass?: string;
}

function DockIcon({ icon, label, active, onClick, onKeyDown, colorClass }: DockIconProps) {
    const defaultClass = active ? 'text-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-500 hover:text-green-500 hover:bg-white/5';
    return (
        <button
            onClick={onClick}
            onKeyDown={onKeyDown}
            aria-label={`Abrir ${label}`}
            className={`flex items-center justify-center rounded-xl transition-all w-[44px] h-[44px] md:w-[40px] md:h-[40px] relative group/dockicon ${colorClass || defaultClass}`}
        >
            {React.cloneElement(icon as React.ReactElement<any>, { 'aria-hidden': true, className: 'w-6 h-6 md:w-[22px] md:h-[22px]' })}
            {/* Tooltip pra compensar a remoção do texto embaixo */}
            <span className="absolute -top-10 opacity-0 group-hover/dockicon:opacity-100 transition-opacity bg-[#050505] text-[10px] font-mono tracking-widest uppercase px-2 py-1 border border-white/10 rounded pointer-events-none text-white whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}
