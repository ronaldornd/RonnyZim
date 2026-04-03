'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, 
    ChevronLeft,
    X,
    CheckCircle2
} from 'lucide-react';
import { useCyberSFX } from '@/lib/hooks/useCyberSFX';
import { DataStreamBackground } from './DataStreamBackground';
import { HolographicIcon } from './HolographicIcon';

type IconType = 'nexus' | 'hunter' | 'matrix' | 'astro' | 'listening';

interface Slide {
    id: IconType;
    title: string;
    subtitle: string;
    description: string;
    color: string;
    feature: string;
}

const SLIDES: Slide[] = [
    {
        id: 'nexus',
        title: 'BEM-VINDO AO NEXUS',
        subtitle: 'NÍVEL PROBATÓRIO: 1.0',
        description: 'Você acaba de acessar o RonnyZim OS. Esta é sua interface tática para evolução de carreira e domínio técnico.',
        color: '#00f2ff',
        feature: 'SISTEMA OPERACIONAL'
    },
    {
        id: 'hunter',
        title: 'HUNTER BOARD',
        subtitle: 'ANÁLISE DE DOSSIÊ: [ATIVO]',
        description: 'Mapeie o mercado. O Dossiê de Alvos analisa vagas e calcula seu Match Score real usando a inteligência do Gemini.',
        color: '#ff003c',
        feature: 'INTELIGÊNCIA DE MERCADO'
    },
    {
        id: 'listening',
        title: 'LISTENING ROOM',
        subtitle: 'CALIBRAGEM DE CONFIANÇA: ONLINE',
        description: 'Treine para entrevistas. Nossa IA analisa sua voz, detecta hesitações e avalia seu nível de confiança comportamental.',
        color: '#00ff41',
        feature: 'ANÁLISE COMPORTAMENTAL'
    },
    {
        id: 'matrix',
        title: 'MATRIZ DE IDENTIDADE',
        subtitle: 'NÍVEL DE AURA: [CALCULANDO]',
        description: 'Sua ficha de personagem. Ganhe XP, suba de nível e gerencie os fatos que o sistema conhece sobre sua jornada.',
        color: '#7000ff',
        feature: 'PROGRESSÃO DE XP'
    },
    {
        id: 'astro',
        title: 'ASTRO GAPS',
        subtitle: 'SINCRONIA CIRCADIANA: SINCRONIZANDO',
        description: 'Biorritmo técnico. Saiba o momento exato de estudar ou descansar baseado em picos de energia solar e biológica.',
        color: '#ffae00',
        feature: 'OTIMIZAÇÃO DE GRIND'
    }
];

const TypewriterText = ({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) => {
    const letters = text.split("");
    return (
        <span className={className}>
            {letters.map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.05,
                        delay: delay + index * 0.03,
                        ease: "easeInOut",
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
};

interface BinaryCoordsProps {
  color: string;
}

const BinaryCoords = ({ color }: BinaryCoordsProps) => {
    const [coords, setCoords] = useState({ x: '0000', y: '0000' });

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            setCoords({
                x: e.clientX.toString(2).slice(-8).padStart(8, '0'),
                y: e.clientY.toString(2).slice(-8).padStart(8, '0')
            });
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    return (
        <div className="absolute top-2 right-4 font-mono text-[8px] opacity-30 select-none pointer-events-none" style={{ color }}>
            X:{coords.x} / Y:{coords.y}
        </div>
    );
};

interface OnboardingTutorialProps {
    onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
    const [current, setCurrent] = useState(0);
    const { playSFX } = useCyberSFX();

    const handleNext = useCallback(() => {
        playSFX('UI_CLICK');
        if (current < SLIDES.length - 1) {
            setCurrent(current + 1);
        } else {
            onComplete();
        }
    }, [current, onComplete, playSFX]);

    const handlePrev = useCallback(() => {
        playSFX('UI_CLICK');
        if (current > 0) {
            setCurrent(current - 1);
        }
    }, [current, playSFX]);

    const slide = SLIDES[current];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none">
            {/* Background Stream */}
            <DataStreamBackground />

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-2xl px-8 py-12 bg-black/60 border-2 rounded-3xl backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    style={{ borderColor: `${slide.color}20` }}
                >
                    {/* Binary HUD */}
                    <BinaryCoords color={slide.color} />

                    <div className="flex flex-col md:flex-row items-center gap-12">
                        {/* Left Side: Icon */}
                        <div className="flex-shrink-0 animate-pulse-slow">
                            <HolographicIcon type={slide.id} color={slide.color} />
                        </div>

                        {/* Right Side: Content */}
                        <div className="flex-grow flex flex-col items-center md:items-start text-center md:text-left">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-2"
                            >
                                <span className="text-[10px] font-mono tracking-[0.3em] opacity-40 uppercase">
                                    {slide.feature}
                                </span>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mt-1" style={{ color: slide.color }}>
                                    <TypewriterText text={slide.title} />
                                </h2>
                                <div className="text-[10px] font-mono mt-1 opacity-60" style={{ color: slide.color }}>
                                    [ {slide.subtitle} ]
                                </div>
                            </motion.div>

                            <p className="text-white/80 text-lg leading-relaxed mb-10 font-light italic mt-6">
                                "{slide.description}"
                            </p>

                            {/* Progress Dots */}
                            <div className="flex gap-2 mb-10">
                                {SLIDES.map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-10' : 'w-2 opacity-20'}`}
                                        style={{ backgroundColor: slide.color }}
                                    />
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 w-full">
                                <button 
                                    onClick={() => { playSFX('GLITCH_ERROR'); onComplete(); }}
                                    onMouseEnter={() => playSFX('UI_CLICK')}
                                    className="text-[10px] font-mono opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 uppercase tracking-widest group"
                                >
                                    <X className="w-3 h-3 group-hover:rotate-90 transition-transform" /> PULAR_PROTOCOLO
                                </button>

                                <div className="flex gap-3">
                                    {current > 0 && (
                                        <button 
                                            onClick={handlePrev}
                                            onMouseEnter={() => playSFX('UI_CLICK')}
                                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={handleNext}
                                        onMouseEnter={() => playSFX('UI_CLICK')}
                                        className="px-8 py-3 rounded-xl font-black text-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                                        style={{ 
                                            backgroundColor: slide.color,
                                            boxShadow: `0 0 20px ${slide.color}40`
                                        }}
                                    >
                                        {current === SLIDES.length - 1 ? (
                                            <>INICIAR_SISTEMA <CheckCircle2 className="w-5 h-5" /></>
                                        ) : (
                                            <>PRÓXIMA_FASE <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scanline Overlay inside Card */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
