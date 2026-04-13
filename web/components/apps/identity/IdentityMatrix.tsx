"use client";

import React, { useEffect, useState, useOptimistic, useTransition, use, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import QuestDetailModal from './QuestDetailModal';
import NeuralGraph from './NeuralGraph';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Activity,
    Award,
    CheckCircle2,
    Cpu,
    Crosshair,
    Shield,
    UserCircle2,
    Code,
    Database,
    Palette,
    Pencil,
    Check,
    X as XIcon,
    Network,
    LayoutList,
    Zap,
    Play,
    Target,
    ShieldAlert,
    Key,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { ColorMap } from '../genesis/StackSelector';
import BiorhythmWidget from '../daily/BiorhythmWidget';
import QuestGrid from './QuestGrid';
import { StreamingFallback } from '@/components/ui/StreamingFallback';
import { useCyberSFX } from '@/hooks/useCyberSFX';
import { 
    completeQuestAction, 
    updateUserFactsAction,
    deleteUserStackAction,
    DailyQuest as RemoteDailyQuest, 
    UserStack as RemoteUserStack 
} from '@/app/actions/profile';
import IdentityPolygon from './IdentityPolygon';
import { useOSStore } from '@/lib/store';
import SkillScanCard from './SkillScanCard';
import { genesisSyncAction } from '@/app/actions/genesis-sync';
import { RefreshCw } from 'lucide-react';

interface UserStack {
    id: string;
    global_stacks: {
        name: string;
        category: string;
        icon_slug: string;
    };
    current_xp: number;
    current_level: number;
}

interface IdentityMatrixProps {
    userId: string;
    isActive?: boolean;
    profilePromise?: Promise<{
        stacks: RemoteUserStack[];
        facts: any;
        quests: RemoteDailyQuest[];
        completedQuests: any[];
        telemetry: {
            integrity: number;
            sync: number;
            bioSummary: string | null;
        };
    }>;
}

// Removida interface redundante. Usando RemoteDailyQuest do profile.ts



export default function IdentityMatrix({ userId, isActive = true, profilePromise }: IdentityMatrixProps) {
    const { setActiveApp } = useOSStore();
    // Consumir dados do servidor via 'use' hook (Next.js 16/React 19)
    const initialData = profilePromise ? use(profilePromise) : null;
    
    const [isPending, startTransition] = useTransition();
    const { triggerSFX, playSuccess, playError, playGlitch } = useCyberSFX();

    // Estágios de Identidade (Facts)
    const [displayName, setDisplayName] = useState(initialData?.facts?.display_name || 'Operador');
    const [profileTitle, setProfileTitle] = useState(initialData?.facts?.profile_title || 'Arquiteto Full Stack');
    const [birthDate, setBirthDate] = useState(initialData?.facts?.birth_date || '');
    const [birthTime, setBirthTime] = useState(initialData?.facts?.birth_time || '');
    const [birthCity, setBirthCity] = useState(initialData?.facts?.birth_city || '');
    const [seniority, setSeniority] = useState(initialData?.facts?.seniority || 'Pleno');

    // Mastery & Jornada com Optimismo
    const [optimisticStacks, addOptimisticStack] = useOptimistic(
        initialData?.stacks || [],
        (state: RemoteUserStack[], { stackId, xpDelta }: { stackId: string, xpDelta: number }) => {
            return state.map(s => {
                if (s.id === stackId) {
                    let newXp = s.current_xp + xpDelta;
                    let newLevel = s.current_level;
                    const threshold = newLevel * 100;
                    if (newXp >= threshold) {
                        newXp -= threshold;
                        newLevel += 1;
                    }
                    return { ...s, current_xp: newXp, current_level: newLevel };
                }
                return s;
            });
        }
    );

    const [optimisticQuests, addOptimisticQuest] = useOptimistic(
        initialData?.quests || [],
        (state: RemoteDailyQuest[], questId: string) => {
            return state.map(q => q.id === questId ? { ...q, completed: true, status: 'completed' } : q);
        }
    );

    // Estados de Erro e Cooldown (Protocolo Fase 4)
    const [glitchActive, setGlitchActive] = useState<string | boolean>(false);
    const [isCooldown, setIsCooldown] = useState(false);

    const [loading, setLoading] = useState(!initialData);
    const [quests, setQuests] = useState<RemoteDailyQuest[]>(initialData?.quests || []);
    const [stacks, setStacks] = useState<RemoteUserStack[]>(initialData?.stacks || []);
    const [viewMode, setViewMode] = useState<'list' | 'neural'>('list');
    const [selectedQuest, setSelectedQuest] = useState<RemoteDailyQuest | null>(null);
    const [xpToasts, setXpToasts] = useState<{ id: number; message: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'IDENTIDADE' | 'MAESTRIA' | 'AURA' | 'JORNADA'>('IDENTIDADE');
    const [maestriaPage, setMaestriaPage] = useState(0);
    const [jornadaPage, setJornadaPage] = useState(0);
    const stacksPerPage = 6;
    const questsPerPage = 3;

    // Profile Editável
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editBirth, setEditBirth] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editSeniority, setEditSeniority] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchIdentityStats = async () => {
        if (!userId || initialData) return; // Se já temos initialData (SWR), pula o fetch agressivo

        const supabase = createClient();
        console.log("[IDENTITY] Fallback fetch activated");
        setLoading(false);
    };

    const handleNeuralSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        triggerSFX('click');
        try {
            await genesisSyncAction(userId);
            playSuccess();
            // Refresh local data by triggering a reload or state reset
            window.location.reload(); 
        } catch (error) {
            console.error('❌ Neural Sync Failed:', error);
            playError();
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            fetchIdentityStats();
        }
    }, [userId, isActive, initialData]);

    const enterEditMode = () => {
        setEditName(displayName);
        setEditTitle(profileTitle);
        setEditBirth(birthDate);
        setEditTime(birthTime);
        setEditCity(birthCity);
        setEditSeniority(seniority);
        setEditMode(true);
    };

    const saveProfile = async () => {
        const updates = [
            { category: 'core_identity', property_key: 'display_name', value: editName },
            { category: 'core_identity', property_key: 'profile_title', value: editTitle },
            { category: 'astrology', property_key: 'birth_date', value: editBirth },
            { category: 'astrology', property_key: 'birth_time', value: editTime },
            { category: 'astrology', property_key: 'birth_city', value: editCity },
            { category: 'professional', property_key: 'seniority', value: editSeniority },
            { 
                category: 'astrology', 
                property_key: 'birth_data', 
                value: `Nascido em ${editBirth.split('-').reverse().join('/')} as ${editTime} na cidade de ${editCity}` 
            },
        ];

        startTransition(async () => {
            try {
                await updateUserFactsAction(userId, updates);
                
                setDisplayName(editName);
                setProfileTitle(editTitle);
                setBirthDate(editBirth);
                setBirthTime(editTime);
                setBirthCity(editCity);
                setSeniority(editSeniority);
                localStorage.removeItem('astrokernel_astro_cache');
                setEditMode(false);
                playSuccess();
            } catch (error) {
                console.error('❌ Falha ao salvar perfil:', error);
                playError();
            }
        });
    };

    const handleCompleteQuest = async (questId: string, xpReward: number, stackName: string, stackId: string) => {
        if (isCooldown) return;

        // Mostrar Toast de XP (Visual Instantâneo)
        const toastId = Date.now();
        setXpToasts(prev => [...prev, { id: toastId, message: `+${xpReward} XP em ${stackName}` }]);
        
        // Cooldown preventivo de spam visual
        setTimeout(() => {
            setXpToasts(prev => prev.filter(t => t.id !== toastId));
        }, 2000);

        // Iniciar Transição Otimista (React 19)
        startTransition(async () => {
            addOptimisticQuest(questId);
            addOptimisticStack({ stackId, xpDelta: xpReward });
            
            try {
                // Chamar Server Action
                await completeQuestAction(userId, questId, stackId, xpReward);
                playSuccess();
            } catch (e) {
                console.error('❌ UPLINK FAILED:', e);
                
                // Ativar Protocolo de Glitch e Cooldown (Rollback Visual)
                playError();
                playGlitch();
                setGlitchActive(questId); // Marca o quest específico com efeito de instabilidade
                setIsCooldown(true);
                
                // Reset tático após 3s
                setTimeout(() => {
                    setGlitchActive(false);
                    setIsCooldown(false);
                }, 3000);
            }
        });
    };

    const handleDeleteStack = async (stackId: string) => {
        if (!userId) return;
        
        startTransition(async () => {
            try {
                await deleteUserStackAction(userId, stackId);
                playSuccess();
            } catch (e) {
                console.error('❌ PURGE FAILED:', e);
                playError();
            }
        });
    };

    // Preparar dados do gráfico de radar usando valores otimistas
    const radarData = optimisticStacks
        .filter(s => s && s.global_stacks) // Garante que apenas stacks válidas entrem no gráfico
        .map(s => ({
            subject: s.global_stacks?.name || 'Unknown',
            A: (s.current_level * 10) + (s.current_xp / 10), 
            fullMark: 100,
        }));

    const renderTabs = () => {
        const tabs = [
            { id: 'IDENTIDADE', icon: <UserCircle2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />, label: 'IDENTIDADE' },
            { id: 'MAESTRIA', icon: <Cpu className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />, label: 'MAESTRIA' },
            { id: 'AURA', icon: <Crosshair className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />, label: 'AURA' },
            { id: 'JORNADA', icon: <Activity className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />, label: 'JORNADA' },
        ];

        return (
            <div className="flex items-center justify-center gap-4 mb-1 border-b border-white/5 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-2 py-1 transition-all duration-300 relative group ${
                            activeTab === tab.id 
                                ? 'text-cyan-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {tab.icon}
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeProfileTab"
                                className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                            />
                        )}
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center font-mono text-green-500/50 gap-4">
                <Shield className="w-12 h-12 animate-pulse opacity-50 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                <span className="tracking-widest uppercase text-[10px]">Iniciando Protocolo de Identidade...</span>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#050505] p-2 pt-0.5 text-slate-200 overflow-hidden relative flex flex-col">
            {/* Fundo Ambientes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
                {renderTabs()}

                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'IDENTIDADE' && (
                                <div className="flex flex-col gap-4 py-2">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border border-white/5 bg-white/[0.01] p-6 rounded-[2rem] backdrop-blur-md relative overflow-hidden shrink-0">
                                        <div className="absolute top-0 right-0 opacity-5 p-8 pointer-events-none">
                                            <IdentityPolygon 
                                                className="w-48 h-48"
                                                level={optimisticStacks.reduce((a, s) => a + s.current_level, 0)}
                                            />
                                        </div>

                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-cyan-500/10 p-1 shadow-[0_0_30px_rgba(6,182,212,0.15)] border border-cyan-500/20">
                                                <div className="w-full h-full bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-cyan-500/30 overflow-hidden">
                                                    <IdentityPolygon 
                                                        level={optimisticStacks.reduce((a, s) => a + s.current_level, 0)}
                                                        xp={Math.round((optimisticStacks.reduce((a, s) => a + s.current_xp, 0) / (Math.max(1, optimisticStacks.length) * 100)) * 100) || 0}
                                                        className="w-12 h-12"
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[9px] font-black px-2 py-1 rounded-md border border-black shadow-lg uppercase tracking-tighter">
                                                NVL {optimisticStacks.length > 0 ? optimisticStacks.reduce((a, s) => a + s.current_level, 0) : '—'}
                                            </div>
                                        </div>

                                        <div className="z-10 flex-1 w-full">
                                            {editMode ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            placeholder="IDENTIDADE"
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-cyan-500/30 transition-all uppercase tracking-wider"
                                                        />
                                                        <input
                                                            value={editTitle}
                                                            onChange={e => setEditTitle(e.target.value)}
                                                            placeholder="TÍTULO OPERACIONAL"
                                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-cyan-400 text-[10px] font-mono focus:outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-4 pt-2 border-t border-white/5">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">✦ Dados Natais / Astrometria</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Data</label>
                                                                <input
                                                                    type="date"
                                                                    value={editBirth}
                                                                    onChange={e => setEditBirth(e.target.value)}
                                                                    style={{ colorScheme: 'dark' }}
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-[10px] focus:outline-none focus:border-cyan-500/30 transition-all appearance-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Hora</label>
                                                                <input
                                                                    type="time"
                                                                    value={editTime}
                                                                    onChange={e => setEditTime(e.target.value)}
                                                                    style={{ colorScheme: 'dark' }}
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-[10px] focus:outline-none focus:border-cyan-500/30 transition-all appearance-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 md:col-span-1 space-y-1">
                                                                <label className="text-[8px] font-bold text-slate-600 uppercase tracking-widest block">Cidade</label>
                                                                <input
                                                                    value={editCity}
                                                                    onChange={e => setEditCity(e.target.value)}
                                                                    placeholder="Ex: São Paulo, SP"
                                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-[10px] focus:outline-none focus:border-cyan-500/30 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 pt-2 border-t border-white/5">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">✦ Evolução Profissional</p>
                                                        <div className="relative group">
                                                            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Senioridade Atual</label>
                                                            <div className="relative">
                                                                <select
                                                                    value={editSeniority}
                                                                    onChange={e => setEditSeniority(e.target.value)}
                                                                    className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer backdrop-blur-xl"
                                                                >
                                                                    <option value="Junior" className="bg-[#0a0a0a]">Junior</option>
                                                                    <option value="Pleno" className="bg-[#0a0a0a]">Pleno</option>
                                                                    <option value="Senior" className="bg-[#0a0a0a]">Senior</option>
                                                                    <option value="Tech Lead" className="bg-[#0a0a0a]">Tech Lead</option>
                                                                    <option value="Staff / Principal / Arquitetura" className="bg-[#0a0a0a]">Staff / Principal / Arquitetura</option>
                                                                </select>
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                    <Award className="w-3 h-3 text-amber-500 animate-pulse" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4">
                                                        <button onClick={saveProfile} disabled={isPending} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-50">
                                                            <Check className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> {isPending ? 'SALVANDO...' : 'Confirmar'}
                                                        </button>
                                                        <button onClick={() => setEditMode(false)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
                                                            <XIcon className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center md:text-left h-full flex flex-col justify-center">
                                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                                        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">
                                                            {displayName}
                                                        </h1>
                                                        <button onClick={enterEditMode} className="p-2 rounded-xl text-slate-700 hover:text-cyan-400 hover:bg-white/5 transition-all" title="Editar Perfil">
                                                            <Pencil className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-cyan-500/60 tracking-[0.4em] uppercase mt-1">{profileTitle}</p>
                                                    
                                                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                                                        {(birthDate || birthTime || birthCity) && (
                                                            <div className="space-y-2">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Astrometria Natal</p>
                                                                <div className="flex flex-wrap gap-4">
                                                                    {birthDate && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">📅 {new Date(birthDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                                                                    {birthTime && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">🕐 {birthTime}</span>}
                                                                    {birthCity && <span className="text-[11px] font-mono text-slate-400 transition-colors hover:text-cyan-400">📍 {birthCity}</span>}
                                                                    {seniority && <span className="text-[11px] font-mono text-amber-500/80 transition-colors hover:text-amber-400">🎖️ {seniority}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="w-px h-10 bg-white/5 hidden md:block" />
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">XP ACUMULADO</p>
                                                                <p className="text-lg font-black text-slate-200 tracking-tighter text-glow-cyan">
                                                                    {optimisticStacks.reduce((a, s) => a + s.current_xp, 0)}
                                                                </p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">TECNOLOGIAS</p>
                                                                <p className="text-lg font-black text-slate-200 tracking-tighter">{optimisticStacks.length}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm flex flex-col gap-4 shrink-0">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                                <p className="text-[9px] font-bold text-cyan-400/60 uppercase tracking-widest mb-1">INTEGRIDADE DA IDENTIDADE</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${initialData?.telemetry?.integrity ?? 4}%` }}
                                                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-cyan-400">{initialData?.telemetry?.integrity ?? 4}%</span>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                                <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">SINCRONIA TEMPORAL</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${initialData?.telemetry?.sync ?? 12}%` }}
                                                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-blue-400">{initialData?.telemetry?.sync ?? 12}%</span>
                                                </div>
                                            </div>
                                         </div>
 
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative group/profile">
                                                 <div className="flex items-center justify-between mb-3">
                                                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                         <UserCircle2 className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> PERFIL DE OPERAÇÃO
                                                     </p>
                                                     <button 
                                                        onClick={handleNeuralSync}
                                                        disabled={isSyncing}
                                                        title="Sincronizar com Astro-Kernel"
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-500/40 hover:text-cyan-400 transition-all opacity-0 group-hover/profile:opacity-100 disabled:opacity-50"
                                                     >
                                                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                                     </button>
                                                 </div>
                                                 <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                                                     {initialData?.telemetry?.bioSummary || "[ ERRO CRÍTICO ] Conexão com ASTRO-KERNEL indisponível. Dados vitais ausentes."}
                                                 </p>
                                             </div>
                                             <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                     <Award className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> LOGS DA JORNADA (RECON)
                                                 </p>
                                                 <div className="space-y-3">
                                                     {initialData?.completedQuests && initialData.completedQuests.length > 0 ? (
                                                         initialData.completedQuests.map((q: any) => (
                                                             <div key={q.id}>
                                                                 <div className="flex justify-between items-center mb-1">
                                                                     <span className="text-[10px] font-bold text-slate-300 uppercase">{q.title}</span>
                                                                     <span className="text-[9px] font-mono text-emerald-500">+{q.xp_reward} XP</span>
                                                                 </div>
                                                                 <p className="text-[10px] text-slate-500">{q.description.substring(0, 60)}...</p>
                                                             </div>
                                                         ))
                                                     ) : (
                                                         <div className="text-[10px] text-slate-600 font-mono animate-pulse">
                                                             [ NENHUM LOG DE MISSÃO ENCONTRADO ]
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'MAESTRIA' && (
                                <div className="h-full flex flex-col gap-6 py-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <Cpu className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                            <h2 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">Matriz de Habilidades</h2>
                                        </div>
                                        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                                                    viewMode === 'list' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-600 hover:text-slate-400'
                                                }`}
                                            >
                                                <LayoutList className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> LISTA
                                            </button>
                                            <button
                                                onClick={() => setViewMode('neural')}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 ${
                                                    viewMode === 'neural' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-600 hover:text-slate-400'
                                                }`}
                                            >
                                                <Network className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" /> NEURAL
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col px-2">
                                        <Suspense fallback={<StreamingFallback label="SCANNING MASTERY..." />}>
                                            {viewMode === 'list' ? (
                                                optimisticStacks.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] text-slate-600">
                                                        Nenhum DNA técnico registrado.
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex flex-col">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                                                            {optimisticStacks.slice(maestriaPage * stacksPerPage, (maestriaPage + 1) * stacksPerPage).map((stack) => {
                                                                const brandColor = ColorMap[stack.global_stacks.icon_slug.toLowerCase()] || ColorMap['default'];
                                                                const nextLevelXp = stack.current_level * 100;
                                                                const progressPercent = Math.min(100, (stack.current_xp / nextLevelXp) * 100);

                                                                return (
                                                                    <SkillScanCard 
                                                                        key={stack.id}
                                                                        id={stack.id}
                                                                        name={stack.global_stacks.name}
                                                                        category={stack.global_stacks.category}
                                                                        level={stack.current_level}
                                                                        xp={stack.current_xp}
                                                                        nextLevelXp={nextLevelXp}
                                                                        progressPercent={progressPercent}
                                                                        brandColor={brandColor}
                                                                        iconSlug={stack.global_stacks.icon_slug}
                                                                        onDelete={handleDeleteStack}
                                                                    />
                                                                );
                                                            })}
                                                        </div>

                                                        {optimisticStacks.length > stacksPerPage && (
                                                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                                                <button 
                                                                    onClick={() => setMaestriaPage(p => Math.max(0, p - 1))}
                                                                    disabled={maestriaPage === 0}
                                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${maestriaPage === 0 ? 'text-zinc-800' : 'text-cyan-500 hover:bg-cyan-500/10'}`}
                                                                >
                                                                    Anterior
                                                                </button>
                                                                <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                                    Página {maestriaPage + 1} de {Math.ceil(optimisticStacks.length / stacksPerPage)}
                                                                </span>
                                                                <button 
                                                                    onClick={() => setMaestriaPage(p => Math.min(Math.ceil(optimisticStacks.length / stacksPerPage) - 1, p + 1))}
                                                                    disabled={maestriaPage >= Math.ceil(optimisticStacks.length / stacksPerPage) - 1}
                                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${maestriaPage >= Math.ceil(optimisticStacks.length / stacksPerPage) - 1 ? 'text-zinc-800' : 'text-cyan-500 hover:bg-cyan-500/10'}`}
                                                                >
                                                                    Próxima
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="h-full min-h-[400px]">
                                                    <NeuralGraph
                                                        stacks={optimisticStacks as any}
                                                        quests={optimisticQuests as any}
                                                        userName={displayName}
                                                        totalLevel={optimisticStacks.reduce((a, s) => a + s.current_level, 0)}
                                                        userId={userId}
                                                    />
                                                </div>
                                            )}
                                        </Suspense>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'JORNADA' && (
                                <div className="h-full flex flex-col gap-6 py-4 px-2">
                                    <Suspense fallback={<StreamingFallback label="SYNCHRONIZING QUESTS..." />}>
                                        <div className="space-y-6 flex-1 overflow-hidden flex flex-col pr-2 custom-scrollbar">
                                            {optimisticQuests.length > 0 ? (
                                                <div className="pt-2 flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <Award className="w-5 h-5 text-amber-500" />
                                                            <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase">Log de Missões Diárias</h3>
                                                        </div>
                                                        
                                                        {optimisticQuests.length > questsPerPage && (
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-widest">
                                                                    Página {jornadaPage + 1} de {Math.ceil(optimisticQuests.length / questsPerPage)}
                                                                </span>
                                                                <div className="flex gap-1">
                                                                    <button 
                                                                        onClick={() => setJornadaPage(p => Math.max(0, p - 1))}
                                                                        disabled={jornadaPage === 0}
                                                                        className={`p-2 rounded-lg transition-all ${jornadaPage === 0 ? 'text-zinc-800' : 'text-amber-500 hover:bg-amber-500/10'}`}
                                                                    >
                                                                        <LayoutList className="w-3 h-3 rotate-180 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setJornadaPage(p => Math.min(Math.ceil(optimisticQuests.length / questsPerPage) - 1, p + 1))}
                                                                        disabled={jornadaPage >= Math.ceil(optimisticQuests.length / questsPerPage) - 1}
                                                                        className={`p-2 rounded-lg transition-all ${jornadaPage >= Math.ceil(optimisticQuests.length / questsPerPage) - 1 ? 'text-zinc-800' : 'text-amber-500 hover:bg-amber-500/10'}`}
                                                                    >
                                                                        <LayoutList className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 overflow-y-auto">
                                                        {optimisticQuests.slice(jornadaPage * questsPerPage, (jornadaPage + 1) * questsPerPage).map((quest) => {
                                                            const isCompleted = quest.completed || quest.status === 'completed';
                                                            const hasGlitch = glitchActive === quest.id;
                                                            
                                                            return (
                                                                <motion.div
                                                                    key={quest.id}
                                                                    animate={hasGlitch ? {
                                                                        x: [0, -2, 2, -1, 1, 0],
                                                                        filter: ["none", "hue-rotate(90deg) brightness(1.5)", "none"],
                                                                    } : {}}
                                                                    transition={hasGlitch ? { repeat: Infinity, duration: 0.1 } : {}}
                                                                    className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${
                                                                        isCompleted 
                                                                            ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                                                                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                                                    } ${hasGlitch ? 'border-red-500/50 bg-red-500/10' : ''}`}
                                                                >
                                                                    <div className="flex items-start justify-between relative z-10">
                                                                        <div className="flex-1 pr-8">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tighter uppercase ${
                                                                                    isCompleted ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'
                                                                                }`}>
                                                                                    {quest.type}
                                                                                </span>
                                                                            </div>
                                                                            <h3 className={`text-sm font-black tracking-tight mb-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-cyan-400 transition-colors'}`}>
                                                                                {quest.title}
                                                                            </h3>
                                                                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-4">
                                                                                {quest.description}
                                                                            </p>
                                                                            
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                                                                    <span className="text-[10px] font-black text-cyan-500 italic">+{quest.xp_reward} XP</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <button
                                                                            onClick={() => handleCompleteQuest(quest.id, quest.xp_reward, quest.stack_name || '', quest.stack_id || '')}
                                                                            disabled={isCompleted || isPending || isCooldown}
                                                                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                                                                                isCompleted 
                                                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                                                    : 'bg-white/5 border-white/10 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-400 hover:scale-110 active:scale-95'
                                                                            } disabled:cursor-not-allowed`}
                                                                        >
                                                                            {isCompleted ? (
                                                                                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                                                            ) : (
                                                                                <Zap className="w-4 h-4 ml-0.5 text-cyan-400 drop-shadow-[0_0_5px_theme(colors.cyan.400)]" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.01]">
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
                                                    
                                                    <div className="w-64 h-64 mb-8 relative">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                                { subject: 'BIO', A: 120, fullMark: 150 },
                                                                { subject: 'CODE', A: 98, fullMark: 150 },
                                                                { subject: 'VIBE', A: 86, fullMark: 150 },
                                                                { subject: 'SYNC', A: 99, fullMark: 150 },
                                                                { subject: 'XP', A: 85, fullMark: 150 },
                                                            ]}>
                                                                <PolarGrid stroke="#ffffff10" />
                                                                <Radar
                                                                    name="AstroScan"
                                                                    dataKey="A"
                                                                    stroke="#06b6d4"
                                                                    fill="#06b6d4"
                                                                    fillOpacity={0.1}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                        <motion.div 
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                            className="absolute inset-0 border border-cyan-500/20 rounded-full border-dashed"
                                                        />
                                                    </div>

                                                    <h3 className="text-lg font-black text-white tracking-[0.3em] uppercase mb-2">Busca de Alvos Neural</h3>
                                                    <p className="text-[10px] text-slate-500 max-w-md mx-auto mb-8 font-mono leading-relaxed px-4">
                                                        O AstroKernel não detectou missões ativas no seu quadrante atual.
                                                        Inicie um escaneamento profundo para sincronizar quests com seu biorritmo técnico.
                                                    </p>

                                                    <button 
                                                        className="group relative px-12 py-4 bg-cyan-500 text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden"
                                                    >
                                                        <span className="relative z-10 flex items-center gap-3">
                                                            <Play className="w-3 h-3 fill-current" />
                                                            Sincronizar Missões
                                                        </span>
                                                        <motion.div 
                                                            className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Suspense>
                                </div>
                            )}


                            {activeTab === 'AURA' && (
                                <div className="h-full flex flex-col gap-6 py-4 px-2 overflow-y-auto custom-scrollbar">
                                    <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase mb-2">Neural Link & Biorhythm</h3>
                                    
                                    {/* Biorhythm Section */}
                                    <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-md">
                                        <BiorhythmWidget userId={userId} />
                                    </div>

                                    {/* Neural Graph / Aura Visualization Placeholder */}
                                    <div className="p-10 rounded-[2rem] border border-cyan-500/10 bg-cyan-500/[0.02] flex flex-col items-center justify-center text-center gap-6 min-h-[350px] relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] animate-pulse" />
                                        
                                        <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-cyan-500/20 flex items-center justify-center animate-[spin_30s_linear_infinite]">
                                            <div className="w-32 h-32 rounded-full border border-cyan-500/40 flex items-center justify-center animate-[pulse_4s_ease-in-out_infinite]">
                                                <Zap className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <h4 className="text-sm font-black text-white tracking-[0.4em] uppercase mb-1">Campo de Aura Perceptível</h4>
                                            <p className="text-[10px] text-slate-500 font-mono italic">Sincronia Estável a {initialData?.telemetry?.sync || 85}%</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-12 mt-4 w-full max-w-md relative z-10">
                                            <div className="text-center">
                                                <div className="text-xs font-black text-cyan-400">0.8Hz</div>
                                                <div className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter">Ondas Theta</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs font-black text-emerald-400">14Hz</div>
                                                <div className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter">Ondas Alpha</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs font-black text-amber-400">22Hz</div>
                                                <div className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter">Ondas Beta</div>
                                            </div>
                                        </div>

                                        {/* Scanlines Effect */}
                                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* MODAL DE DETALHES DA QUEST */}
            <QuestDetailModal
                userId={userId}
                quest={selectedQuest as any}
                onClose={() => setSelectedQuest(null)}
                onComplete={handleCompleteQuest}
            />

            {/* FLOATING XP TOASTS */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]">
                <AnimatePresence>
                    {xpToasts.map((toast: any) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 1.5, y: -100 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-cyan-400 font-black text-2xl drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] absolute whitespace-nowrap italic"
                        >
                            {toast.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
