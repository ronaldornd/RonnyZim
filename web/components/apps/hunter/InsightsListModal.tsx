"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, 
    XCircle, 
    Briefcase, 
    FileText, 
    ExternalLink, 
    Trash2 
} from 'lucide-react';
import { HunterInsight } from './HunterBoard';

interface InsightsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    insights: HunterInsight[];
    getScoreColor: (score: number) => string;
    openDocument: (fileName: string) => void;
    onDelete: (id: string) => void;
}

export function InsightsListModal({ 
    isOpen, 
    onClose, 
    insights, 
    getScoreColor, 
    openDocument, 
    onDelete 
}: InsightsListModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[80vh] bg-[#0A0A0A] border border-red-500/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden"
                    >
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30">
                                    <Target className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-red-500 tracking-tighter uppercase">Cofre de Inteligência</h2>
                                    <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-1">{insights.length} REGISTROS ENCONTRADOS</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500 hover:text-white"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid gap-3">
                                {insights.map((insight) => (
                                    <div 
                                        key={insight.id}
                                        className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl border ${insight.document_type === 'Job' ? 'bg-red-500/10 border-red-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                                                {insight.document_type === 'Job' ? (
                                                    <Briefcase className="w-4 h-4 text-red-400" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-cyan-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{insight.document_name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                                        {insight.document_type === 'Job' ? 'Alvo Adquirido' : 'Protocolo Currículo'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-zinc-700">•</span>
                                                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                                        {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-tighter ${getScoreColor(insight.score)}`}>
                                                {insight.score} MATCH
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDocument(insight.document_name);
                                                    }}
                                                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                                                    title="Ver Documento"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(insight.id);
                                                    }}
                                                    className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
