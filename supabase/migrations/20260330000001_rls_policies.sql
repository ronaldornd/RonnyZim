-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_facts ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para Profiles
CREATE POLICY "Users can only view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can only update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Políticas para Jobs
CREATE POLICY "Users can only manage their own jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);

-- 4. Políticas para Quests
CREATE POLICY "Users can only manage their own quests" ON public.quests FOR ALL USING (auth.uid() = user_id);

-- 5. Políticas para User Facts
CREATE POLICY "Users can only manage their own facts" ON public.user_facts FOR ALL USING (auth.uid() = user_id);

-- 6. Políticas para Dossiers (Acesso via o dono do Job)
CREATE POLICY "Users can only view dossiers of their jobs" ON public.dossiers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE public.jobs.id = public.dossiers.job_id
    AND public.jobs.user_id = auth.uid()
  )
);

