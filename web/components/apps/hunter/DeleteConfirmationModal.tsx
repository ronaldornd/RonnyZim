"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm }: DeleteConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-red-950/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-[#0a0505] border border-red-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-[60px]" />
                        
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <AlertTriangle size={32} className="animate-pulse" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Protocolo de Exclusão</h3>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                    Você está prestes a remover permanentemente este registro do <span className="text-red-400/80 font-bold">Cofre Neural</span>. Esta ação é irreversível.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                <button 
                                    onClick={onClose}
                                    className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Abortar
                                </button>
                                <button 
                                    onClick={onConfirm}
                                    className="px-6 py-4 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
