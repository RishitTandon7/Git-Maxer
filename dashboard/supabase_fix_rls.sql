-- GitMaxer Database Setup - Complete RLS Policies
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING POLICIES (Clean slate)
-- ============================================
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Service role has full access" ON user_settings;

-- ============================================
-- 2. ENSURE RLS IS ENABLED
-- ============================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE NEW POLICIES
-- ============================================

-- Policy 1: Users can SELECT their own settings
CREATE POLICY "Users can read own settings"
ON user_settings
FOR SELECT
USING (
  auth.uid() = id
);

-- Policy 2: Users can UPDATE their own settings
CREATE POLICY "Users can update own settings"
ON user_settings
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Policy 3: Users can INSERT their own settings (for first-time setup)
CREATE POLICY "Users can insert own settings"
ON user_settings
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- Policy 4: Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access"
ON user_settings
FOR ALL
USING (
  auth.jwt()->>'role' = 'service_role'
);

-- ============================================
-- 4. VERIFY POLICIES
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_settings';

-- ============================================
-- 5. CHECK IF YOU HAVE A RECORD
-- ============================================
-- This will show if your user settings record exists
-- Replace 'YOUR_USER_ID' with your actual auth.users.id
SELECT * FROM user_settings WHERE id = 'b25c9d40-4245-45b4-b39a-...'; -- Use your actual ID

-- If no record exists, you'll need to create one via the setup page
