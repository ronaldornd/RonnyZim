"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ChevronLeft, ChevronRight, Pause } from 'lucide-react';

export interface Agent {
    id: string;
    name: string;
    role: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    border: string;
    howItWorks?: string;
    howToWake?: string;
}

interface AgentCarouselProps {
    agents: Agent[];
}

export default function AgentCarousel({ agents }: AgentCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isPaused) {
                handleNext();
            }
        }, 6000); 

        return () => clearInterval(timer);
    }, [isPaused, agents.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % agents.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + agents.length) % agents.length);
    };

    const activeAgent = agents[currentIndex];

    return (
        <div 
            className="h-[60vh] w-full flex items-center justify-center relative overflow-hidden group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Interactive Navigation Controls */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-50 opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 pointer-events-none">
                <button 
                    onClick={handlePrev}
                    className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all pointer-events-auto backdrop-blur-md"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext}
                    className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all pointer-events-auto backdrop-blur-md"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Pause Indicator Overlay */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-8 right-8 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-md"
                    >
                        <Pause className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest font-mono">Paused</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeAgent.id}
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col items-center text-center max-w-xl px-6"
                >
                    {/* Icon with Dynamic Glow */}
                    <div className="relative mb-8">
                        <motion.div 
                            animate={{ 
                                scale: isPaused ? 1.05 : [1, 1.1, 1],
                                opacity: isPaused ? 0.4 : [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={`absolute inset-0 blur-3xl rounded-full ${activeAgent.color.replace('text-', 'bg-')}`}
                        />
                        <div className={`relative z-10 w-24 h-24 rounded-3xl ${activeAgent.bg} border ${activeAgent.border} flex items-center justify-center shadow-2xl`}>
                            <activeAgent.icon className={`w-12 h-12 ${activeAgent.color} drop-shadow-glow`} />
                        </div>
                    </div>

                    {/* Agent Identification */}
                    <div className="space-y-2 mb-8">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 0.4 }}
                            className={`text-[10px] uppercase tracking-[0.4em] font-mono ${activeAgent.color}`}
                        >
                            Sub-Rotina de Inteligência
                        </motion.span>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                            {activeAgent.name}
                        </h2>
                        <p className={`text-[12px] font-mono tracking-widest uppercase opacity-70 ${activeAgent.color}`}>
                            {activeAgent.role}
                        </p>
                    </div>

                    {/* How it Works & Wake Up - Grid UI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/[0.03] border border-white/5 p-4 rounded-xl backdrop-blur-sm"
                        >
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Funcionamento_</span>
                            <p className="text-[12px] text-slate-300 font-mono leading-relaxed italic">
                                "{activeAgent.howItWorks || 'Processamento neural de alta densidade em background.'}"
                            </p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/[0.03] border border-white/5 p-4 rounded-xl backdrop-blur-sm"
                        >
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Despertar_</span>
                            <p className="text-[12px] text-cyan-400 font-mono leading-relaxed">
                                {activeAgent.howToWake || 'Automático via Contexto Semântico.'}
                            </p>
                        </motion.div>
                    </div>

                    {/* Progress Bar with Pause State */}
                    <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex gap-1.5">
                        {agents.map((_, i) => (
                            <div 
                                key={i}
                                className={`h-1 transition-all duration-500 rounded-full ${
                                    i === currentIndex 
                                        ? `w-8 ${isPaused ? 'bg-slate-400 opacity-50' : 'bg-cyan-500 animate-pulse'}` 
                                        : 'w-2 bg-white/10'
                                }`}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            <style jsx>{`
                .drop-shadow-glow {
                    filter: drop-shadow(0 0 8px currentColor);
                }
            `}</style>
        </div>
    );
}
