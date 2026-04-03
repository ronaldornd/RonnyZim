'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SkillScanCardProps {
    id?: string;
    name: string;
    category: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    progressPercent: number;
    brandColor: string;
    onDelete?: (id: string) => void;
}

const SkillScanCard: React.FC<SkillScanCardProps> = ({
    id,
    name,
    category,
    level,
    xp,
    nextLevelXp,
    progressPercent,
    brandColor,
    onDelete
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden group backdrop-blur-md"
        >
            {/* Delete Trigger */}
            <AnimatePresence>
                {id && onDelete && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        animate={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('EXPURGAR ESTA HABILIDADE DO CÓRTEX?')) {
                                onDelete(id);
                            }
                        }}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 border border-white/10 group-hover:opacity-100 opacity-0 transition-opacity duration-300"
                    >
                        <X className="w-3 h-3 text-red-400" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Animated Scan Line */}
            <motion.div 
                animate={{ 
                    top: ['0%', '100%', '0%'],
                    opacity: [0, 0.5, 0]
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-10 pointer-events-none"
            />

            {/* Background Glow */}
            <div 
                className="absolute -inset-20 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-[80px] pointer-events-none"
                style={{ backgroundColor: brandColor }}
            />

            <div className="relative z-20">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-white/[0.02] shadow-xl transition-all group-hover:border-white/20"
                        >
                            <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ 
                                    backgroundColor: brandColor, 
                                    boxShadow: `0 0 15px ${brandColor}, 0 0 30px ${brandColor}` 
                                }} 
                            />
                        </div>
                        <div>
                            <h3 className="font-black text-xs tracking-[0.2em] uppercase text-white/90 mb-1">{name}</h3>
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{category}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[14px] font-black text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                            LVL {level}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Neural Sync: {Math.round(progressPercent)}%</span>
                        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">{xp} / {nextLevelXp} PTP</span>
                    </div>
                    
                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{ 
                                background: `linear-gradient(90deg, ${brandColor}40, ${brandColor})`,
                                boxShadow: `0 0 10px ${brandColor}40`
                            }}
                        />
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <div className="text-[7px] font-mono text-slate-600 uppercase tracking-widest border border-white/5 px-2 py-1 rounded-md bg-white/[0.01]">
                        Hash: {Math.random().toString(36).substring(7).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 rounded-br-2xl" />
        </motion.div>
    );
};

export default SkillScanCard;
