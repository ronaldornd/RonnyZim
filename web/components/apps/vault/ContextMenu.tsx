"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FolderOpen, Trash2, BrainCircuit } from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string) => void;
    fileName?: string;
}

export default function ContextMenu({ x, y, isOpen, onClose, onAction, fileName }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{ top: y, left: x }}
                className="fixed z-50 w-56 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black overflow-hidden flex flex-col"
            >
                <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider truncate block">
                        {fileName || 'Arquivo Selecionado'}
                    </span>
                </div>

                <div className="p-1 flex flex-col">
                    <button
                        onClick={() => onAction('open')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-sm text-slate-200 transition-colors text-left"
                    >
                        <FolderOpen className="w-4 h-4 text-slate-400" />
                        Abrir
                    </button>

                    <button
                        onClick={() => onAction('download')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-sm text-slate-200 transition-colors text-left"
                    >
                        <Download className="w-4 h-4 text-slate-400" />
                        Download
                    </button>

                    <div className="h-[1px] bg-white/5 my-1 mx-2" />

                    <button
                        onClick={() => onAction('analyze')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-amber-500/10 rounded-lg text-sm text-amber-400 transition-colors text-left group"
                    >
                        <BrainCircuit className="w-4 h-4 group-hover:animate-pulse" />
                        Analisar com HunterZim
                    </button>

                    <div className="h-[1px] bg-white/5 my-1 mx-2" />

                    <button
                        onClick={() => onAction('delete')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 rounded-lg text-sm text-red-400 transition-colors text-left"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
