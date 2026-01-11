-- Quick diagnostic query to check what problems are in your database
-- Run this in Supabase SQL Editor to see what you have

SELECT 
  COUNT(*) as total_problems,
  COUNT(*) FILTER (WHERE difficulty = 'easy') as easy_count,
  COUNT(*) FILTER (WHERE difficulty = 'medium') as medium_count,
  COUNT(*) FILTER (WHERE difficulty = 'hard') as hard_count
FROM problems;

-- See the actual problems
SELECT id, title, difficulty 
FROM problems 
ORDER BY created_at;

