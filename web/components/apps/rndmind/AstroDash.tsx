"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import {
    Sparkles,
    RefreshCw,
    ChevronRight,
    Zap,
    AlertTriangle,
    Focus,
    Loader2,
    X,
    Activity,
    Brain,
    Lock,
    Command,
    Terminal as TerminalIcon,
    Moon,
    Sun,
    Waves,
    Wind,
    Zap as ZapIcon,
    Smile,
    Flame,
    Clock
} from 'lucide-react';
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer 
} from 'recharts';

interface AstroCard {
    id: string;
    title: string;
    summary: string;
    detailed_analysis: string;
    theme: 'energy' | 'warning' | 'focus';
}

interface AstroData {
    cards: AstroCard[];
    generated_at: string;
    date_key: string;
    daily_energy_score?: number;
    technical_affinity?: Record<string, number>;
}

const CACHE_KEY = 'astrokernel_astro_cache';

const themeConfig = {
    energy: {
        icon: Zap,
        border: 'border-teal-500/20',
        accent: 'text-teal-400',
        glow: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.05)]',
        bg: 'bg-teal-500/5',
        badge: 'bg-teal-500/10 text-teal-400',
        label: 'Impulso',
    },
    warning: {
        icon: AlertTriangle,
        border: 'border-amber-500/20',
        accent: 'text-amber-400',
        glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.05)]',
        bg: 'bg-amber-500/5',
        badge: 'bg-amber-500/10 text-amber-400',
        label: 'Atenção',
    },
    focus: {
        icon: Focus,
        border: 'border-emerald-500/20',
        accent: 'text-emerald-400',
        glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]',
        bg: 'bg-emerald-500/5',
        badge: 'bg-emerald-500/10 text-emerald-400',
        label: 'Foco',
    },
} as const;

export default function AstroDash({ userId }: { userId?: string }) {
    const [data, setData] = useState<AstroData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<AstroCard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const loadUserProfile = async () => {
        try {
            const supabase = createClient();
            
            // Tenta pegar o userId da prop ou da sessão atual
            let targetUserId = userId;
            if (!targetUserId) {
                const { data: { session } } = await supabase.auth.getSession();
                targetUserId = session?.user?.id;
            }

            if (!targetUserId) {
                console.warn("AstroDash: No userId found for profile fetch");
                return { bd: null, bt: null, bc: null };
            }

            const { data: facts, error } = await supabase
                .from('user_facts')
                .select('property_key, value')
                .eq('user_id', targetUserId)
                .in('property_key', ['birth_date', 'birth_time', 'birth_city']);

            if (error) throw error;

            const fMap: Record<string, string> = {};
            (facts || []).forEach((f: any) => { fMap[f.property_key] = f.value; });
            return { bd: fMap.birth_date || null, bt: fMap.birth_time || null, bc: fMap.birth_city || null };
        } catch (err) { 
            console.error("AstroDash: Error loading profile facts:", err);
            return { bd: null, bt: null, bc: null }; 
        }
    };

    const fetchInsights = async (forceRefresh = false) => {
        setLoading(true);
        if (!forceRefresh) {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) {
                const cached: AstroData = JSON.parse(raw);
                if (cached.date_key === new Date().toISOString().split('T')[0]) {
                    setData(cached);
                    setLoading(false);
                    return;
                }
            }
        }
        try {
            const natal = await loadUserProfile();
            const res = await fetch(`/api/rndmind/daily?birthDate=${natal.bd}&birthTime=${natal.bt}&birthCity=${natal.bc}`);
            const json = await res.json();
            localStorage.setItem(CACHE_KEY, JSON.stringify(json));
            setData(json);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };

    useEffect(() => { fetchInsights(); }, []);

    const radarData = data?.technical_affinity ? Object.entries(data.technical_affinity).map(([key, val]) => ({
        subject: key.toUpperCase().slice(0, 8),
        A: Math.min(100, Math.max(20, (val as number) * 80)),
    })) : [
        { subject: 'LÓGICA', A: 85 },
        { subject: 'CRIAT.', A: 65 },
        { subject: 'FOCO', A: 90 },
        { subject: 'COMUN.', A: 70 },
        { subject: 'RESIL.', A: 75 },
    ];

    const [userFacts, setUserFacts] = useState<{ bd: string | null; bt: string | null; bc: string | null }>({ bd: null, bt: null, bc: null });

    useEffect(() => {
        loadUserProfile().then(facts => setUserFacts(facts));
    }, [userId]);

    const calculateBiorhythm = (birthDate: string | null) => {
        if (!birthDate) return { physical: 50, emotional: 50, intellectual: 50 };
        const birth = new Date(birthDate);
        const today = new Date();
        const diff = (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24);
        return {
            physical: Math.round((Math.sin(2 * Math.PI * diff / 23) + 1) * 50),
            emotional: Math.round((Math.sin(2 * Math.PI * diff / 28) + 1) * 50),
            intellectual: Math.round((Math.sin(2 * Math.PI * diff / 33) + 1) * 50)
        };
    };

    const getMoonPhase = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let y = year, m = month;
        if (m < 3) { y--; m += 12; }
        let c = 365.25 * y;
        let e = 30.6 * (m + 1);
        let jd = c + e + day - 694039.09; 
        jd /= 29.53; 
        let phase = jd - Math.floor(jd);
        let b = Math.round(phase * 8) % 8;
        const phases = [
            { name: "Lua Nova", icon: "🌑", influence: "Novos Inícios" },
            { name: "Lua Crescente", icon: "🌒", influence: "Expansão Técnica" },
            { name: "Quarto Crescente", icon: "🌓", influence: "Aceleração" },
            { name: "Crescente Gibosa", icon: "🌔", influence: "Polimento" },
            { name: "Lua Cheia", icon: "🌕", influence: "Deploy & Entrega" },
            { name: "Minguante Gibosa", icon: "🌖", influence: "Revisão Lógica" },
            { name: "Quarto Minguante", icon: "🌗", influence: "Limpeza de Débito" },
            { name: "Lua Minguante", icon: "🌘", influence: "Planejamento" }
        ];
        return phases[b];
    };

    const getSolarElement = () => {
        const month = new Date().getMonth() + 1;
        const day = new Date().getDate();
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19) || (month === 7 && day >= 23) || (month === 8 && day <= 22) || (month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: "Fogo", icon: Flame, color: "text-orange-400" };
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20) || (month === 8 && day >= 23) || (month === 9 && day <= 22) || (month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "Terra", icon: Wind, color: "text-amber-400" };
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20) || (month === 9 && day >= 23) || (month === 10 && day <= 22) || (month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "Ar", icon: Wind, color: "text-cyan-400" };
        return { name: "Água", icon: Waves, color: "text-blue-400" };
    };

    const biorhythm = calculateBiorhythm(userFacts.bd);
    const moon = getMoonPhase();
    const element = getSolarElement();
    const peakStart = (10 + (biorhythm.intellectual % 10)).toString().padStart(2, '0');
    const peakEnd = (parseInt(peakStart) + 2).toString().padStart(2, '0');

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setSyncSuccess(true);
            setTimeout(() => {
                setSelectedCard(null);
                setSyncSuccess(false);
            }, 800);
        }, 1500);
    };

    const allCards = data?.cards ? [
        ...data.cards.slice(0, 5),
        {
            id: 'cosmic-sync',
            title: 'Sincronização Cósmica',
            summary: `O alinhamento planetário atual ${moon.name === 'Lua Cheia' ? 'intensifica' : 'favorece'} o fluxo técnico. Momento ideal para refatoração e dívida técnica.`,
            detailed_analysis: `Com o trânsito solar em elemento ${element.name}, sua cognição está sintonizada com padrões estáveis. Use este impulso para consolidar estruturas lógicas críticas.`,
            theme: 'focus' as const
        }
    ] : [];

    return (
        <div className="h-full w-full bg-[#050505] flex flex-col overflow-hidden relative antialiased p-4">
            
            {/* COMPACT HUD HEADER */}
            <header className="flex items-center justify-between mb-4 pb-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <TerminalIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">
                                Astro<span className="text-emerald-500">Kernel</span>
                            </h1>
                            <span className="text-[8px] font-black px-1.5 py-0.5 border border-emerald-500/20 text-emerald-400 rounded uppercase tracking-tighter">OS-2.0</span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Cognition Unit • RonnyZim Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right border-r border-white/10 pr-4">
                        <span className="text-[8px] font-mono text-slate-600 block uppercase">Clock</span>
                        <span className="text-xs font-black text-white font-mono italic">
                            {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString('pt-BR') : '--:--:--'}
                        </span>
                    </div>
                    <button onClick={() => fetchInsights(true)} disabled={loading} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-emerald-400 hover:border-emerald-500/30 transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">Handshaking Core...</span>
                </div>
            ) : data ? (
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                    
                    {/* LEFT PANEL: COMPACT RADAR & STATUS (COL 4) */}
                    <aside className="col-span-4 flex flex-col gap-4 min-h-0">
                        <div className="flex-1 p-5 rounded-[2rem] bg-[#0a0a0a] border border-white/5 flex flex-col min-h-0">
                            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-emerald-500" /> Pulsão Neural
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                        <PolarGrid stroke="#ffffff0a" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} />
                                        <Radar name="Energy" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-4">
                                {/* LUA */}
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sincronia Lunar</span>
                                        <span className="text-lg">{moon.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">{moon.influence}</span>
                                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-1">{moon.name}</span>
                                    </div>
                                </div>

                                {/* BIORRITMO */}
                                <div className="space-y-3 p-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Biorritmo Diário</span>
                                    </div>
                                    {[
                                        { label: 'Físico', val: biorhythm.physical, icon: Activity, color: 'bg-rose-500' },
                                        { label: 'Emocional', val: biorhythm.emotional, icon: Smile, color: 'bg-emerald-500' },
                                        { label: 'Intelectual', val: biorhythm.intellectual, icon: Brain, color: 'bg-emerald-500' }
                                    ].map(b => (
                                        <div key={b.label} className="space-y-1">
                                            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-500">
                                                <span className="flex items-center gap-1"><b.icon className="w-2.5 h-2.5" /> {b.label}</span>
                                                <span>{b.val}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${b.val}%` }} className={`h-full ${b.color} shadow-[0_0_8px_rgba(16,185,129,0.3)]`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* METADATA BOTTOM */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                                        <span className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Janela Pico</span>
                                        <span className="text-[11px] font-black text-white italic">{peakStart}:00 - {peakEnd}:00</span>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><element.icon className="w-2 h-2" /> Elemento</span>
                                        <span className={`text-[11px] font-black italic ${element.color}`}>{element.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT PANEL: GRID OF CARDS (COL 8) */}
                    <main className="col-span-8 flex flex-col min-h-0">
                        <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-1 min-h-0">
                            {allCards.map((card, idx) => {
                                const cfg = themeConfig[card.theme];
                                const Icon = card.id === 'cosmic-sync' ? ZapIcon : cfg.icon;
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedCard(card as any)}
                                        className={`p-4 rounded-[1.5rem] border ${cfg.border} ${cfg.bg} ${cfg.glow} cursor-pointer group relative overflow-hidden transition-all duration-300 flex flex-col h-full`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`p-1.5 rounded-lg bg-black/40 border ${cfg.border}`}>
                                                <Icon className={`w-3.5 h-3.5 ${cfg.accent}`} />
                                            </div>
                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border tracking-[0.2em] uppercase ${cfg.badge}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <h3 className="text-[15px] font-black text-white italic tracking-tight mb-2 truncate whitespace-nowrap overflow-hidden leading-tight">{card.title}</h3>
                                        <p className="text-[13px] text-slate-400 leading-snug line-clamp-2 md:line-clamp-3 font-medium flex-1">{card.summary}</p>
                                        
                                        <div className="mt-2 text-right">
                                            <ChevronRight className={`inline w-3 h-3 ${cfg.accent} opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                    </main>

                </div>
            ) : null}

            {/* MODAL DETALHE (Mantém o padrão No-Scroll por cima) */}
            <AnimatePresence>
                {selectedCard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCard(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                        {React.createElement(themeConfig[selectedCard.theme as keyof typeof themeConfig].icon, { className: "w-6 h-6 text-emerald-400" })}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white italic uppercase">{selectedCard.title}</h2>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${themeConfig[selectedCard.theme as keyof typeof themeConfig].badge}`}>
                                            {themeConfig[selectedCard.theme as keyof typeof themeConfig].label}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCard(null)} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            <div className="space-y-6">
                                <p className="text-[16px] text-slate-300 leading-relaxed font-medium">{selectedCard.summary}</p>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[8px] font-mono text-emerald-500/70 uppercase block mb-2 tracking-[0.2em]">Cortex Deep Scan</span>
                                    <p className="text-[14px] text-slate-400 italic">"{selectedCard.detailed_analysis}"</p>
                                </div>
                                <button 
                                    onClick={handleSync} 
                                    disabled={isSyncing || syncSuccess}
                                    className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all relative overflow-hidden ${
                                        syncSuccess ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:scale-[1.02]'
                                    }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {isSyncing ? (
                                            <motion.div key="syncing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> SINCRONIZANDO...
                                            </motion.div>
                                        ) : syncSuccess ? (
                                            <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2">
                                                COGNICÃO SINCRONIZADA ✅
                                            </motion.div>
                                        ) : (
                                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                SINCRONIZAR COGNIÇÃO
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}
