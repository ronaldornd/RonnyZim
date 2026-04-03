'use client';

import { useState, useCallback, useRef } from 'react';

type SFXType = 'UPLINK_SUCCESS' | 'UPLINK_ERROR' | 'GLITCH_ACTIVE' | 'COOLDOWN_START' | 'TAB_SWITCH';

/**
 * useCyberSFX - Cyber-Mystic Sound & Visual Effect Orchestrator
 * Versão Esqueleto (2026 Ready)
 * 
 * TODO: Integrar Howler.js ou Buffer-API quando os assets .mp3 forem entregues.
 */
export function useCyberSFX() {
    const [lastTrigger, setLastTrigger] = useState<SFXType | null>(null);
    const audioRefs = useRef<Record<SFXType, string | null>>({
        UPLINK_SUCCESS: null,
        UPLINK_ERROR: null,
        GLITCH_ACTIVE: null,
        COOLDOWN_START: null,
        TAB_SWITCH: null
    });

    const triggerSFX = useCallback((type: SFXType) => {
        // Log sutil no console para depuração de triggers sem áudio
        console.log(`[SFX TRIGGER]: ${type} at ${Date.now()}`);
        
        setLastTrigger(type);
        
        // Reset do trigger para permitir repetições
        setTimeout(() => setLastTrigger(null), 100);

        // Simulador de Audio (Placeholder)
        // No futuro: const sound = new Audio(audioRefs.current[type]); sound.play();
    }, []);

    const playError = useCallback(() => triggerSFX('UPLINK_ERROR'), [triggerSFX]);
    const playSuccess = useCallback(() => triggerSFX('UPLINK_SUCCESS'), [triggerSFX]);
    const playGlitch = useCallback(() => triggerSFX('GLITCH_ACTIVE'), [triggerSFX]);

    return {
        triggerSFX,
        playError,
        playSuccess,
        playGlitch,
        lastTrigger,
        isAudioEnabled: false // Em 2026, respeitamos o estado de memória cognitiva
    };
}
