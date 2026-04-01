-- Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Extensão de auth.users)
-- Usando ALTER TABLE para adicionar colunas se a tabela já existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS natal_chart JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biorhythm_data JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;

-- 2. Jobs (HunterBoard)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT CHECK (status IN ('LEAD', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED')) DEFAULT 'LEAD',
  url TEXT,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Dossiers (TargetDossier)
CREATE TABLE IF NOT EXISTS public.dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  analysis JSONB,
  insights TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Quests (IdentityMatrix)
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  reward_xp INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE
);

-- 5. User Facts (Oracle Memory)
CREATE TABLE IF NOT EXISTS public.user_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT,
  fact TEXT NOT NULL,
  met_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

