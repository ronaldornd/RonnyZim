"use server";

import { createRouteHandlerClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

export interface UserStack {
    id: string;
    current_xp: number;
    current_level: number;
    global_stacks: {
        name: string;
        category: string;
        icon_slug: string;
    };
}

export interface UserFacts {
    display_name: string;
    profile_title: string;
    birth_date: string;
    birth_time: string;
    birth_city: string;
}

export interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    target_stack: string;
    status: string;
    completed: boolean;
    type?: string;
    stack_name?: string;
    stack_id?: string;
}

export async function getProfileData(userId: string) {
    const supabase = await createRouteHandlerClient();

    // 1. Fetch Stacks
    const { data: stacks, error: stacksError } = await supabase
        .from('user_stack_mastery')
        .select(`
            id,
            current_xp,
            current_level,
            global_stacks (
                name,
                category,
                icon_slug
            )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

    if (stacksError) console.error("Error fetching stacks:", stacksError);

    // 2. Fetch Profile Facts
    const { data: factsData, error: factsError } = await supabase
        .from('user_facts')
        .select('property_key, value')
        .eq('user_id', userId)
        .in('property_key', [
            'display_name', 
            'full_name', 
            'profile_title', 
            'birth_date', 
            'birth_time', 
            'birth_city'
        ]);

    const facts: Partial<UserFacts> = {};
    if (factsData) {
        factsData.forEach(f => {
            if (f.property_key === 'full_name' && !facts.display_name) {
                facts.display_name = f.value;
            } else {
                // @ts-ignore
                facts[f.property_key] = f.value;
            }
        });
    }

    // 3. Fetch Quests
    const { data: quests, error: questsError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        stacks: (stacks || []) as unknown as UserStack[],
        facts: facts as UserFacts,
        quests: (quests || []).map(q => ({ ...q, completed: q.status === 'completed' })) as DailyQuest[]
    };
}

export async function updateUserXP(userId: string, stackId: string, xpDelta: number) {
    const supabase = await createRouteHandlerClient();

    // 1. Get current state
    const { data: current, error: fetchError } = await supabase
        .from('user_stack_mastery')
        .select('current_xp, current_level')
        .eq('id', stackId)
        .single();
    
    if (fetchError || !current) throw new Error("Failed to fetch current stack state");

    let newXp = current.current_xp + xpDelta;
    let newLevel = current.current_level;

    // RPG Logic: Level Up every 100 * level XP
    const xpThreshold = newLevel * 100;
    while (newXp >= xpThreshold) {
        newXp -= xpThreshold;
        newLevel += 1;
    }

    const { error: updateError } = await supabase
        .from('user_stack_mastery')
        .update({
            current_xp: newXp,
            current_level: newLevel
        })
        .eq('id', stackId);

    if (updateError) throw new Error(updateError.message);

    // Dynamic Revalidation
    revalidateTag(`profile-${userId}`, 'max');
    
    return { newXp, newLevel };
}

export async function completeQuestAction(userId: string, questId: string, stackId: string, xpReward: number) {
    const supabase = await createRouteHandlerClient();

    // 1. Mark quest as completed
    const { error: questError } = await supabase
        .from('daily_quests')
        .update({ status: 'completed' })
        .eq('id', questId);
    
    if (questError) throw new Error("Failed to update quest status");

    // 2. Update XP
    const result = await updateUserXP(userId, stackId, xpReward);

    revalidateTag(`profile-${userId}`, 'max');
    
    return result;
}

export async function updateUserFactsAction(userId: string, updates: { category: string, property_key: string, value: string }[]) {
    const supabase = await createRouteHandlerClient();

    const formattedUpdates = updates.map(u => ({
        user_id: userId,
        ...u
    }));

    const { error } = await supabase
        .from('user_facts')
        .upsert(formattedUpdates, { onConflict: 'user_id,property_key' });

    if (error) throw new Error(`Failed to update user facts: ${error.message}`);

    revalidateTag(`profile-${userId}`, 'max');
    return { success: true };
}

export async function deleteUserStackAction(userId: string, stackId: string) {
    const supabase = await createRouteHandlerClient();

    const { error } = await supabase
        .from('user_stack_mastery')
        .delete()
        .eq('id', stackId)
        .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete stack: ${error.message}`);

    revalidateTag(`profile-${userId}`, 'max');
    return { success: true };
}
