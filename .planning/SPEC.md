# Specification: RonnyZim OS - Backend Architecture (MVP)

> **Status**: FINALIZED
> **Data**: 2026-03-30
> **Responsável**: Solutions Architect (Antigravity)

## 1. Topologia de Conexão (MCP Servers)

O RonnyZim OS opera com dois servidores MCP locais que atuam como pontes entre o Oráculo (Gemini 1.5) e a infraestrutura de dados.

### A. MCP Memory Guardian (Supabase Proxy)
- **Responsabilidade**: Sincronização bidirecional de dados técnicos e pessoais do usuário.
- **Tools**:
    - `get_user_profile(id: UUID)`: Retorna dados de Biorritmo e Astro.
    - `save_fact(fact: string, category: string)`: Persiste memórias no `user_facts`.
    - `update_quest(quest_id: UUID, status: boolean)`: Gerencia o progresso de gamificação.
- **Transport**: `StdioServerTransport` vinculado ao processo do agente.

### B. MCP Market Intelligence (Tracker)
- **Responsabilidade**: Descoberta e extração de oportunidades de mercado em tempo real.
- **Provider**: **Tavily API** (AI-optimized search).
- **Tools**:
    - `search_jobs(query: string, location: string)`: Busca vagas via Tavily e retorna JSON estruturado.
    - `extract_dossier_data(url: string)`: Limpa o conteúdo da página para análise de IA.

## 2. Esquema Relacional (Supabase PostgreSQL)

Utilizamos **UUID v4** nativo para todas as chaves primárias e **RLS (Row Level Security)** para privacidade.

```sql
-- Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Extensão de auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  natal_chart JSONB, -- { birth_date, birth_time, birth_city }
  biorhythm_data JSONB,
  xp_total INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Jobs (HunterBoard)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT CHECK (status IN ('LEAD', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED')) DEFAULT 'LEAD',
  url TEXT,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Dossiers (TargetDossier)
CREATE TABLE public.dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  analysis JSONB, -- Resumo da IA, pontos de dor, habilidades requeridas
  insights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Quests (IdentityMatrix)
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  reward_xp INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE
);

-- 5. User Facts (Oracle Memory)
CREATE TABLE public.user_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT,
  fact TEXT NOT NULL,
  met_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### Políticas de RLS (Global)
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only manage their own jobs" ON public.jobs USING (auth.uid() = profile_id);

-- Repetir para Dossiers (via Job FK), Quests e User Facts.
```

## 3. Estratégia de Dados No-Scroll (Data Fetching)

Para cumprir o dogma visual de não permitir rolagem vertical, a arquitetura de dados deve suportar:

### A. Paginação por Cursor (Biológica)
- As requisições ao Supabase deverão incluir `limit` e `offset` (ou last_id) via URL Search Params.
- Exemplo: `/api/jobs?limit=10&page=1` para preencher o grid fixo do HunterBoard.

### B. Streaming de Insights
- Análises geradas pelo Oráculo (Dossiers) serão entregues via **Next.js Streaming Responsers** (Server Actions), permitindo que a UI renderize partes do dossiê conforme são processadas, mantendo a responsividade sem travar a interface.

### C. Revalidação sob Demanda
- Uso de `revalidateTag` e `revalidatePath` para garantir que o estado do banco e a UI "No-Scroll" estejam sempre em sincronia atômica.
