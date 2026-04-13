"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, 
    ExternalLink, 
    Trash2, 
    Loader2, 
    Mic 
} from 'lucide-react';
import { HunterInsight } from './HunterBoard';

interface JobCardProps {
    insight: HunterInsight;
    onSelect: (insight: HunterInsight) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: HunterInsight['status']) => void;
    openDocument: (fileName: string) => void;
    getScoreColor: (score: number) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    updatingId: string | null;
    onStartInterview: (insight: HunterInsight) => void;
}

export function JobCard({ 
    insight, 
    onSelect, 
    onDelete, 
    onUpdateStatus, 
    openDocument, 
    getScoreColor, 
    getStatusIcon, 
    updatingId, 
    onStartInterview 
}: JobCardProps) {
    return (
        <motion.article
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            aria-labelledby={`job-title-${insight.id}`}
            className="flex flex-col rounded-xl bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-500 group/card relative overflow-hidden active:scale-[0.99]"
        >
            {/* Subtle Inner Glow on Hover */}
            <div className="absolute inset-0 bg-red-500/0 group-hover/card:bg-red-500/[0.02] transition-colors duration-700 pointer-events-none" aria-hidden="true" />
            
            <div 
                onClick={() => onSelect(insight)}
                className="p-4 pb-2 flex items-start justify-between cursor-pointer relative z-10"
            >
                <div className="pr-6 space-y-1">
                    <h3 id={`job-title-${insight.id}`} className="text-lg font-bold text-white tracking-tight group-hover/card:text-red-400 transition-colors duration-300" title={insight.document_name}>
                        {insight.document_name}
                    </h3>
                    <div className="text-[9px] text-zinc-500 font-mono flex items-center gap-2 opacity-60">
                        <span className="bg-white/5 px-2 py-0.5 rounded text-zinc-400">ID: {insight.id.split('-')[0]}</span>
                        <span>•</span>
                        <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-none transition-all duration-500 group-hover/card:shadow-[0_0_20px_rgba(239,68,68,0.15)] ${getScoreColor(insight.score)}`}>
                    <span className="text-2xl font-black leading-none">{insight.score}</span>
                    <span className="text-[8px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-60">Match</span>
                </div>
            </div>

            <div className="p-4 pt-0 flex-1 flex flex-col gap-4 relative z-10">
                <div onClick={() => onSelect(insight)} className="cursor-pointer space-y-2">
                    <h4 className="text-[8px] uppercase tracking-[0.3em] font-black text-zinc-600">Sumário Executivo</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        {insight.summary}
                    </p>
                </div>

                {insight.gap_analysis && insight.gap_analysis.match_percentage !== undefined && (
                    <div className="mt-1 space-y-3">
                        <div className="flex items-center justify-between bg-red-500/[0.03] rounded-xl p-3 group/match transition-colors hover:bg-red-500/[0.08]">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Match de Combate</span>
                            </div>
                            <div className="text-xl font-black text-red-500 tracking-tighter">
                                {insight.gap_analysis.match_percentage}%
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="opacity-70">{getStatusIcon(insight.status)}</div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${insight.status === 'Applied' ? 'text-emerald-500' : insight.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'}`}>
                            {insight.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); openDocument(insight.document_name); }} className="p-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-zinc-400 hover:text-cyan-400 transition-all duration-300">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(insight.id); }} disabled={updatingId === insight.id} className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-all duration-300">
                            {updatingId === insight.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); onStartInterview(insight); }}
                    className="w-full flex items-center justify-center gap-3 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all duration-500 group/btn relative overflow-hidden active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-red-500/0 group-hover/btn:bg-red-500/[0.05] transition-colors" />
                    <Mic className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[9px] font-black font-mono uppercase tracking-[0.3em]">Iniciar Simulação</span>
                </button>
            </div>
        </motion.article>
    );
}
