/**
 * astral.ts — Shared Astrological Buff/Debuff Logic
 * Used by NeuralGraph (frontend) and validate/route.ts (backend).
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const EARTH_SIGNS = ['taurus', 'virgo', 'capricorn'];

// Technical Categories Mapping
export const STACK_CATEGORIES: Record<string, string[]> = {
    frontend: ['react', 'nextjs', 'next.js', 'typescript', 'javascript', 'tailwind', 'css', 'html'],
    backend: ['nodejs', 'node.js', 'python', 'go', 'rust', 'api', 'express', 'nest'],
    database: ['sql', 'postgresql', 'supabase', 'database', 'prisma', 'mongodb', 'redis'],
    devops: ['docker', 'kubernetes', 'aws', 'vercel', 'github-actions', 'deploy', 'linux'],
    design: ['figma', 'framer', 'ui', 'ux', 'animation', 'storyboard'],
};

// Legacy static lists for backward compatibility in simple checks
export const BACKEND_STACKS = STACK_CATEGORIES.backend.concat(STACK_CATEGORIES.database);
export const FRONTEND_STACKS = STACK_CATEGORIES.frontend;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AstralResonance = 'buff' | 'debuff' | 'focus' | null;

export interface AstroTechnicalFocus {
    frontend: number;
    backend: number;
    database: number;
    devops: number;
    design: number;
}

export interface AstralState {
    moonSign: string | null;
    mercuryRetrograde: boolean;
    technicalFocus: AstroTechnicalFocus | null;
}

export interface AstralXpResult {
    multiplier: number;
    message: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EARTH_SIGN_NAMES: Record<string, string> = {
    taurus: 'Touro',
    virgo: 'Virgem',
    capricorn: 'Capricórnio',
};

export function isEarthMoon(moonSign: string | null): boolean {
    if (!moonSign) return false;
    return EARTH_SIGNS.includes(moonSign.toLowerCase().trim());
}

/**
 * Maps a stack slug to its primary category.
 */
export function getStackCategory(stackSlug: string): keyof AstroTechnicalFocus | null {
    const slug = stackSlug.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(STACK_CATEGORIES)) {
        if (keywords.some(k => slug.includes(k))) return category as keyof AstroTechnicalFocus;
    }
    return null;
}

/**
 * Returns the astral resonance type/multiplier.
 */
export function getAstralResonanceForStack(
    stackSlug: string,
    state: AstralState,
): { resonance: AstralResonance; multiplier: number } {
    const slug = stackSlug.toLowerCase().trim();
    const category = getStackCategory(slug);
    
    let multiplier = 1.0;
    let resonance: AstralResonance = null;

    // 1. Dynamic Focus from AstroDash (Priority)
    if (state.technicalFocus && category && state.technicalFocus[category]) {
        multiplier = state.technicalFocus[category];
        if (multiplier > 1.0) resonance = 'buff';
        if (multiplier < 1.0) resonance = 'debuff';
    }

    // 2. Static Moon/Mercury Overrides/Additions
    if (isEarthMoon(state.moonSign) && (category === 'backend' || category === 'database')) {
        // Only apply if not already buffed or to boost it
        multiplier = Math.max(multiplier, 1.2);
        resonance = 'buff';
    }

    if (state.mercuryRetrograde && category === 'frontend') {
        multiplier = Math.min(multiplier, 0.85);
        resonance = 'debuff';
    }

    return { resonance, multiplier };
}

/**
 * Final XP Multiplier for Backend.
 */
export function getAstralXpMultiplier(
    stackName: string,
    state: AstralState,
): AstralXpResult {
    const { resonance, multiplier } = getAstralResonanceForStack(stackName, state);

    if (multiplier > 1.0) {
        return {
            multiplier,
            message: resonance === 'buff' 
                ? `✨ Afinidade Astral: Seu foco em ${stackName} está amplificado pelo cosmos. +${Math.round((multiplier - 1) * 100)}% XP.`
                : `✦ Ressonância: Sincronia técnica detectada em ${stackName}. Multiplicador ${multiplier}x.`,
        };
    }

    return { multiplier, message: null };
}

/**
 * Human-readable label for the Side Panel.
 */
export function getAstralLabel(
    stackSlug: string,
    state: AstralState,
): { resonance: AstralResonance; label: string; sublabel: string; multiplier: number } | null {
    const { resonance, multiplier } = getAstralResonanceForStack(stackSlug, state);
    if (!resonance && multiplier === 1.0) return null;

    const category = getStackCategory(stackSlug);
    const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Stack';

    if (multiplier > 1.0) {
        return {
            resonance,
            multiplier,
            label: `✨ Foco em ${categoryName}`,
            sublabel: `Alta afinidade astrológica hoje (${multiplier}x XP)`,
        };
    }

    if (multiplier < 1.0) {
        return {
            resonance,
            multiplier,
            label: `⚠️ Desafio em ${categoryName}`,
            sublabel: `Execute com cautela dobrada hoje`,
        };
    }

    return null;
}
