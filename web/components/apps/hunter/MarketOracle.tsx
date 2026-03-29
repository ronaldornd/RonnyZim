"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    TrendingUp, 
    Flame, 
    Radar, 
    Loader2, 
    CheckCircle2, 
    Cpu,
    Target
} from 'lucide-react';

interface OracleTrend {
    skill: string;
    count: number;
    heat: 'low' | 'mid' | 'high';
}

interface MarketOracleProps {
    userId: string;
}

export default function MarketOracle({ userId }: MarketOracleProps) {
    const [trends, setTrends] = useState<OracleTrend[]>([]);
    const [totalTargets, setTotalTargets] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/oracle/trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if (data.trends) {
                setTrends(data.trends);
                setTotalTargets(data.total_targets);
            }
        } catch (err) {
            console.error('Failed to fetch Oracle trends:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateQuests = async () => {
        try {
            setGenerating(true);
            const res = await fetch('/api/oracle/generate-quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, top_trends: trends.slice(0, 3) })
            });
            
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 5000);
            }
        } catch (err) {
            console.error('Failed to generate quests:', err);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        if (userId) fetchTrends();
    }, [userId]);

    const getHeatStyles = (heat: OracleTrend['heat']) => {
        switch (heat) {
            case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse';
            case 'mid': return 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            default: return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
        }
    };

    if (loading) {
        return (
            <div className="w-full h-32 flex items-center justify-center bg-black/20 border border-white/5 rounded-3xl backdrop-blur-md mb-8">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden group transition-all duration-500 hover:bg-card/50 shadow-2xl">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none transition-all duration-700 group-hover:bg-primary/10" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none transition-all duration-700 group-hover:bg-cyan-500/10" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                            <Radar className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Oráculo de Mercado</h2>
                            <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 font-bold uppercase mt-1">
                                {totalTargets} ALVOS ATIVOS EM ANÁLISE
                            </span>
                        </div>
                    </div>
                    <p className="text-[15px] text-zinc-400 max-w-2xl leading-relaxed font-light">
                        Detectando frequências térmicas de tecnologias com alta demanda entre seus alvos em aberto.
                        Identifique os <span className="text-primary font-bold">Gaps Críticos</span> e inicie a Trilha de Redenção.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <button
                        onClick={generateQuests}
                        disabled={generating || trends.length === 0}
                        className={`relative group/btn flex items-center gap-4 px-8 py-4 rounded-2xl border-none transition-all duration-500 font-mono text-[11px] font-bold tracking-[0.2em] uppercase overflow-hidden ${
                            generating ? 'bg-white/5 text-zinc-600 cursor-not-allowed' :
                            success ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-primary/20 hover:bg-primary/30 text-primary shadow-[0_0_40px_rgba(var(--primary),0.15)] hover:shadow-[0_0_60px_rgba(var(--primary),0.25)]'
                        }`}
                    >
                        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         success ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                        {generating ? 'Induzindo Missões...' : success ? 'Trilha Injetada!' : 'Gerar Trilha de Redenção'}
                        
                        {/* Interactive Shine */}
                        {!generating && !success && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Heatmap Trends - Clean Chips */}
            <div className="mt-12 flex flex-wrap gap-4">
                <AnimatePresence>
                    {trends.map((trend, idx) => (
                        <motion.div
                            key={trend.skill}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, ease: "easeOut" }}
                            className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-none transition-all duration-300 font-sans ${
                                trend.heat === 'high' ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]' :
                                trend.heat === 'mid' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-cyan-500/10 text-cyan-500'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 font-bold">
                                {trend.heat === 'high' ? <Flame className="w-4 h-4 animate-pulse" /> : 
                                 trend.heat === 'mid' ? <TrendingUp className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                                <span className="text-sm tracking-tight">{trend.skill}</span>
                            </div>
                            <div className="h-4 w-px bg-current opacity-20" />
                            <span className="text-xs font-mono font-black tabular-nums opacity-80">{trend.count}x</span>
                        </motion.div>
                    ))}
                    
                    {trends.length === 0 && !loading && (
                        <div className="w-full text-center py-10 border-2 border-dashed border-white/[0.03] rounded-[2rem] text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold bg-white/[0.01]">
                            Nenhum Gap Crítico detectado nos alvos atuais.
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
