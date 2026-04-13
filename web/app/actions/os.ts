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
    .eq('status', 'Active')
    .order('created_at', { ascending: false });

  // 6) Busca Histórico Operacional (Missões Concluídas)
  const { data: completedQuests } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'Completed')
    .order('created_at', { ascending: false })
    .limit(3);

  // 7) Cálculo de Integridade (Completude)
  const requiredKeys = ['display_name', 'profile_title', 'birth_date', 'birth_time', 'birth_city', 'seniority', 'system_calibration_answer'];
  let filledCount = 0;
  rawFacts?.forEach(f => {
    if (requiredKeys.includes(f.property_key) && f.value && String(f.value).trim() !== '') filledCount++;
  });
  
  // Integridade baseada no preenchimento do perfil (0-100)
  const integrity = Math.round((filledCount / requiredKeys.length) * 100);
  
  // Sincronia baseada no progresso das stacks (Exemplo: média dos níveis / 5 * 100, limitado a 100)
  const averageLevel = mastery && mastery.length > 0 
    ? mastery.reduce((acc, s) => acc + s.current_level, 0) / mastery.length 
    : 1;
  const sync = Math.min(100, Math.round((averageLevel / 10) * 100) + 20); // Baseline de 20% + evolução

  return {
    stacks: mastery || [],
    facts: facts,
    quests: (activeQuests || []).map(q => ({ ...q, completed: q.status === 'completed' })),
    completedQuests: (completedQuests || []).map(q => ({ ...q, completed: true })),
    telemetry: {
      integrity: Number(facts.telemetry_integrity) || integrity,
      sync: Number(facts.telemetry_sync) || sync,
      bioSummary: facts.telemetry_biosummary || `Operador de nível ${facts.level || 'ZIM'} em fase de calibração ativa.`
    },
    isCalibrated: facts['system_calibration_answer'] === 'completed'
  };
}
