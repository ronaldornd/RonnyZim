'use client';

import React from 'react';
import { motion } from 'framer-motion';

type IconType = 'nexus' | 'hunter' | 'matrix' | 'astro' | 'listening';

interface HolographicIconProps {
  type: IconType;
  color: string;
}

const draw: any = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = 1 + i * 0.5;
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: 'spring', duration: 1.5, bounce: 0 },
        opacity: { delay, duration: 0.01 }
      }
    };
  }
};

export const HolographicIcon: React.FC<HolographicIconProps> = ({ type, color }) => {
  return (
    <motion.div 
      className="relative w-48 h-48 flex items-center justify-center"
      initial="hidden"
      animate="visible"
    >
      {/* Glow Layer */}
      <div 
        className="absolute inset-0 blur-2xl opacity-20 rounded-full"
        style={{ backgroundColor: color }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {type === 'nexus' && (
          <>
            {/* Sextant Concept */}
            <motion.circle cx="50" cy="50" r="40" variants={draw} custom={0} strokeDasharray="2 2" />
            <motion.path d="M50 10 L50 90 M10 50 L90 50" variants={draw} custom={1} />
            <motion.path d="M50 50 L80 20 M50 50 L80 80" variants={draw} custom={2} />
            <motion.rect x="40" y="40" width="20" height="20" variants={draw} custom={3} />
            <motion.path 
              d="M30 30 L70 70 M70 30 L30 70" 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ originX: '50px', originY: '50px' }}
              className="opacity-50"
            />
          </>
        )}

        {type === 'hunter' && (
          <>
            {/* Tactical Crosshair */}
            <motion.circle cx="50" cy="50" r="35" variants={draw} custom={0} />
            <motion.circle cx="50" cy="50" r="5" variants={draw} custom={1} fill={color} fillOpacity="0.2" />
            <motion.path d="M50 5 L50 30 M50 70 L50 95 M5 50 L30 50 M70 50 L95 50" variants={draw} custom={2} strokeWidth="1" />
            <motion.path d="M35 35 L40 40 M60 60 L65 65 M60 35 L65 30 M35 65 L40 60" variants={draw} custom={3} />
            <motion.path 
               d="M50 50 L80 50" 
               animate={{ rotate: 360 }} 
               transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
               style={{ originX: '50px', originY: '50px' }}
               className="opacity-30"
               strokeWidth="0.2"
            />
          </>
        )}

        {type === 'matrix' && (
          <>
            {/* Integrated Circuit Grid */}
            <motion.rect x="30" y="30" width="40" height="40" variants={draw} custom={0} rx="2" />
            <motion.path d="M10 20 L30 30 M10 50 L30 50 M10 80 L30 70" variants={draw} custom={1} />
            <motion.path d="M90 20 L70 30 M90 50 L70 50 M90 80 L70 70" variants={draw} custom={2} />
            <motion.path d="M50 10 L50 30 M50 90 L50 70" variants={draw} custom={3} />
            <motion.circle cx="30" cy="30" r="2" fill={color} variants={draw} custom={4} />
            <motion.circle cx="70" cy="70" r="2" fill={color} variants={draw} custom={4} />
          </>
        )}

        {type === 'astro' && (
          <>
            {/* Energy Conductor / Star */}
            <motion.path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" variants={draw} custom={0} />
            <motion.circle cx="50" cy="50" r="10" variants={draw} custom={1} />
            <motion.circle cx="50" cy="50" r="45" strokeDasharray="1 10" variants={draw} custom={2} />
            <motion.path d="M20 20 L80 80 M80 20 L20 80" variants={draw} custom={3} strokeWidth="0.1" />
          </>
        )}

        {type === 'listening' && (
          <>
            {/* Waveform Analyzer */}
            <motion.path d="M10 50 Q 30 10, 50 50 T 90 50" variants={draw} custom={0} />
            <motion.path d="M10 50 Q 30 90, 50 50 T 90 50" variants={draw} custom={1} opacity="0.3" />
            <motion.rect x="20" y="60" width="4" height="20" variants={draw} custom={2} fill={color} fillOpacity="0.5" stroke="none" />
            <motion.rect x="30" y="40" width="4" height="40" variants={draw} custom={2} fill={color} fillOpacity="0.5" stroke="none" />
            <motion.rect x="40" y="70" width="4" height="10" variants={draw} custom={2} fill={color} fillOpacity="0.5" stroke="none" />
            <motion.rect x="50" y="30" width="4" height="50" variants={draw} custom={2} fill={color} fillOpacity="0.5" stroke="none" />
            <motion.rect x="60" y="55" width="4" height="25" variants={draw} custom={2} fill={color} fillOpacity="0.5" stroke="none" />
          </>
        )}
      </svg>
    </motion.div>
  );
};
