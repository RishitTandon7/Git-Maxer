-- Add leetcode_repo field to user_settings table
-- This stores the repo name for LeetCode plan users

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS leetcode_repo TEXT DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_leetcode_repo ON user_settings(leetcode_repo);

-- Comment explaining the column
COMMENT ON COLUMN user_settings.leetcode_repo IS 'Repository name for LeetCode solutions (e.g., "LeetCode-Solutions")';
