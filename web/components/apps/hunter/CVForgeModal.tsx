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
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-8"
        >
            <motion.div
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-7xl max-h-[92vh] overflow-hidden bg-zinc-950/95 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.8)] relative group"
            >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

                {/* HEAD - Integrated */}
                <div className="flex items-center justify-between px-8 py-6 shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Hammer size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">Armamento Forjado</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[9px] font-mono font-bold text-amber-500/70 uppercase tracking-[0.2em]">CV Forge :: Auto-Tailored Presentation</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-3 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-foreground transition-all duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* RESUME SUMMARY - Premium Card */}
                        <div className="flex flex-col space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-4 bg-amber-500/40 rounded-full" />
                                    <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
                                        Professional Objective
                                    </h3>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(resumeSummary, 'RS')}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-300 bg-white/5 hover:bg-white/10 text-foreground tracking-widest"
                                >
                                    {copiedRS ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} className="text-zinc-500" />}
                                    {copiedRS ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <div className="flex-1 p-6 rounded-[2rem] bg-zinc-900/80 border border-white/10 shadow-inner text-zinc-200 font-sans leading-relaxed text-sm font-normal whitespace-pre-wrap text-justify relative group/box transition-colors hover:bg-zinc-900 custom-scrollbar overflow-y-auto">
                                {resumeSummary}
                            </div>
                        </div>

                        {/* COVER LETTER - Premium Card */}
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-4 bg-amber-500/40 rounded-full" />
                                    <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
                                        Cover Letter Integrada
                                    </h3>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(coverLetter, 'CL')}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-300 bg-white/5 hover:bg-white/10 text-foreground tracking-widest"
                                >
                                    {copiedCL ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} className="text-zinc-500" />}
                                    {copiedCL ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <div className="flex-1 p-6 rounded-[2rem] bg-zinc-900/80 border border-white/10 shadow-inner text-zinc-200 font-sans leading-relaxed text-sm font-normal whitespace-pre-wrap text-justify relative group/box transition-colors hover:bg-zinc-900 custom-scrollbar overflow-y-auto">
                                {coverLetter}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="px-8 py-4 bg-black/20 shrink-0 border-t border-white/5">
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
