import { normalizeSkill } from './lib/utils/skill-normalizer';

const testCases = [
    'JavaScript (ES6+)',
    'JS',
    'javascript',
    'ECMAScript 2020',
    'ReactJS',
    'react.js',
    'Node',
    'node.js',
    'TS',
    'TypeScript',
    'Tailwind',
    'Postgres'
];

console.log('--- Iniciando Teste de Normalização ---');
testCases.forEach(tc => {
    console.log(`Original: "${tc}" -> Normalizado: "${normalizeSkill(tc)}"`);
});
console.log('--- Teste Concluído ---');
