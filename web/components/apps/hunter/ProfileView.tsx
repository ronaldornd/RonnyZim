"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Target, 
    AlertOctagon, 
    Cpu, 
    AlertTriangle, 
    CheckCircle2 
} from 'lucide-react';
import { HunterInsight } from './HunterBoard';

interface ProfileViewProps {
    latestResume: HunterInsight;
}

export function ProfileView({ latestResume }: ProfileViewProps) {
    const [activeSubTab, setActiveSubTab] = useState<'VECTORS' | 'ACTION_PLAN' | 'RISKS'>('VECTORS');
    
    if (!latestResume) return null;

    const gapAnalysis = latestResume.gap_analysis || { missing_skills: [], match_percentage: 0, risks: [] };
    const actionPlan = latestResume.action_plan || [];
    const actionPlanSteps = Array.isArray(actionPlan) ? actionPlan : (actionPlan as any)?.steps || [];

    const tabs = [
        { id: 'VECTORS', label: '01. SUMÁRIO_E_VETORES', icon: Zap },
        { id: 'ACTION_PLAN', label: '02. SEQUÊNCIA_TÁTICA', icon: Target },
        { id: 'RISKS', label: '03. MATRIZ_DE_RISCO', icon: AlertOctagon },
    ] as const;

    return (
        <div className="h-full flex flex-col gap-2 p-1 overflow-hidden">
            {/* Header Ultra-Compacto Fixo */}
            <div className="flex items-center justify-between px-4 py-2 border border-cyan-500/20 bg-cyan-500/[0.03] rounded-xl backdrop-blur-md relative overflow-hidden shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <div className="text-2xl font-black text-cyan-400 italic leading-none">{latestResume.score}</div>
                        <div className="text-[7px] font-black font-mono text-cyan-500/60 uppercase tracking-widest">ÍNDICE ALPHA</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <h2 className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[200px]">
                            {latestResume.document_name}
                        </h2>
                    </div>
                </div>

                {/* Sub-Navegação Tática */}
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${
                                activeSubTab === tab.id 
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className={`w-3 h-3 ${activeSubTab === tab.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conteúdo Dinâmico com Animação */}
            <div className="flex-1 overflow-hidden relative mt-1">
                <AnimatePresence mode="wait">
                    {activeSubTab === 'VECTORS' && (
                        <motion.div
                            key="vectors"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden"
                        >
                            {/* Resumo e Forças (60%) */}
                            <div className="md:col-span-12 flex flex-col gap-4 overflow-hidden">
                                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-2xl">
                                    <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                        <Cpu className="w-3.5 h-3.5" /> Sumário de Infiltração
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium tracking-wide italic">
                                        \"{latestResume.summary}\"
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                                    {/* Forças (Vetores) */}
                                    <div className="border border-white/5 bg-cyan-500/[0.01] rounded-2xl p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <Zap className="w-3.5 h-3.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]" /> Vetores de Ataque (Forças)
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                            {(latestResume.key_points || []).slice(0, 6).map((point, i) => (
                                                <div key={i} className="text-[10px] px-3 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-3">
                                                    <span className="w-1 h-3 bg-cyan-500/40 rounded-full" />
                                                    {point}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gaps (Pontos Cegos) */}
                                    <div className="border border-white/5 bg-rose-500/[0.01] rounded-2xl p-4 flex flex-col overflow-hidden">
                                        <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Pontos Cego (Gaps_Tech)
                                        </h3>
                                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                            {(gapAnalysis.missing_skills || []).slice(0, 6).map((skill, i) => (
                                                <div key={i} className="text-[10px] px-3 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg text-rose-400/80 font-bold uppercase tracking-wider flex items-center gap-3">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500/40" />
                                                    {skill}
                                                </div>
                                            ))}
                                            {(!gapAnalysis.missing_skills || gapAnalysis.missing_skills.length === 0) && (
                                                <p className="text-slate-600 italic uppercase p-4 text-center text-[10px]">Nenhum ponto cego detectado.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSubTab === 'ACTION_PLAN' && (
                        <motion.div
                            key="action_plan"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full border border-white/5 bg-black/20 rounded-2xl p-6 flex flex-col overflow-hidden relative"
                        >
                            <div className="absolute top-6 right-6 text-[8px] font-mono text-cyan-500/30 tracking-widest">TACTICAL_SEQUENCE.SYS</div>
                            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                <Target className="w-4 h-4 shadow-[0_0_10px_rgba(34,211,238,0.4)]" /> Sequência de Intervenção (Action Plan)
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
                                {actionPlanSteps.slice(0, 6).map((step: string, i: number) => (
                                    <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all hover:border-cyan-500/30 group">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/5 flex items-center justify-center text-xs font-black font-mono text-cyan-500 border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all shadow-inner">
                                            0{i + 1}
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                                            {step}
                                        </p>
                                    </div>
                                ))}
                                {actionPlanSteps.length === 0 && (
                                    <div className="col-span-full flex items-center justify-center p-12 opacity-30">
                                        <span className="text-xs font-mono uppercase tracking-widest">Frequência Limpa: Nenhuma Intervenção Necessária</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeSubTab === 'RISKS' && (
                        <motion.div
                            key="risks"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col gap-4 overflow-hidden"
                        >
                            <div className="flex-1 border border-rose-500/10 bg-rose-500/[0.02] rounded-3xl p-8 flex flex-col overflow-hidden relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.05),transparent_40%)]" />
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.5em] flex items-center gap-4">
                                        <AlertOctagon className="w-6 h-6 animate-pulse" /> Matriz de Riscos Críticos
                                    </h3>
                                    <div className="flex flex-col items-end">
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Nível de Exposição</div>
                                        <div className="text-3xl font-black text-rose-500 italic drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">High_Risk</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                    {(Array.isArray(gapAnalysis.risks) && gapAnalysis.risks.length > 0) ? (
                                        gapAnalysis.risks.slice(0, 6).map((risk: string, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all group">
                                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shadow-[0_0_8px_rgba(244,63,94,0.6)] group-hover:scale-125 transition-transform" />
                                                <p className="text-xs text-rose-100 font-bold leading-relaxed tracking-wide uppercase">
                                                    {risk}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full h-full flex flex-col items-center justify-center opacity-20 italic">
                                            <CheckCircle2 className="w-12 h-12 mb-4" />
                                            <span className="text-sm uppercase tracking-[0.3em]">Nenhum Risco Tático Identificado</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-rose-500/10 flex justify-between items-center opacity-60">
                                    <div className="text-[8px] font-mono tracking-[0.2em] text-rose-500/50 uppercase">Secured_by_RonnyZim_Nexus</div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confiança da Análise</p>\
                                        <p className="text-sm font-black text-white italic">{(latestResume.score * 0.9).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
