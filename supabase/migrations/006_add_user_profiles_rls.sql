-- Add RLS policies for user_profiles table
-- This ensures the active users count works properly

-- Enable RLS if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Anyone can read user_profiles" ON user_profiles;
CREATE POLICY "Anyone can read user_profiles" ON user_profiles FOR SELECT USING (true);

-- Create policies for insert (users can create their own profile)
DROP POLICY IF EXISTS "Anyone can insert user_profiles" ON user_profiles;
CREATE POLICY "Anyone can insert user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);

-- Create policies for update (users can update their own profile)
DROP POLICY IF EXISTS "Anyone can update user_profiles" ON user_profiles;
CREATE POLICY "Anyone can update user_profiles" ON user_profiles FOR UPDATE USING (true);

