import { Type } from '@google/genai';
import { createAdminClient } from '../supabase/admin';

export const declareKnowledgeGapFunctionDeclaration = {
    name: 'declare_knowledge_gap',
    description: 'When you lack crucial context or facts to answer a users prompt accurately (e.g., you do not know their seniority, salary, or current tech stack), CALL THIS TOOL to ask the user. DO NOT GUESS.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            category: {
                type: Type.STRING,
                description: 'The category of this fact. E.g., career, emotional, habits, preference, identity, stack.',
            },
            question_to_user: {
                type: Type.STRING,
                description: 'The direct question to the user asking for the missing fact, in your persona tone.',
            },
            importance: {
                type: Type.STRING,
                description: 'High or medium priority flag.',
            },
        },
        required: ['category', 'question_to_user', 'importance'],
    },
};

export const createDailyQuestFunctionDeclaration = {
    name: 'create_daily_quest',
    description: 'Generates a new daily quest/challenge for the user based on their skills or learning goals. Call this whenever the user asks for a challenge, study plan, or quest. Provide realistic XP rewards based on difficulty (e.g., 50 for easy, 100 for medium, 200 for hard).',
    parameters: {
        type: Type.OBJECT,
        required: ['title', 'description', 'target_stack', 'xp_reward'],
        properties: {
            title: {
                type: Type.STRING,
                description: 'A catchy, game-like title for the quest (e.g., "Refatoração Profunda", "Mestre do Hook").'
            },
            description: {
                type: Type.STRING,
                description: 'Detailed instructions on what the user needs to build or analyze to complete the quest.'
            },
            target_stack: {
                type: Type.STRING,
                description: 'The specific technology stack this quest trains (e.g., React, Node.js, TypeScript, PostgreSQL).'
            },
            xp_reward: {
                type: Type.NUMBER,
                description: 'The amount of XP the user will earn upon completing this quest.'
            }
        }
    }
};

// Callback helper (to be explicitly called by the client upon user answering the modal/API)
export async function saveUserFact(
    userId: string,
    agentId: string,
    factKey: string,
    factValue: string
) {
    const supabase = createAdminClient();

    const { error } = await supabase.from('user_facts').upsert({
        user_id: userId,
        property_key: factKey,
        value: factValue,
        category: 'calibrated_learning' // A default ou pode vir dos args se preferir, a active learning passava vazio antes, mas a imagem requer. 
    }, { onConflict: 'user_id,property_key' });

    if (error) {
        console.error('[Active Learning] Failed to save user fact: ', error);
        throw new Error('Could not persist knowledge gap resolution.');
    }

    return { success: true };
}
