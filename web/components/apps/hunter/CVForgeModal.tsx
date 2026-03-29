import React from 'react';
import { motion } from 'framer-motion';
import { X, Copy, CheckCircle2, Hammer } from 'lucide-react';

interface CVForgeModalProps {
    coverLetter: string;
    resumeSummary: string;
    onClose: () => void;
}

export default function CVForgeModal({ coverLetter, resumeSummary, onClose }: CVForgeModalProps) {
    const [copiedCL, setCopiedCL] = React.useState(false);
    const [copiedRS, setCopiedRS] = React.useState(false);

    const copyToClipboard = async (text: string, type: 'CL' | 'RS') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'CL') {
                setCopiedCL(true); setTimeout(() => setCopiedCL(false), 2000);
            } else {
                setCopiedRS(true); setTimeout(() => setCopiedRS(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xl flex items-center justify-center p-6 lg:p-12"
        >
            <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-5xl max-h-[85vh] overflow-hidden bg-card/60 backdrop-blur-2xl rounded-[3rem] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] relative group"
            >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

                {/* HEAD - Integrated */}
                <div className="flex items-center justify-between px-10 py-10 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-amber-500/10 rounded-[1.25rem] text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Hammer size={28} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Armamento Forjado</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[10px] font-mono font-bold text-amber-500/70 uppercase tracking-[0.2em]">CV Forge :: Auto-Tailored Presentation</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-4 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-foreground transition-all duration-300"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-12 custom-scrollbar">
                    
                    {/* RESUME SUMMARY - Premium Card */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-amber-500/40 rounded-full" />
                                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                                    Professional Objective
                                </h3>
                            </div>
                            <button
                                onClick={() => copyToClipboard(resumeSummary, 'RS')}
                                className="flex items-center gap-3 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.08] text-foreground tracking-widest"
                            >
                                {copiedRS ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} className="text-zinc-500" />}
                                {copiedRS ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <div className="p-10 rounded-[2.5rem] bg-white/[0.02] text-zinc-300 font-sans leading-relaxed text-lg font-light whitespace-pre-wrap relative group/box transition-colors hover:bg-white/[0.04]">
                            {resumeSummary}
                        </div>
                    </div>

                    {/* COVER LETTER - Premium Card */}
                    <div className="space-y-6 pb-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-amber-500/40 rounded-full" />
                                <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
                                    Cover Letter Integrada
                                </h3>
                            </div>
                            <button
                                onClick={() => copyToClipboard(coverLetter, 'CL')}
                                className="flex items-center gap-3 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.08] text-foreground tracking-widest"
                            >
                                {copiedCL ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} className="text-zinc-500" />}
                                {copiedCL ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <div className="p-10 rounded-[2.5rem] bg-white/[0.02] text-zinc-300 font-sans leading-relaxed text-lg font-light whitespace-pre-wrap relative group/box transition-colors hover:bg-white/[0.04]">
                            {coverLetter}
                        </div>
                    </div>

                </div>

                {/* Footer Status */}
                <div className="px-12 py-8 bg-black/20 shrink-0">
                    <div className="flex items-center gap-6 justify-center">
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>Status: Optimized</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>Model: Gemini 3.1 Neural</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
