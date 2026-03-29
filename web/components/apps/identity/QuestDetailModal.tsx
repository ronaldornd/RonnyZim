import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, TrendingUp, CheckCircle2, Loader2, Send, Terminal, AlertCircle } from 'lucide-react';

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
    userId: string;
    quest: Quest | null;
    onClose: () => void;
    onComplete: (questId: string, xpReward: number, stackName: string) => void;
}

function parseSteps(description: string): string[] {
    if (!description) return [];
    const lines = description.split('\n').filter(l => l.trim().length > 0);
    // Prefer explicitly numbered or bulleted lines
    const listItems = lines.filter(l => /^(\d+[.)]|\*|-|•)\s/.test(l.trim()));
    if (listItems.length > 0) return listItems.map(l => l.replace(/^(\d+[.)]|\*|-|•)\s*/, '').trim());
    // Fallback: if it's short lines (not a long paragraph), treat as steps
    if (lines.length > 1 && lines.every(l => l.length < 150)) return lines;
    return lines;
}

export default function QuestDetailModal({ userId, quest, onClose, onComplete }: QuestDetailModalProps) {
    const [proof, setProof] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [completedLocally, setCompletedLocally] = useState(false);

    if (!quest) return null;

    const isCompleted = quest.completed || quest.status === 'Completed' || completedLocally;

    // Advanced Parsing
    const rawDescription = quest.description || '';
    const hasNewFormat = rawDescription.includes('[BRIEFING]');
    
    let briefing = '';
    let criteria = '';
    let finalSteps: string[] = [];

    if (hasNewFormat) {
        // Parse New Format (Case Insensitive for resilience)
        briefing = rawDescription.match(/\[BRIEFING\]([\s\S]*?)(?=\[STEPS\]|\[CRITERIA\]|$)/i)?.[1]?.trim() || '';
        const stepsText = rawDescription.match(/\[STEPS\]([\s\S]*?)(?=\[CRITERIA\]|$)/i)?.[1]?.trim() || '';
        criteria = rawDescription.match(/\[CRITERIA\]([\s\S]*?)$/i)?.[1]?.trim() || '';
        
        if (stepsText) {
            finalSteps = parseSteps(stepsText);
        }

        // If briefing is still empty but raw text exists, take the first part
        if (!briefing && rawDescription) {
            briefing = rawDescription.split(/\[STEPS\]|\[CRITERIA\]/i)[0].replace(/\[BRIEFING\]/i, '').trim();
        }
    } else {
        // Fallback for Legacy Format
        const parts = rawDescription.split(/\[CRITERIA\]/i);
        briefing = parts[0].trim();
        criteria = parts[1]?.trim() || '';
        finalSteps = parseSteps(briefing);
    }

    const hasStepsCount = finalSteps.length > 0;

    const handleValidate = async () => {
        if (!proof.trim() || !quest.id) return;
        
        setIsSubmitting(true);
        setError(null);
        setFeedback(null);

        try {
            const res = await fetch('/api/quests/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId: quest.id,
                    userId: userId,
                    proof: proof
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha na validação');

            setFeedback(data.feedback);
            if (data.success) {
                setCompletedLocally(true);
                // Trigger global update in parent after a short delay to show feedback
                setTimeout(() => {
                    onComplete(quest.id, quest.xp_reward, quest.target_stack);
                }, 2000);
            } else {
                setError(data.feedback || 'Validação recusada pela IA.');
            }
        } catch (err: any) {
            console.error('Validation Error:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-5xl bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] shadow-[0_0_120px_rgba(0,255,65,0.05)] overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Neon Header Glow */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

                        {/* Top Bar: Nav & Context */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/5 border border-green-500/20 rounded-2xl">
                                    <Target className="w-4 h-4 text-green-400" />
                                    <span className="text-[10px] font-mono font-bold text-green-400 tracking-[0.3em] uppercase">
                                        {quest.target_stack}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                                    <span className="text-[10px] font-mono font-bold text-amber-500 tracking-wider">+{quest.xp_reward} XP</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-white transition-all p-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 group"
                            >
                                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
                            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                                
                                {/* Left Column: Mission Briefing & Execution */}
                                <div className="flex-1 space-y-10">
                                    <header className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-0.5 w-12 bg-green-500/30 rounded-full" />
                                            <span className="text-[10px] font-black text-green-500/50 uppercase tracking-[0.5em]">Transmissão Ativa</span>
                                        </div>
                                        <h2 className={`text-xl lg:text-2xl font-black ${isCompleted ? 'text-emerald-400' : 'text-white'} leading-tight tracking-tight`}>
                                            {quest.title}
                                        </h2>
                                    </header>
                                    
                                    {/* Briefing Card */}
                                    <div className="relative group">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-green-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative space-y-3">
                                            <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Briefing Tático
                                            </p>
                                            <p className="text-base text-slate-200 leading-relaxed font-medium">
                                                {briefing || 'Aguardando transmissão de briefing...'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Operational Steps Grid */}
                                    <div className="space-y-6 flex flex-col overflow-hidden">
                                        <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Objetivos de Campo</p>
                                        <div className={`grid ${finalSteps.length > 3 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[350px]`}>
                                            {hasStepsCount ? (
                                                finalSteps.map((step, idx) => (
                                                    <div key={idx} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all group/step shadow-sm">
                                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-green-500/10 border border-green-500/10 text-[10px] font-mono font-black text-green-400 group-hover/step:bg-green-500/20 transition-colors">
                                                            {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                                        </span>
                                                        <p className="text-sm text-slate-300 font-medium leading-relaxed pt-1">{step}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-500 italic p-4 border border-dashed border-white/10 rounded-2xl">
                                                    Analisando frequências... os objetivos estão sendo descriptografados.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Command & Validation (Pinned Width) */}
                                <div className="lg:w-[380px] lg:flex-shrink-0 space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
                                    
                                    {/* Protocol Card */}
                                    {criteria && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-amber-500 uppercase">
                                                <Terminal className="w-3.5 h-3.5" />
                                                <span>Protocolo de Prova</span>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 border-l-2 border-l-amber-500/40">
                                                <p className="text-xs text-amber-200/70 leading-relaxed font-mono font-medium">
                                                    {criteria}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Proof Input Area */}
                                    {!isCompleted ? (
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Módulo de Validação</p>
                                                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                                            </div>
                                            <textarea
                                                value={proof}
                                                onChange={(e) => setProof(e.target.value)}
                                                placeholder="Inject code evidence / logs / repo links..."
                                                className="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-5 text-sm text-green-400 font-mono placeholder-green-900/40 focus:outline-none focus:border-green-500/30 focus:bg-green-500/[0.02] transition-all resize-none shadow-inner"
                                                disabled={isSubmitting}
                                            />
                                            {error && (
                                                <div className="flex items-start gap-3 text-xs text-rose-400 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    <span className="font-medium leading-relaxed">{error}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="p-6 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[2rem] relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                                </div>
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Uplink: Validado</p>
                                                <p className="text-base text-emerald-50/90 italic font-medium leading-relaxed font-serif">
                                                    "{feedback || 'Sua contribuição foi assimilada pelo Neural Graph.'}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Action Injected in Right Column */}
                                    <div className="pt-4 flex gap-3">
                                        {!isCompleted && (
                                            <button
                                                onClick={handleValidate}
                                                disabled={isSubmitting || !proof.trim()}
                                                className="flex-1 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-black uppercase tracking-[0.2em]
                                                           hover:bg-green-500/20 hover:shadow-[0_0_40px_rgba(34,197,94,0.1)] disabled:opacity-20 disabled:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        <span>Validar Prova</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-4 rounded-2xl border border-white/5 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                                        >
                                            {isCompleted ? 'Fechar' : 'Depois'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
