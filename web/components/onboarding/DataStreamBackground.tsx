'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const LOGS = [
  '> DECRYPTING IDENTITY MATRIX...',
  '> MOUNTING MEMORY GUARDIAN...',
  '> CALIBRATING ASTRO GAPS...',
  '> ESTABLISHING TAVILY UPLINK...',
  '> SCANNING FOR HUNTER TARGETS...',
  '> SYNCING NEURAL SYNC [OK]',
  '> OX62 0XF4 0XAZ 0X99 0X1B',
  '> OX7E 0X33 0X12 0X00 0XFF',
  '> PROTOCOL: NO-SCROLL [ACTIVE]',
  '> BYPASSING FIREWALL...',
  '> ENCRYPTING USER_FACTS...',
  '> CALIBRATING CODE-CLOCK...',
  '> VIBE CHECK: ANALYZING...',
];

const Stream = ({ delay, x }: { delay: number; x: string }) => {
  const items = useMemo(() => {
    return Array.from({ length: 15 }).map(() => LOGS[Math.floor(Math.random() * LOGS.length)]);
  }, []);

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: '100%' }}
      transition={{
        duration: 25 + Math.random() * 15,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
      className="absolute flex flex-col gap-8 pointer-events-none select-none opacity-[0.05]"
      style={{ left: x }}
    >
      {items.map((log, i) => (
        <span key={i} className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">
          {log}
        </span>
      ))}
    </motion.div>
  );
};

export const DataStreamBackground = React.memo(() => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
      <div className="absolute inset-0 opacity-20">
        <Stream x="5%" delay={0} />
        <Stream x="15%" delay={5} />
        <Stream x="30%" delay={2} />
        <Stream x="45%" delay={8} />
        <Stream x="60%" delay={3} />
        <Stream x="75%" delay={6} />
        <Stream x="90%" delay={1} />
      </div>
      {/* Efeito de vinheta para foco no centro */}
      <div 
        className="absolute inset-0 z-10" 
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, black 100%)'
        }}
      />
    </div>
  );
});

DataStreamBackground.displayName = 'DataStreamBackground';
