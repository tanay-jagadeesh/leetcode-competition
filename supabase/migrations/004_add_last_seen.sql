-- Add last_seen column to user_profiles for tracking active users
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient active user queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen ON user_profiles(last_seen DESC);

-- Update last_seen to NOW() when user_profiles is updated
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_seen on updates
DROP TRIGGER IF EXISTS trigger_update_last_seen ON user_profiles;
CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

