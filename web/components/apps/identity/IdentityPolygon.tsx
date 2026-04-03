"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface IdentityPolygonProps {
    className?: string;
    level?: number;
    xp?: number;
}

export default function IdentityPolygon({ className, level = 1, xp = 0 }: IdentityPolygonProps) {
    // Gerar pontos de um polígono regular (Hexágono para o núcleo)
    const points = useMemo(() => {
        const sides = 6;
        const radius = 80;
        const pts = [];
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const x = 100 + radius * Math.cos(angle);
            const y = 100 + radius * Math.sin(angle);
            pts.push(`${x},${y}`);
        }
        return pts.join(" ");
    }, []);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                {/* Defs para Gradients e Filters */}
                <defs>
                    <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
                    </linearGradient>
                </defs>

                {/* Camada 1: Círculo de Dados Externo (Rotação Lenta) */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="95"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.1)"
                    strokeWidth="0.5"
                    strokeDasharray="4 8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                />

                {/* Camada 2: Anel de Coordenadas (Fragmentado) */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="88"
                    fill="none"
                    stroke="rgba(34, 211, 238, 0.4)"
                    strokeWidth="1"
                    strokeDasharray="20 160"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />

                {/* Camada 3: O Polígono Principal (Pulsante e Rotativo) */}
                <motion.g
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ 
                        scale: [0.95, 1.05, 0.95],
                        opacity: [0.6, 0.9, 0.6],
                        rotate: 360 
                    }}
                    transition={{ 
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 120, repeat: Infinity, ease: "linear" }
                    }}
                    style={{ transformOrigin: 'center' }}
                >
                    {/* Wireframe do Polígono */}
                    <polygon
                        points={points}
                        fill="rgba(34, 211, 238, 0.05)"
                        stroke="url(#cyanGrad)"
                        strokeWidth="1.5"
                        filter="url(#neonBlur)"
                        className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    />
                    
                    {/* Nodes de Vértice */}
                    {points.split(" ").map((pt, i) => {
                        const [x, y] = pt.split(",");
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2"
                                fill="#22d3ee"
                                className="drop-shadow-[0_0_5px_#22d3ee]"
                            />
                        );
                    })}
                </motion.g>

                {/* Camada 4: Núcleo (Core) */}
                <motion.circle
                    cx="100"
                    cy="100"
                    r="5"
                    fill="#22d3ee"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="drop-shadow-[0_0_15px_#22d3ee]"
                />

                {/* Labels de Dados (Fixo ou Rotação Diferente) */}
                <g className="font-mono text-[6px] fill-cyan-500/60 transition-opacity duration-300">
                    <text x="105" y="40">[NATAL_CHART: ACTIVE]</text>
                    <text x="30" y="100" transform="rotate(-90 30 100)">0x{level.toString(16).padStart(4, '0')}</text>
                    <text x="140" y="160">CORE_SYNC: {xp}%</text>
                </g>
            </svg>

            {/* Efeito de Glitch Overlay (Simulado com Divs) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <motion.div 
                    className="w-full h-px bg-cyan-400"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>
        </div>
    );
}
