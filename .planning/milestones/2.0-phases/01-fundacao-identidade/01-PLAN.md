# Phase 1: Fundação & Identidade - Implementation Plan

<task effort="Max">
  <name>Setup do Cliente Supabase SSR e Middleware de Sessão</name>
  <files>
    - web/lib/supabase/server.ts [NEW]
    - web/lib/supabase/client.ts [NEW]
    - web/lib/supabase/middleware.ts [NEW]
    - web/middleware.ts [MODIFY]
  </files>
  <action>
    1. Implementar `createServerClient` em `lib/supabase/server.ts` usando cookies do Next.js 16/React 19.
    2. Implementar `createBrowserClient` em `lib/supabase/client.ts` para componentes client-side.
    3. Criar `updateSession` em `lib/supabase/middleware.ts` para refrescar tokens JWT automaticamente.
    4. Atualizar o `middleware.ts` na raiz do `/web` para invocar `updateSession` em todas as rotas relevantes.
  </action>
  <verify>
    - Verificar se o cookie `sb-access-token` é setado após login.
    - Testar acesso a rotas protegidas usando `supabase.auth.getUser()` no servidor.
  </verify>
  <done>
    - [ ] Cliente Server-side funcional com suporte a cookies.
    - [ ] Middleware atualizando sessão sem loops de redirecionamento.
  </done>
</task>

<task effort="Max">
  <name>Criação e Aplicação do Schema SQL (Supabase Migrations)</name>
  <files>
    - supabase/migrations/20260330000000_initial_schema.sql [NEW]
  </files>
  <action>
    1. Executar `supabase migration new initial_schema` via CLI.
    2. Adicionar o DDL para as tabelas:
       - `profiles` (primary key UUID de auth.users, natal_chart JSONB).
       - `jobs` (UUID v4, profile_id FK, status enum).
       - `dossiers` (job_id FK CASCADE, analysis JSONB).
       - `quests` (profile_id FK, reward_xp).
       - `user_facts` (profile_id FK, memory content).
    3. Aplicar via `supabase db push` ou `supabase migration up`.
  </action>
  <verify>
    - Rodar `supabase db lint`.
    - Verificar existência das tabelas via `psql` ou Supabase Studio local.
  </verify>
  <done>
    - [ ] Todas as tabelas criadas com UUID v4 como Primary Key.
    - [ ] Relacionamentos de Foreign Key configurados com `ON DELETE CASCADE`.
  </done>
</task>

<task effort="Max">
  <name>Configuração Estrita de Row Level Security (RLS)</name>
  <files>
    - supabase/migrations/20260330000001_rls_policies.sql [NEW]
  </files>
  <action>
    1. Habilitar RLS em todas as tabelas: `ALTER TABLE public.X ENABLE ROW LEVEL SECURITY;`.
    2. Aplicar política `auth.uid() = id` na tabela `profiles`.
    3. Aplicar política `auth.uid() = profile_id` nas tabelas `jobs`, `quests` e `user_facts`.
    4. Aplicar política de acesso a `dossiers` baseada na propriedade do `job_id` relacionado.
  </action>
  <verify>
    - Tentar realizar SELECT anônimo via `supabase-js` (deve retornar vazio/erro).
    - Tentar realizar SELECT autenticado (deve retornar apenas dados do próprio usuário).
  </verify>
  <done>
    - [ ] 100% de cobertura RLS nas tabelas públicas.
    - [ ] Acesso anônimo totalmente bloqueado no nível de banco de dados.
  </done>
</task>

<task effort="Max">
  <name>Integração do LockScreen com Fluxo de Autenticação</name>
  <files>
    - web/components/auth/LockScreen.tsx [MODIFY]
  </files>
  <action>
    1. Importar `createBrowserClient` no componente de UI.
    2. Substituir logs de console ou alertas por chamadas reais a `supabase.auth.signInWithPassword`.
    3. Implementar lógica de redirecionamento para o dashboard após sucesso na autenticação.
  </action>
  <verify>
    - Testar fluxo de ponta a ponta: Credenciais -> Login -> Redirecionamento Dashboard.
  </verify>
  <done>
    - [ ] UI de LockScreen disparando autenticação SSR real.
  </done>
</task>
