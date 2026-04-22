/**
 * Normaliza nomes de tecnologias para evitar gaps falsos (ex: JS vs JavaScript ES6).
 */
export function normalizeSkill(skill: string): string {
    const s = skill.toLowerCase().trim();

    // JavaScript variations
    if (s.includes('javascript') || s === 'js' || s.includes('es6') || s.includes('es20') || s.includes('ecmascript')) {
        return 'JavaScript';
    }

    // TypeScript variations
    if (s === 'ts' || s === 'typescript') {
        return 'TypeScript';
    }

    // React variations
    if (s.includes('react') && !s.includes('native')) {
        return 'React';
    }

    // Node variations
    if (s.includes('node')) {
        return 'Node.js';
    }

    // CSS/Tailwind
    if (s.includes('tailwind')) {
        return 'Tailwind CSS';
    }

    // Database
    if (s === 'postgres' || s === 'postgresql') {
        return 'PostgreSQL';
    }
    
    if (s === 'mongo' || s === 'mongodb') {
        return 'MongoDB';
    }

    // Default: capitalized
    return skill.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Verifica se o usuário possui a habilidade base, ignorando versões.
 */
export function hasBaseSkill(userStacks: string[], targetSkill: string): boolean {
    const normalizedTarget = normalizeSkill(targetSkill);
    return userStacks.some(stack => normalizeSkill(stack) === normalizedTarget);
}
