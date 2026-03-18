"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';

interface Quest {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    target_stack: string;
    status: string;
    completed: boolean;
}

interface QuestDetailModalProps {
    quest: Quest | null;
    onClose: () => void;
    onComplete: (questId: string, xpReward: number, stackName: string) => void;
}

// Parse numbered steps from the AI description
function parseSteps(description: string): string[] {
    if (!description) return [];
    const lines = description.split('\n').filter(l => l.trim().length > 0);
    // If it has number-prefixed lines (1. 2. 3. etc), return as steps
    const numbered = lines.filter(l => /^\d+[.)]\s/.test(l.trim()));
    if (numbered.length >= 2) return numbered.map(l => l.replace(/^\d+[.)]\s*/, '').trim());
    return lines;
}

export default function QuestDetailModal({ quest, onClose, onComplete }: QuestDetailModalProps) {
    if (!quest) return null;

    const steps = parseSteps(quest.description);
    const hasSteps = steps.length >= 2;

    return (
        <AnimatePresence>
            {quest && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,255,65,0.05)] overflow-hidden"
                    >
                        {/* Neon Header Glow */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

                        {/* Stack Badge + Close */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-md">
                                    <Target className="w-3 h-3 text-green-400" />
                                    <span className="text-[11px] font-mono font-bold text-green-400 tracking-widest uppercase">
                                        {quest.target_stack}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md">
                                    <TrendingUp className="w-3 h-3 text-amber-400" />
                                    <span className="text-[11px] font-mono font-bold text-amber-400">+{quest.xp_reward} XP</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quest Title */}
                        <div className="px-6 pt-5">
                            <h2 className="text-xl font-black text-white leading-tight">{quest.title}</h2>
                        </div>

                        {/* Steps / Description */}
                        <div className="px-6 pt-4 pb-2">
                            {hasSteps ? (
                                <div className="space-y-2">
                                    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-amber-400" />
                                        Passos para Executar
                                    </p>
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-green-500/20 transition-colors">
                                            <span className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-mono font-bold text-green-400">
                                                {idx + 1}
                                            </span>
                                            <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-3">Detalhes</p>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {quest.description || 'Nenhum detalhe adicional.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-5 mt-2 border-t border-white/5 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold hover:bg-white/5 transition-colors"
                            >
                                Fechar
                            </button>
                            {!quest.completed && (
                                <button
                                    onClick={() => {
                                        onComplete(quest.id, quest.xp_reward, quest.target_stack);
                                        onClose();
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold tracking-wide
                                               hover:bg-green-500/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Concluir Missão
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
