"use client";

import { useCallback } from 'react';

/**
 * useCyberSFX - Hook esqueleto para efeitos sonoros e visuais (GSD v4.0)
 * Os arquivos de áudio não existem no repositório ainda.
 * Este hook fornece as assinaturas para que a UI possa disparar eventos 
 * que serão sonorizados futuramente.
 */

export const SFX_PATH = {
    GLITCH_ERROR: null, // path sugerido: '/assets/sfx/glitch_error.mp3'
    XP_GAINED: null,   // path sugerido: '/assets/sfx/xp_up.mp3'
    UPLINK_START: null, // path sugerido: '/assets/sfx/uplink.mp3'
    UI_CLICK: null,    // path sugerido: '/assets/sfx/click.mp3'
};

export function useCyberSFX() {
    const playSFX = useCallback((key: keyof typeof SFX_PATH) => {
        const path = SFX_PATH[key];
        if (!path) {
            // Silencioso por enquanto, mas log para debug em ambiente dev
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SFX SKELETON] Triggered ${key} (No asset found)`);
            }
            return;
        }

        try {
            const audio = new Audio(path);
            audio.volume = 0.5;
            audio.play().catch(() => {
                /* Ignorar erros de autoplay ou assets faltando */
            });
        } catch (e) {
            console.warn(`[SFX ERROR] Failed to play ${key}:`, e);
        }
    }, []);

    const triggerGlitchVisual = useCallback(() => {
        // Esta função apenas retorna true para que o componente saiba que deve aplicar o efeito
        // A lógica real de timing reside nos estados locais dos componentes
        return true;
    }, []);

    return { playSFX, triggerGlitchVisual };
}
