"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ExternalLink, 
    Trash2, 
    Target, 
    Activity, 
    CheckCircle2, 
    XCircle, 
    Zap, 
    Mic,
    Loader2,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { HunterInsight } from './HunterBoard';

interface JobCardProps {
    insight: HunterInsight;
    onSelect: (job: HunterInsight) => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, status: HunterInsight['status']) => void;
    openDocument: (name: string) => void;
    getScoreColor: (score: number) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    updatingId: string | null;
    onStartInterview: (job: HunterInsight) => void;
}

export const JobCard = ({ 
    insight, 
    onSelect, 
    onDelete, 
    onUpdateStatus, 
    openDocument,
    getScoreColor,
    getStatusIcon,
    updatingId,
    onStartInterview
}: JobCardProps) => {
    return (
        <div className="group relative w-full h-full p-8 flex flex-col justify-between overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <Target size={200} className="text-red-500" />
            </div>

            <div className="relative z-10 flex flex-col gap-8">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-red-500/50 uppercase tracking-[0.4em]">ALVO_CONFIRMADO</span>
                            <div className="h-px w-8 bg-red-500/20" />
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none max-w-lg group-hover:text-red-500 transition-colors duration-500">
                            {insight.document_name.replace(/\.[^/.]+$/, "")}
                        </h3>
                    </div>
                    
                    <div className={`p-6 rounded-3xl border shadow-2xl flex flex-col items-center justify-center min-w-[100px] backdrop-blur-xl ${getScoreColor(insight.score)}`}>
                        <span className="text-3xl font-black leading-none">{insight.score}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-50">Match</span>
                    </div>
                </div>

                {/* Analysis Snippet */}
                <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 backdrop-blur-md">
                        <p className="text-lg text-zinc-400 leading-relaxed font-medium italic">
                            "{insight.summary.slice(0, 180)}..."
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={12} /> Pontos Fortes
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {insight.gap_analysis?.strong_matches.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Gaps Críticos
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {insight.gap_analysis?.missing_skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-mono">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 flex flex-col gap-6 border-t border-white/5 pt-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Status de Infiltração</span>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(insight.status)}
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{
                                    insight.status === 'Evaluating' ? 'AVALIAÇÃO' : 
                                    insight.status === 'Applied' ? 'CANDIDATADO' : 
                                    'REJEITADO'
                                }</span>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Data da Varredura</span>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar size={12} />
                                <span className="text-xs font-bold">{new Date(insight.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => openDocument(insight.document_name)}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                        >
                            <ExternalLink size={18} />
                        </button>
                        <button 
                            onClick={() => onDelete(insight.id)}
                            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all"
                        >
                            {updatingId === insight.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onSelect(insight)}
                        className="group/btn flex items-center justify-center gap-3 py-5 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.3em] hover:bg-red-500 transition-all shadow-[0_10px_40px_rgba(239,68,68,0.2)]"
                    >
                        Abrir Dossiê <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" size={16} />
                    </button>
                    <button 
                        onClick={() => onStartInterview(insight)}
                        className="flex items-center justify-center gap-3 py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white/10 transition-all"
                    >
                        <Mic size={16} className="text-red-500" /> Simular Entrevista
                    </button>
                </div>
            </div>
        </div>
    );
};
