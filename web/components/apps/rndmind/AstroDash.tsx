"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/browser';
import {
    Sparkles,
    RefreshCw,
    ChevronDown,
    Zap,
    AlertTriangle,
    Focus,
    Loader2
} from 'lucide-react';

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
}

const CACHE_KEY = 'rndmind_astro_cache';

const themeConfig = {
    energy: {
        icon: Zap,
        border: 'border-teal-500/30',
        accent: 'text-teal-400',
        glow: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.15)]',
        dot: '#14b8a6',
        bg: 'bg-teal-500/5',
        badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
        label: 'Energia',
    },
    warning: {
        icon: AlertTriangle,
        border: 'border-amber-500/30',
        accent: 'text-amber-400',
        glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
        dot: '#f59e0b',
        bg: 'bg-amber-500/5',
        badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        label: 'Atenção',
    },
    focus: {
        icon: Focus,
        border: 'border-violet-500/30',
        accent: 'text-violet-400',
        glow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]',
        dot: '#8b5cf6',
        bg: 'bg-violet-500/5',
        badge: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
        label: 'Foco',
    },
} as const;

function getCachedData(): AstroData | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached: AstroData = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        // Retorna apenas se a data do cache corresponder a hoje
        if (cached.date_key === today) return cached;
        return null;
    } catch {
        return null;
    }
}

function setCachedData(data: AstroData) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { /* ignorar erros de cota */ }
}

export default function AstroDash() {
    const [data, setData] = useState<AstroData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fromCache, setFromCache] = useState(false);
    const [birthDate, setBirthDate] = useState<string | null>(null);

    // Carrega o perfil natal do usuário de user_facts no Supabase
    const loadUserProfile = async (): Promise<{ bd: string | null; bt: string | null; bc: string | null }> => {
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { bd: null, bt: null, bc: null };
            const { data: facts } = await supabase
                .from('user_facts')
                .select('property_key, value')
                .eq('user_id', session.user.id)
                .in('property_key', ['birth_date', 'birth_time', 'birth_city']);
            const fMap: Record<string, string> = {};
            (facts || []).forEach((f: any) => { fMap[f.property_key] = f.value; });
            const bd = fMap.birth_date || null;
            const bt = fMap.birth_time || null;
            const bc = fMap.birth_city || null;
            if (bd) setBirthDate(bd);
            return { bd, bt, bc };
        } catch { return { bd: null, bt: null, bc: null }; }
    };

    const fetchInsights = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                setData(cached);
                setFromCache(true);
                setLoading(false);
                return;
            }
        }

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user.id;

            // Obtém perfil natal completo de user_facts
            const natal = await loadUserProfile();
            const params = new URLSearchParams();
            if (natal.bd) params.set('birthDate', natal.bd);
            if (natal.bt) params.set('birthTime', natal.bt);
            if (natal.bc) params.set('birthCity', natal.bc);
            const qs = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/api/rndmind/daily${qs}`);
            if (!res.ok) throw new Error('Falha ao consultar o motor astral.');
            const json: AstroData & { daily_energy_score: number } = await res.json();
            
            setCachedData(json);
            setData(json);
            setFromCache(false);

            // [Phase 4] Salva pontuação de energia diária e afinidade técnica em user_facts
            if (userId) {
                const factsToUpsert = [];
                
                if (json.daily_energy_score !== undefined) {
                    factsToUpsert.push({
                        user_id: userId,
                        category: 'astrology',
                        property_key: 'astro_daily_energy',
                        value: String(json.daily_energy_score)
                    });
                }

                const data = json as any;
                if (data.technical_affinity) {
                    factsToUpsert.push({
                        user_id: userId,
                        category: 'astrology',
                        property_key: 'astro_technical_focus',
                        value: JSON.stringify(data.technical_affinity)
                    });
                }

                if (factsToUpsert.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('user_facts')
                        .upsert(factsToUpsert, { onConflict: 'user_id,property_key' });
                    
                    if (upsertError) {
                        console.error('❌ Falha ao salvar fatos astrais no Supabase:', upsertError);
                    } else {
                        console.log(`✨ Astral sync complete: Energy and Technical Focus saved.`);
                    }
                }
            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights(false);
    }, []);

    const generatedAt = data?.generated_at
        ? new Date(data.generated_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
        : null;

    return (
        <div
            className="h-full w-full overflow-y-auto custom-scrollbar relative"
            style={{ background: 'radial-gradient(ellipse at top right, #0b0514 0%, #050505 60%)' }}
        >
            {/* Ambient Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                            <Sparkles className="w-7 h-7 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">RND Mind</h1>
                            <p className="text-xs font-mono text-violet-400/70 uppercase tracking-widest">Painel Astro-Analítico</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchInsights(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm
                                        hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all group disabled:opacity-40"
                            >
                                <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
                                Atualizar
                            </button>
                        </div>
                        {generatedAt && (
                            <span className="text-[10px] font-mono text-slate-600">
                                {fromCache ? '📦 Cache • ' : '✨ '}Gerado às {generatedAt}
                            </span>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border border-violet-500/20 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                            </div>
                            <div className="absolute inset-0 rounded-full blur-lg bg-violet-500/10 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-400 font-mono">Consultando o éter...</p>
                            <p className="text-xs text-slate-600 mt-1">Cruzando dados natais com o céu de hoje</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-center text-sm text-red-400 font-mono">
                        {error}
                        <button onClick={() => fetchInsights(false)} className="block mx-auto mt-3 underline text-xs opacity-70">Tentar novamente</button>
                    </div>
                )}

                {/* Cards Grid */}
                {!loading && data?.cards && (
                    <div className="space-y-4">
                        {data.cards.map((card, idx) => {
                            const cfg = themeConfig[card.theme];
                            const Icon = cfg.icon;
                            const isExpanded = expandedId === card.id;

                            return (
                                <motion.div
                                    key={card.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                                    onClick={() => setExpandedId(isExpanded ? null : card.id)}
                                    className={`relative cursor-pointer border rounded-2xl p-5 transition-all duration-300 ${cfg.border} ${cfg.bg} ${cfg.glow} hover:border-opacity-60`}
                                >
                                    {/* Neon top line */}
                                    <div
                                        className="absolute top-0 left-8 right-8 h-[1px] opacity-50"
                                        style={{ background: `linear-gradient(90deg, transparent, ${cfg.dot}, transparent)` }}
                                    />

                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${cfg.badge.split(' ').slice(0,2).join(' ')}`}>
                                                <Icon className={`w-4 h-4 ${cfg.accent}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold text-white">{card.title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${cfg.badge}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed">{card.summary}</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="flex-shrink-0 mt-1"
                                        >
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        </motion.div>
                                    </div>

                                    {/* Expanded Detail */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-3">Análise Detalhada</p>
                                                    <p className={`text-sm leading-relaxed ${cfg.accent}`} style={{ opacity: 0.85 }}>
                                                        {card.detailed_analysis}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Natal Note */}
                {!loading && data && (
                    <div className="mt-8 flex items-center gap-2 text-[11px] font-mono text-slate-600">
                        <Sparkles className="w-3 h-3 text-violet-500/40" />
                        {birthDate
                            ? `Análise baseada nos dados natais registrados · Trânsitos astrológicos de hoje`
                            : `Configure seu perfil natal na Identidade para análises personalizadas`}
                    </div>
                )}
            </div>

            {/* Estilo de scrollbar customizado */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
