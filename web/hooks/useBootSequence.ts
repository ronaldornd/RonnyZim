'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useBootSequence - Hooks para gerenciar o estado de inicialização/onboarding.
 * Persiste no localStorage para ser exibido APENAS na primeira vez.
 */
export function useBootSequence() {
    const [isBootComplete, setIsBootComplete] = useState<boolean | null>(null); 
    const [isMounted, setIsMounted] = useState(false);

    const completeBoot = useCallback(() => {
        setIsBootComplete(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem('ronnyzim_onboarding_done', 'true');
        }
    }, []);

    const resetBoot = useCallback(() => {
        setIsBootComplete(false);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ronnyzim_onboarding_done');
            window.location.reload(); // Recarregar para ver o boot novamente
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const hasCompleted = localStorage.getItem('ronnyzim_onboarding_done');
            if (hasCompleted === 'true') {
                setIsBootComplete(true);
            } else {
                setIsBootComplete(false);
            }
        }
    }, []);

    useEffect(() => {
        if (isBootComplete) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Escape') {
                e.preventDefault();
                completeBoot();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBootComplete, completeBoot]);

    // Prevenção de Hydration Mismatch
    if (!isMounted) return { isBootComplete: true, completeBoot, resetBoot };

    return { isBootComplete, completeBoot, resetBoot };
}
