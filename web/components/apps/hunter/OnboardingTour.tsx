import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, Target, BrainCircuit, Cpu, ExternalLink } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: 'Bem-vindo ao Mural do Caçador',
            description: 'Este é o seu centro de operações para a busca de vagas e gestão de currículos.',
            icon: Target,
            color: 'red'
        },
        {
            title: 'Varredura de Vagas',
            description: 'Use o terminal de busca para encontrar vagas em plataformas como LinkedIn, Gupy e outras.',
            icon: Cpu,
            color: 'red'
        },
        {
            title: 'Análise de Alvos',
            description: 'Visualize e gerencie os alvos que você está monitorando, incluindo análise de compatibilidade.',
            icon: BrainCircuit,
            color: 'cyan'
        },
        {
            title: 'Simulador de Entrevistas',
            description: 'Pratique entrevistas com base nas análises de compatibilidade e receba feedback.',
            icon: ExternalLink,
            color: 'cyan'
        },
        {
            title: 'Pronto para Começar!',
            description: 'Você está pronto para começar a caçar vagas. Boa sorte!',
            icon: Check,
            color: 'green'
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative w-full max-w-2xl bg-[#050505] border border-${steps[step].color}-500/20 rounded-3xl overflow-hidden shadow-2xl`}
            >
                <div className={`absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-t from-transparent to-${steps[step].color}-500`} aria-hidden="true"></div>

                <div className="p-8 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`p-3 rounded-xl border border-${steps[step].color}-500/30 bg-${steps[step].color}-500/10`}>
                            {(() => {
                                const Icon = steps[step].icon;
                                return <Icon className={`w-6 h-6 text-${steps[step].color}-400`} />;
                            })()}
                        </div>
                        <button onClick={onComplete} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className={`text-3xl font-bold text-${steps[step].color}-400`}>{steps[step].title}</h2>
                            <p className="text-slate-300 leading-relaxed">{steps[step].description}</p>

                            <div className="flex items-center gap-2 mt-8">
                                {steps.map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${i <= step ? `bg-${steps[step].color}-400` : 'bg-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-end mt-8">
                        <button 
                            onClick={handleNext}
                            className={`px-6 py-3 rounded-xl border border-${steps[step].color}-500/30 bg-${steps[step].color}-500/10 hover:bg-${steps[step].color}-500/20 text-${steps[step].color}-400 transition-all flex items-center gap-2`}
                        >
                            {step < steps.length - 1 ? (
                                <>
                                    Próximo <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>Começar <Check className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}