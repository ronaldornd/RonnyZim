-- Create the explicit schema for Hunter Insights CRM

CREATE TABLE IF NOT EXISTS public.hunter_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    summary TEXT,
    key_points JSONB,
    status TEXT NOT NULL DEFAULT 'Evaluating' CHECK (status IN ('Evaluating', 'Applied', 'Rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.hunter_insights ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own rows
CREATE POLICY "Users can view their own hunter insights"
ON public.hunter_insights FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT their own rows
CREATE POLICY "Users can insert their own hunter insights"
ON public.hunter_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own rows
CREATE POLICY "Users can update their own hunter insights"
ON public.hunter_insights FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own rows
CREATE POLICY "Users can delete their own hunter insights"
ON public.hunter_insights FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Create an index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_hunter_insights_user_id ON public.hunter_insights(user_id);
