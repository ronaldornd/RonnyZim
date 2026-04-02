'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    Cpu, 
    Layers, 
    Globe, 
    Terminal as TerminalIcon 
} from 'lucide-react';
import OnboardingTutorial from './OnboardingTutorial';
import '../../styles/boot.css';

interface BootSequenceProps {
    onComplete: () => void;
}

const BOOT_LOGS = [
    { text: "INICIANDO NÚCLEO RNDMIND...", status: "[OK]", delay: 0.5, icon: <Cpu className="w-4 h-4" /> },
    { text: "CALIBRANDO ESCUDOS DE MEMÓRIA...", status: "[OK]", delay: 1.5, icon: <ShieldCheck className="w-4 h-4" /> },
    { text: "ESTABELECENDO UPLINK TAVILY...", status: "[OK]", delay: 2.5, icon: <Globe className="w-4 h-4" /> },
    { text: "MAPEANDO DADOS TÁTICOS...", status: "[OK]", delay: 3.5, icon: <Layers className="w-4 h-4" /> },
    { text: "SISTEMA PRONTO PARA OPERAÇÃO.", status: "[READY]", delay: 4.5, icon: <TerminalIcon className="w-4 h-4" /> },
];

const NARRATIVE = [
    "BEM-VINDO AO RONNYZIM OS.",
    "INTERFACE DE COMANDO TÁTICO ATIVA.",
    "INICIANDO PROTOCOLO DE ONBOARDING..."
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
    const [narrativeIndex, setNarrativeIndex] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        // Aumentado para 7 segundos de imersão total de boot
        const timer = setTimeout(() => {
            setShowTutorial(true);
        }, 7000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (narrativeIndex < NARRATIVE.length - 1) {
            const timer = setTimeout(() => {
                setNarrativeIndex(prev => prev + 1);
            }, 2500); // 2.5s por frase (mais tempo para leitura)
            return () => clearTimeout(timer);
        }
    }, [narrativeIndex]);

    return (
        <div className="boot-container crt-flicker">
            <div className="crt-overlay" />
            <div className="scanline" />
            
            <AnimatePresence mode="wait">
                {!showTutorial ? (
                    <motion.div 
                        key="logs-and-narrative"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full flex flex-col items-center justify-between py-20 px-8"
                    >
                        {/* Logs Terminal */}
                        <div className="w-full max-w-lg mb-8 opacity-60">
                            {BOOT_LOGS.map((log, i) => (
                                <motion.div 
                                    key={i}
                                    className="log-line text-sm font-mono flex items-center gap-3 mb-2"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: log.delay, duration: 0.2 }}
                                >
                                    <span className="log-status text-cyan-400 font-bold min-w-[50px]">{log.status}</span>
                                    <span className="text-white/40">{log.icon}</span>
                                    <span className="text-white/80">{log.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Central Narrative Phrase */}
                        <div className="flex-grow flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={narrativeIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.8 }}
                                    className="text-center"
                                >
                                    <span className="text-2xl md:text-3xl font-black tracking-[0.2em] uppercase opacity-30 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                        {NARRATIVE[narrativeIndex]}
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Info */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: 1 }}
                            className="text-[10px] font-mono tracking-widest opacity-30"
                        >
                            RONNYZIM-OS // KERNEL v3.5 // ENCRYPTED_STREAM
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="tutorial"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <OnboardingTutorial onComplete={onComplete} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
