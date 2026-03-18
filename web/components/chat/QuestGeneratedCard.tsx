import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ColorMap } from '@/components/apps/genesis/StackSelector';
import ReactMarkdown from 'react-markdown';

interface QuestGeneratedCardProps {
    questData: {
        id?: string;
        title: string;
        description: string;
        target_stack: string;
        xp_reward: number;
    };
}

export default function QuestGeneratedCard({ questData }: QuestGeneratedCardProps) {
    const brandColor = ColorMap[questData.target_stack.toLowerCase()] || ColorMap['default'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-2xl my-6 bg-gradient-to-br from-[#050B08] to-[#010502] border border-green-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden group"
        >
            {/* Ambient Background Glow matching the stack brand or default green */}
            <div 
                className="absolute -top-10 -right-10 w-40 h-40 blur-[60px] rounded-full pointer-events-none opacity-20 transition-all duration-700 group-hover:opacity-40"
                style={{ backgroundColor: brandColor }}
            />
            
            <div className="relative z-10">
                {/* Header Subtitle */}
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-500 uppercase mb-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Nova Missão Recebida</span>
                </div>

                {/* Quest Title */}
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
                    {questData.title}
                </h3>

                {/* Target Stack & XP Badge */}
                <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-sm text-slate-300">
                        <Target className="w-4 h-4 opacity-70" />
                        <span className="font-mono font-medium">{questData.target_stack}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{questData.xp_reward} XP</span>
                    </div>
                </div>

                {/* Detailed Objective */}
                <div className="mt-4 pt-4 border-t border-green-500/20">
                    <div className="text-sm font-bold tracking-widest text-green-500/70 uppercase mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Objetivo
                    </div>
                    <div className="text-green-100/80 leading-relaxed font-medium prose prose-invert prose-sm">
                        <ReactMarkdown>{questData.description}</ReactMarkdown>
                    </div>
                </div>

                {/* Footer Validation */}
                <div className="mt-6 flex items-center gap-2 text-xs font-mono text-green-500/60 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Quest anexada à sua Matriz de Identidade. Complete-a para upar.
                </div>
            </div>
        </motion.div>
    );
}
