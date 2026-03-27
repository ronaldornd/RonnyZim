"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { isEarthMoon, getAstralLabel } from '@/lib/astral';

export type BiorhythmPhase = 'peak' | 'creative' | 'maintenance';

export interface BiorhythmResult {
    phase: BiorhythmPhase;
    phaseName: string;
    recommendedStack: string[];
    astroModifier: string | null;
    glowColor: string;
    currentTime: string;
}

const PEAK_STACKS = ['backend', 'sql', 'algorithms', 'nodejs', 'node.js', 'python', 'postgresql', 'supabase', 'database'];
const CREATIVE_STACKS = ['frontend', 'ui/ux', 'react', 'tailwind', 'nextjs', 'next.js', 'typescript', 'javascript', 'figma'];
const MAINTENANCE_STACKS = ['refactoring', 'documentation', 'reading', 'rest', 'clean code', 'linting', 'tests'];

export function useBiorhythm(userId?: string) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [astroState, setAstroState] = useState<{ moonSign: string | null; mercuryRetrograde: boolean }>({
        moonSign: null,
        mercuryRetrograde: false
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Atualiza a cada minuto
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function fetchAstroFacts() {
            if (!userId) return;
            const supabase = createClient();
            const { data: facts } = await supabase
                .from('user_facts')
                .select('property_key, value')
                .eq('user_id', userId)
                .in('property_key', ['moon_sign', 'mercury_retrograde']);

            if (facts) {
                const state = { moonSign: null as string | null, mercuryRetrograde: false };
                facts.forEach(f => {
                    if (f.property_key === 'moon_sign') state.moonSign = f.value;
                    if (f.property_key === 'mercury_retrograde') state.mercuryRetrograde = f.value === 'true';
                });
                setAstroState(state);
            }
        }
        fetchAstroFacts();
    }, [userId]);

    const result = useMemo((): BiorhythmResult => {
        const hours = currentTime.getHours();
        let phase: BiorhythmPhase = 'maintenance';
        let phaseName = 'Manutenção & Descanso';
        let recommendedStack = MAINTENANCE_STACKS;
        let glowColor = 'shadow-blue-500/20 border-blue-500/30 text-blue-400';

        if (hours >= 6 && hours < 13) {
            phase = 'peak';
            phaseName = 'Peak Logic (Foco Total)';
            recommendedStack = PEAK_STACKS;
            glowColor = 'shadow-emerald-500/20 border-emerald-500/30 text-emerald-400';
        } else if (hours >= 13 && hours < 19) {
            phase = 'creative';
            phaseName = 'Creative Flow (Interface)';
            recommendedStack = CREATIVE_STACKS;
            glowColor = 'shadow-purple-500/20 border-purple-500/30 text-purple-400';
        }

        // Modificadores Astrais
        let astroModifier = null;
        if (astroState.moonSign && isEarthMoon(astroState.moonSign)) {
            astroModifier = `Lua em ${astroState.moonSign}: +Foco Analítico`;
        } else if (astroState.mercuryRetrograde) {
            astroModifier = 'Mercúrio Retrógrado: Cuidado com revisões';
        }

        return {
            phase,
            phaseName,
            recommendedStack,
            astroModifier,
            glowColor,
            currentTime: currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
    }, [currentTime, astroState]);

    return result;
}
