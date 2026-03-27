import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Zap, TrendingUp, CheckCircle2, Loader2, Send, Terminal, AlertCircle } from 'lucide-react';
import { ColorMap } from '@/components/apps/genesis/StackSelector';
import ReactMarkdown from 'react-markdown';

interface QuestGeneratedCardProps {
    userId: string;
    questData: {
        id?: string;
        title: string;
        description: string;
        target_stack: string;
        xp_reward: number;
        status?: string;
    };
}

export default function QuestGeneratedCard({ questData, userId }: QuestGeneratedCardProps) {
    const [proof, setProof] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [status, setStatus] = useState(questData.status || 'Active');
    const [error, setError] = useState<string | null>(null);

    const brandColor = ColorMap[questData.target_stack.toLowerCase()] || ColorMap['default'];

    const handleValidate = async () => {
        if (!proof.trim() || !questData.id) return;
        
        setIsSubmitting(true);
        setError(null);
        setFeedback(null);

        try {
            const res = await fetch('/api/quests/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questId: questData.id,
                    userId: userId,
                    proof: proof
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha na validação');

            setFeedback(data.feedback);
            if (data.success) {
                setStatus('Completed');
            } else {
                setError('Validação recusada pela IA.');
            }
        } catch (err: any) {
            console.error('Erro de Validação:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCompleted = status === 'Completed';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`w-full max-w-2xl my-6 bg-gradient-to-br from-[#050B08] to-[#010502] border ${isCompleted ? 'border-emerald-500/50' : 'border-green-500/30'} rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden group`}
        >
            {/* Brilho de fundo ambiente correspondente à marca da stack ou verde padrão */}
            <div 
                className="absolute -top-10 -right-10 w-40 h-40 blur-[60px] rounded-full pointer-events-none opacity-20 transition-all duration-700 group-hover:opacity-40"
                style={{ backgroundColor: isCompleted ? '#10b981' : brandColor }}
            />
            
            <div className="relative z-10">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-500 uppercase">
                        <Sparkles className="w-4 h-4" />
                        <span>{isCompleted ? 'Missão Concluída' : 'Nova Missão Recebida'}</span>
                    </div>
                    {isCompleted && (
                        <div className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                            Verificado por IA
                        </div>
                    )}
                </div>

                {/* Título da Missão */}
                <h3 className={`text-2xl font-black ${isCompleted ? 'text-emerald-400' : 'text-white'} tracking-tight leading-tight flex items-center gap-3`}>
                    {questData.title}
                </h3>

                {/* Badge de Stack e XP */}
                <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-sm text-slate-300">
                        <Target className="w-4 h-4 opacity-70" />
                        <span className="font-mono font-medium">{questData.target_stack}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${isCompleted ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'} rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        <span>+{questData.xp_reward} XP {isCompleted ? 'Adquiridos' : ''}</span>
                    </div>
                </div>

                {/* Objetivo Detalhado */}
                <div className="mt-4 pt-4 border-t border-green-500/20">
                    <div className="text-sm font-bold tracking-widest text-green-500/70 uppercase mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Objetivo
                    </div>
                    <div className="text-green-100/80 leading-relaxed font-medium prose prose-invert prose-sm">
                        <ReactMarkdown>{questData.description}</ReactMarkdown>
                    </div>
                </div>

                {/* Seção de Submissão de Prova */}
                <AnimatePresence>
                    {!isCompleted ? (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 pt-6 border-t border-white/5 space-y-4"
                        >
                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                <Terminal className="w-4 h-4" />
                                <span>Prova de Execução (Código ou Texto)</span>
                            </div>
                            
                            <textarea
                                value={proof}
                                onChange={(e) => setProof(e.target.value)}
                                placeholder="Coloque aqui seu código ou explique como resolveu o desafio..."
                                className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-green-400 placeholder-green-900/40 focus:outline-none focus:border-green-500/50 font-mono custom-scrollbar transition-all"
                                disabled={isSubmitting}
                            />

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                onClick={handleValidate}
                                disabled={isSubmitting || !proof.trim() || !questData.id}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:bg-slate-800 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>IA AUDITANDO...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Submeter para Validação</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-6 pt-4 border-t border-emerald-500/20"
                        >
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Feedback do Auditor:</p>
                                <p className="text-sm text-emerald-100/80 italic">"{feedback || 'Excelente trabalho operacional. Sua matriz de identidade foi atualizada com os novos dados.'}"</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rodapé */}
                {!isCompleted && (
                    <div className="mt-6 flex items-center gap-2 text-xs font-mono text-green-500/60 uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Missão anexada à sua Matriz de Identidade.
                    </div>
                )}
            </div>
        </motion.div>
    );
}
