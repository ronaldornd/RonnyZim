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
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#0B0514] border border-amber-500/30 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.1)]"
            >
                {/* HEAD */}
                <div className="flex items-center justify-between p-6 border-b border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Hammer size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Armamento Forjado</h2>
                            <p className="text-xs font-mono text-amber-500/80">CV Forge • Auto-Tailored Presentation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    
                    {/* RESUME SUMMARY */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Resume Summary (Objective)
                            </h3>
                            <button
                                onClick={() => copyToClipboard(resumeSummary, 'RS')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer z-10"
                            >
                                {copiedRS ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copiedRS ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-sans leading-relaxed text-sm whitespace-pre-wrap">
                            {resumeSummary}
                        </div>
                    </div>

                    {/* COVER LETTER */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Cover Letter Integrada
                            </h3>
                            <button
                                onClick={() => copyToClipboard(coverLetter, 'CL')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer z-10"
                            >
                                {copiedCL ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copiedCL ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                        <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-sans leading-relaxed text-sm whitespace-pre-wrap">
                            {coverLetter}
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
}
