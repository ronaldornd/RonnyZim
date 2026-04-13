"use server";

import { createRouteHandlerClient } from "@/lib/supabase/server";

/**
 * AÇÃO: Busca de Dados Basais de Identidade (Matriz de Identidade)
 * Separado do hunter.ts para evitar conflitos de compilação no Next.js 16
 */
export async function getProfileDataAction(userId: string) {
  const supabase = await createRouteHandlerClient();
  
  // 1) Busca perfil básico (fallback p/ compatibilidade)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 2) Busca TODOS os fatos atômicos injetados no Genesis
  const { data: rawFacts } = await supabase
    .from('user_facts')
    .select('property_key, value, category')
    .eq('user_id', userId);

  // 3) Transformação da Matriz de Identidade (Formatação p/ Dashboard)
  const facts: Record<string, any> = {
    xp: 0,
    level: profile?.level || 'ZIM_NOVICE',
    stats: profile?.stats || {}
  };

  if (rawFacts) {
    rawFacts.forEach(f => {
      facts[f.property_key] = f.value;
    });
  }

  // 4) Busca maestria de stacks (RPG)
  const { data: mastery } = await supabase
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
    .eq('user_id', userId);

  // 5) Busca Missões Ativas (Aba JORNADA)
  const { data: activeQuests } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // 6) Busca Histórico Operacional (Missões Concluídas)
  const { data: completedQuests } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);

  // 7) Cálculo de Integridade (Completude)
  const requiredKeys = ['display_name', 'profile_title', 'birth_date', 'birth_time', 'birth_city', 'seniority', 'system_calibration_answer'];
  let filledCount = 0;
  rawFacts?.forEach(f => {
    if (requiredKeys.includes(f.property_key) && f.value) filledCount++;
  });
  const integrity = Math.round((filledCount / requiredKeys.length) * 100);

  return {
    stacks: mastery || [],
    facts: facts,
    quests: activeQuests || [],
    completedQuests: completedQuests || [],
    telemetry: {
      integrity: parseInt(facts.telemetry_integrity) || integrity,
      sync: parseInt(facts.telemetry_sync) || 85,
      bioSummary: facts.telemetry_biosummary || `Operador de nível ${facts.level} em fase de calibração.`
    },
    isCalibrated: facts['system_calibration_answer'] === 'completed'
  };
}
