"use server";

import { createRouteHandlerClient } from "@/lib/supabase/server";

/**
 * AÇÃO: Busca de Dados Basais de Identidade (Matriz de Identidade)
 * Separado do hunter.ts para evitar conflitos de compilação no Next.js 16
 */
export async function getProfileDataAction(userId: string) {
  const supabase = await createRouteHandlerClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return {
    stacks: profile?.tech_stack || [],
    facts: profile?.identity_matrix || { xp: 0, level: profile?.level || 'ZIM_NOVICE', stats: profile?.stats || {} },
    quests: []
  };
}
