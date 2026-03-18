"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Target, Activity, FileSearch } from 'lucide-react';

export interface AnalysisData {
    score: number;
    summary: string;
    key_points: string[];
    action_plan: string;
}

interface AnalysisCardProps {
    data: AnalysisData;
}

export default function AnalysisCard({ data }: AnalysisCardProps) {
    // Determinar a cor base do score
    let scoreColor = 'text-green-400';
    let scoreBg = 'bg-green-500/10';
    let scoreBorder = 'border-green-500/50';

    if (data.score < 50) {
        scoreColor = 'text-red-400';
        scoreBg = 'bg-red-500/10';
        scoreBorder = 'border-red-500/50';
    } else if (data.score < 80) {
        scoreColor = 'text-yellow-400';
        scoreBg = 'bg-yellow-500/10';
        scoreBorder = 'border-yellow-500/50';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl bg-[#0a0f0a] border border-green-500/20 rounded-xl overflow-hidden font-sans shadow-[0_0_20px_rgba(34,197,94,0.05)] mt-4 mb-2"
        >
            {/* Cabeçalho do Cartão */}
            <div className="border-b border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <FileSearch className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest leading-none">Intelligence Report</h3>
                        <p className="text-[10px] text-green-500/60 font-mono mt-1">NATIVE GEMINI ENGINE // AUTOMATED ANALYSIS</p>
                    </div>
                </div>

                {/* Visualizador de Score (Circular simplificado com stroke-dasharray para web padrão) */}
                <div className="relative flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${scoreBorder} ${scoreBg}`}>
                        <span className={`text-xl font-black ${scoreColor}`}>{data.score}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Veredito */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        <Activity className="w-4 h-4 text-slate-500" />
                        Executive Summary
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
                        {data.summary}
                    </p>
                </div>

                {/* Pontos Chave */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        <Target className="w-4 h-4 text-slate-500" />
                        Data Points
                    </h4>
                    <ul className="space-y-2">
                        {data.key_points.map((point, i) => {
                            const isWarning = point.startsWith('⚠') || point.toLowerCase().includes('falta') || point.toLowerCase().includes('ausência');
                            const Icon = isWarning ? AlertTriangle : CheckCircle2;
                            const colorClass = isWarning ? 'text-yellow-400' : 'text-green-400';
                            const cleanPoint = point.replace(/^[✓⚠]\s*/, ''); // limpa os emoticons se a string já vier com eles

                            return (
                                <li key={i} className="flex items-start gap-3 bg-white/[0.02] p-2 rounded-md border border-white/5">
                                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorClass}`} />
                                    <span className="text-sm text-slate-300">{cleanPoint}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Action Plan */}
                <div
                    className="bg-green-500/5 rounded-lg border border-green-500/20 p-4"
                    role="region"
                    aria-label="Action Plan"
                >
                    <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-2">
                        <span>⚡</span> Next Strategic Action
                    </h4>
                    <p className="text-sm text-green-100/90 leading-relaxed">
                        {data.action_plan}
                    </p>
                </div>
            </div>

        </motion.div>
    );
}
