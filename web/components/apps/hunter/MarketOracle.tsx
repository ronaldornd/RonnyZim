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
        <div className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl mb-8 relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/30">
                            <Radar className="w-5 h-5 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase">Oráculo de Mercado</h2>
                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-slate-400 font-mono tracking-widest">
                            {totalTargets} ALVOS ATIVOS ANALISADOS
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                        Detectando frequências térmicas de tecnologias com alta demanda entre seus alvos em aberto.
                        Identifique os <span className="text-red-400 font-bold">Gaps Críticos</span> e inicie a Trilha de Redenção.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <button
                        onClick={generateQuests}
                        disabled={generating || trends.length === 0}
                        className={`relative group/btn flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 font-mono text-sm tracking-widest uppercase overflow-hidden ${
                            generating ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed' :
                            success ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                            'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                        }`}
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                         success ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
                        {generating ? 'Induzindo Missões...' : success ? 'Trilha Injetada!' : 'Gerar Trilha de Redenção'}
                        
                        {/* Interactive Shine */}
                        {!generating && !success && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Heatmap Trends */}
            <div className="mt-8 flex flex-wrap gap-4">
                <AnimatePresence>
                    {trends.map((trend, idx) => (
                        <motion.div
                            key={trend.skill}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-default ${getHeatStyles(trend.heat)}`}
                        >
                            <div className="flex items-center gap-1.5 font-bold">
                                {trend.heat === 'high' ? <Flame className="w-4 h-4" /> : 
                                 trend.heat === 'mid' ? <TrendingUp className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                                <span className="text-sm tracking-tight">{trend.skill}</span>
                            </div>
                            <div className="h-4 w-px bg-white/20" />
                            <span className="text-xs font-mono font-bold">{trend.count}x</span>
                        </motion.div>
                    ))}
                    
                    {trends.length === 0 && !loading && (
                        <div className="w-full text-center py-4 border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs uppercase tracking-widest bg-white/5">
                            Nenhum Gap Crítico detectado nos alvos atuais.
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
