"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Sparkles, Moon, Sun, Activity } from 'lucide-react';
import { useBiorhythm } from '@/lib/hooks/useBiorhythm';

interface BiorhythmWidgetProps {
    userId?: string;
}

export default function BiorhythmWidget({ userId }: BiorhythmWidgetProps) {
    const { phase, phaseName, recommendedStack, astroModifier, glowColor, currentTime } = useBiorhythm(userId);

    const getPhaseIcon = () => {
        switch (phase) {
            case 'peak': return <Zap className="w-5 h-5 text-emerald-400" />;
            case 'creative': return <Sparkles className="w-5 h-5 text-purple-400" />;
            default: return <Moon className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden p-4 rounded-2xl border backdrop-blur-md bg-black/40 transition-all duration-500 ${glowColor} border-white/5 flex flex-col md:flex-row items-center justify-between gap-4`}
        >
            {/* Ambient Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 pointer-events-none rounded-full
                ${phase === 'peak' ? 'bg-emerald-500' : phase === 'creative' ? 'bg-purple-500' : 'bg-blue-500'}`} 
            />

            <div className="flex items-center gap-4 z-10 w-full md:w-auto">
                {/* Pulsing Indicator */}
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className={`absolute inset-0 rounded-full blur-md opacity-30
                            ${phase === 'peak' ? 'bg-emerald-500' : phase === 'creative' ? 'bg-purple-500' : 'bg-blue-500'}`}
                    />
                    <div className="relative p-3 rounded-full bg-white/5 border border-white/10">
                        {getPhaseIcon()}
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold tracking-widest text-white/40 uppercase">Biorritmo Técnico</span>
                        {astroModifier && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-500 font-mono flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                {astroModifier}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">{phaseName}</h3>
                    <p className="text-xs font-mono text-slate-400 tracking-wide mt-1">
                        Sincronizado: Foco em <span className="text-white font-bold">{recommendedStack.slice(0, 4).join(', ')}...</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center md:items-end justify-center z-10 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">
                    <Clock className="w-5 h-5 text-white/30" />
                    {currentTime}
                </div>
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Tempo Local Operacional</div>
            </div>
        </motion.div>
    );
}
