-- Fix Supabase Security Warnings
-- Run these in Supabase SQL Editor

-- 1. Fix RLS Policy for public.analytics (currently too permissive)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all analytics operations" ON public.analytics;

-- Create more restrictive policies
-- Only authenticated users can insert their own analytics
CREATE POLICY "Users can insert their own analytics"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only service role can read analytics (for admin dashboard)
CREATE POLICY "Service role can read all analytics"
ON public.analytics
FOR SELECT
TO service_role
USING (true);

-- Owners can read their own analytics
CREATE POLICY "Users can read own analytics"
ON public.analytics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Enable leaked password protection for Auth
-- This should be enabled in Supabase Dashboard:
-- Authentication → Settings → Security → Leaked Password Protection

-- 3. Make sure RLS is enabled on all tables
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_history ENABLE ROW LEVEL SECURITY;

-- 4. Fix user_settings policies if needed
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own settings"
ON public.user_settings
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 5. Fix generated_history policies
DROP POLICY IF EXISTS "Users can view own history" ON public.generated_history;

CREATE POLICY "Users can view own history"
ON public.generated_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own history"
ON public.generated_history
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 6. Service role access for cron jobs
CREATE POLICY "Service role full access to user_settings"
ON public.user_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to generated_history"
ON public.generated_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify RLS is working
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('analytics', 'user_settings', 'generated_history');
