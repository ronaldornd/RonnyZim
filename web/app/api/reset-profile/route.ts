import { createRouteHandlerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = user.id;

  // 1) Limpeza de Fatos (Calibração)
  await supabase.from('user_facts').delete().eq('user_id', userId);
  
  // 2) Limpeza de Mastery (RPG)
  await supabase.from('user_stack_mastery').delete().eq('user_id', userId);
  
  // 3) Reset de Perfil
  await supabase.from('profiles').update({
    level: 'ZIM_NOVICE',
    stats: {},
    tech_stack: [],
    identity_matrix: {}
  }).eq('id', userId);

  return NextResponse.json({ 
    success: true, 
    message: "Reset Global concluído com sucesso. Redirecionando para calibração Genesis...",
    userId 
  });
}
