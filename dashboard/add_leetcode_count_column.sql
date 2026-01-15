-- Add LeetCode daily count column to user_settings
-- Run this in your Supabase SQL Editor

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS leetcode_daily_count INTEGER DEFAULT 0;

-- You'll also need a cron job to reset this daily at midnight
-- Or update the Python script to check the date and reset if new day
