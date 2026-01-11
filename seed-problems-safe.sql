-- Seed LeetCode problems (Safe Version - Handles Duplicates)
-- Run this SQL in your Supabase SQL Editor
-- This version uses ON CONFLICT to avoid duplicate errors

-- First, let's see what we have (optional - you can run this to check)
-- SELECT COUNT(*), difficulty FROM problems GROUP BY difficulty;

-- Clear existing problems if you want a fresh start (UNCOMMENT IF NEEDED)
-- DELETE FROM problems;

-- Now insert all problems (will skip if title already exists)
-- Note: This assumes title is unique. If you want to update existing problems,
-- you can modify this to use ON CONFLICT (title) DO UPDATE instead.

