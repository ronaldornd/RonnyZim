'use client';

import { motion } from 'framer-motion';

interface StreamingFallbackProps {
    label?: string;
}

export function StreamingFallback({ label = "DECRYPTING DATA..." }: StreamingFallbackProps) {
    return (
        <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Grid Sutil */}
            <div className="absolute inset-0 opacity-10" 
                style={{ 
                    backgroundImage: `linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }} 
            />

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Animacao Central de Pulso */}
                <div className="relative">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                            rotate: [0, 90, 180, 270, 360]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                        className="w-16 h-16 rounded-2xl border-2 border-cyan-500/20 flex items-center justify-center relative backdrop-blur-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                    </motion.div>
                    
                    {/* Ring Externo */}
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0, 0.2, 0]
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="absolute inset-0 rounded-full border border-cyan-400/30"
                    />
                </div>

                {/* Texto Futurista */}
                <div className="flex flex-col items-center gap-1">
                    <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase italic"
                    >
                        {label}
                    </motion.span>
                    
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [4, 12, 4] }}
                                transition={{ 
                                    duration: 0.8, 
                                    repeat: Infinity, 
                                    delay: i * 0.2 
                                }}
                                className="w-1 bg-cyan-500/30 rounded-full"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Scanline Effect */}
            <motion.div 
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 h-20 bg-gradient-to-bottom from-transparent via-cyan-500/5 to-transparent pointer-events-none"
            />
        </div>
    );
}
