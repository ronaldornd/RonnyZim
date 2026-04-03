"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface HolographicFallbackProps {
    message?: string;
}

export default function HolographicFallback({ message = "DECRYPTING NEURAL DATA..." }: HolographicFallbackProps) {
    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-[#050505] rounded-[2rem] border border-white/5 relative overflow-hidden group">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.03),transparent)] pointer-events-none" />
            
            {/* Pulsing Text */}
            <motion.div
                initial={{ opacity: 0.3, scale: 0.98 }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.98, 1, 0.98] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-4 z-10"
            >
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin mb-4" />
                
                <span className="text-[10px] font-black text-cyan-400/60 tracking-[0.4em] uppercase font-mono text-center px-4">
                    [ {message} ]
                </span>
                
                <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [4, 12, 4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-[2px] bg-cyan-500/30 rounded-full"
                        />
                    ))}
                </div>
            </motion.div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]" />
        </div>
    );
}
