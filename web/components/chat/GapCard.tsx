import React, { useState } from 'react';
import { Sparkles, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GapCardProps {
    gapData: {
        category: string;
        question_to_user: string;
        importance?: string;
    };
    onSubmit: (value: string) => Promise<void>;
}

export default function GapCard({ gapData, onSubmit }: GapCardProps) {
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(inputValue);
            setIsSaved(true);
        } catch (error) {
            console.error('Falha ao enviar fato de lacuna', error);
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl my-6 bg-gradient-to-br from-[#0a150f] to-[#010902] border border-green-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)] relative overflow-hidden"
        >
            {/* Cyber-Mystic Glows */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">

                {/* Header Badge */}
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-green-400 uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>Middleware de Aprendizado Ativo: {gapData.category}</span>
                    {gapData.importance === 'high' && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px]">Alta Prioridade</span>
                    )}
                </div>

                {/* The Agent's Question */}
                <h3 className="text-lg text-green-50 font-medium leading-relaxed">
                    {gapData.question_to_user}
                </h3>

                {/* Input Area */}
                <AnimatePresence mode="wait">
                    {!isSaved ? (
                        <motion.form
                            key="form"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSubmit}
                            className="mt-2 flex gap-3"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Forneça essa informação para que o agente possa continuar..."
                                disabled={isSubmitting}
                                className="flex-1 bg-black/50 border border-green-500/20 rounded-xl px-4 py-3 text-green-100 placeholder-green-700/50 focus:outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/50 transition-all disabled:opacity-50"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !inputValue.trim()}
                                className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-xl transition-all font-bold tracking-wider uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">Salvando...</span>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Salvar na Memória
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-300"
                        >
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="font-medium text-sm">Fato salvo no banco de dados. Retomando processamento...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
}
