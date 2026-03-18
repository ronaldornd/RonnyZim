-- Migration: The Matrix Daily Quests Setup
-- Objective: Create the gamification engine tables and seed initial quests.

-- 1. Create the `daily_quests` table
CREATE TABLE IF NOT EXISTS public.daily_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_stack TEXT NOT NULL, -- e.g., 'React', 'Node'
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 50 NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Configure RLS (Row Level Security)
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own quests
CREATE POLICY "Users can view their own daily quests"
ON public.daily_quests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only update their own quests (to mark as Completed)
CREATE POLICY "Users can update their own daily quests"
ON public.daily_quests
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Allow service role / admin to insert quests
CREATE POLICY "Service Role can insert daily quests"
ON public.daily_quests
FOR INSERT
WITH CHECK (true);

-- 3. Trigger/Seed Function for new users (Optional but helpful for testing)
/* 
To test this in your current workspace, you can manually insert some quests for your user ID 
by replacing 'YOUR_USER_ID' beneath and running the insert:

INSERT INTO public.daily_quests (user_id, target_stack, title, description, xp_reward)
VALUES 
    ('YOUR_USER_ID', 'React', 'Refactor a class component to use Hooks', 'Modernize the codebase to increase performance.', 50),
    ('YOUR_USER_ID', 'Node', 'Implement rate limiting on an API route', 'Protect the backend from abuse.', 75),
    ('YOUR_USER_ID', 'TypeScript', 'Add strict typing to an implicitly any file', 'Improve the type safety of the Identity module.', 40);
*/
