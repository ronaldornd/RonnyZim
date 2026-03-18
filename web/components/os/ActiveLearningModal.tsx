"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Terminal, BrainCircuit, X } from 'lucide-react';

export interface ActiveLearningModalProps {
    isOpen: boolean;
    question: string;
    category: string;
    agentId?: string;
    onResolve: (answer: string) => void;
    onCancel: () => void;
}

// OS-Theming for the Agents (Colors and Icons)
const AGENT_THEMES: Record<string, { color: string; icon: React.FC<any>; bg: string }> = {
    hunterzim: { color: 'text-red-400', bg: 'bg-red-500/10', icon: Terminal },
    orchestrator: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: BrainCircuit },
    default: { color: 'text-green-400', bg: 'bg-green-500/10', icon: AlertCircle }
};

export default function ActiveLearningModal({
    isOpen,
    question,
    category,
    agentId = 'default',
    onResolve,
    onCancel
}: ActiveLearningModalProps) {
    const [inputValue, setInputValue] = useState('');

    const activeTheme = AGENT_THEMES[agentId?.toLowerCase()] || AGENT_THEMES.default;
    const Icon = activeTheme.icon;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onResolve(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop Glass */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal OS Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", bounce: 0.25 }}
                        className={`
              relative w-full max-w-lg overflow-hidden rounded-xl 
              border border-green-500/20 bg-slate-900/90 backdrop-blur-xl 
              shadow-[0_0_40px_rgba(34,197,94,0.15)]
            `}
                    >
                        {/* Header (OS Window Bar) */}
                        <div className={`flex items-center justify-between border-b border-green-500/20 px-4 py-3 ${activeTheme.bg}`}>
                            <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${activeTheme.color}`} />
                                <span className="text-sm font-medium tracking-wider text-green-300 uppercase">
                                    Interrupção do Sistema • {agentId}
                                </span>
                            </div>

                            <button
                                onClick={onCancel}
                                className="rounded-full p-1.5 text-green-500/50 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                title="Ignorar (Abandonar Aprendizado)"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Content Body */}
                        <form onSubmit={handleSubmit} className="p-6">

                            <div className="mb-6 space-y-2">
                                <div className="inline-block rounded-full border border-green-500/20 bg-green-500/5 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-green-400">
                                    Categoria: {category}
                                </div>
                                <h3 className="text-xl font-medium leading-snug text-slate-100 mt-2">
                                    {question}
                                </h3>
                            </div>

                            {/* Input */}
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Insira o Dado Faltante / Fato..."
                                    className={`
                    w-full rounded-lg border-2 border-green-500/20 bg-black/50 px-4 py-3 
                    text-green-100 placeholder-green-700/50 shadow-inner
                    focus:border-transparent focus:outline-none focus:ring-2 
                    focus:ring-green-500/50 transition-all
                  `}
                                />
                            </div>

                            {/* Action Bar */}
                            <div className="mt-8 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-green-500/60 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                >
                                    Ignorar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className={`
                    rounded-lg px-6 py-2 text-sm font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all
                    disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none
                    bg-gradient-to-r from-green-400 to-green-500 hover:from-green-300 hover:to-green-400
                  `}
                                >
                                    Confirmar & Retomar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
