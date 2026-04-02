'use client';

import { useCallback, useRef } from 'react';

type SFXType = 'click' | 'hover' | 'boot' | 'glitch';

export function useCyberSFX() {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playSFX = useCallback((type: SFXType) => {
    initAudio();
    if (!audioContext.current) return;

    // Resumir contexto se estiver suspenso (política do browser)
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'click':
        // Som minimalista: um "tic" rápido e suave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
        break;

      case 'hover':
        // Hover quase imperceptível, apenas um brilho sonoro
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
        break;

      case 'boot':
        // Glissando ascendente
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        break;

      case 'glitch':
        // Ruído branco curto
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.05, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start();
        break;
    }
  }, [initAudio]);

  return { playSFX };
}
