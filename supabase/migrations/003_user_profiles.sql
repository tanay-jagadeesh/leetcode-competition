-- Create user_profiles table for tracking points and stats
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  total_points INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(total_points DESC);

-- Add points columns to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS player1_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_points INTEGER DEFAULT 0;

-- Function to calculate points based on difficulty and time
CREATE OR REPLACE FUNCTION calculate_match_points(
  difficulty TEXT,
  time_ms INTEGER,
  did_win BOOLEAN,
  opponent_is_bot BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  base_points INTEGER;
  time_bonus INTEGER;
  win_bonus INTEGER;
  total INTEGER;
BEGIN
  -- Base points by difficulty
  base_points := CASE difficulty
    WHEN 'easy' THEN 10
    WHEN 'medium' THEN 25
    WHEN 'hard' THEN 50
    ELSE 10
  END;

  -- Time bonus (faster = more points, max 20 bonus points)
  -- Under 2 min = 20pts, 2-5 min = 10pts, 5+ min = 5pts
  time_bonus := CASE
    WHEN time_ms < 120000 THEN 20
    WHEN time_ms < 300000 THEN 10
    ELSE 5
  END;

  -- Win bonus (50% of base points, reduced if against bot)
  IF did_win THEN
    IF opponent_is_bot THEN
      win_bonus := base_points / 4;  -- 25% bonus for bot wins
    ELSE
      win_bonus := base_points / 2;  -- 50% bonus for player wins
    END IF;
  ELSE
    win_bonus := 0;
  END IF;

  total := base_points + time_bonus + win_bonus;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to update user profile after match
CREATE OR REPLACE FUNCTION update_user_profile_after_match()
RETURNS TRIGGER AS $$
DECLARE
  p1_points INTEGER;
  p2_points INTEGER;
  p1_is_bot BOOLEAN;
  p2_is_bot BOOLEAN;
  problem_difficulty TEXT;
BEGIN
  -- Only process when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Check if players are bots
    p1_is_bot := NEW.player1_id LIKE 'bot_%';
    p2_is_bot := NEW.player2_id LIKE 'bot_%';

    -- Get problem difficulty
    SELECT difficulty INTO problem_difficulty
    FROM problems
    WHERE id = NEW.problem_id;

    -- Calculate points for player 1
    IF NOT p1_is_bot AND NEW.player1_passed AND NEW.player1_time IS NOT NULL THEN
      p1_points := calculate_match_points(
        problem_difficulty,
        NEW.player1_time,
        NEW.winner = 'player1',
        p2_is_bot
      );

      -- Update player 1 profile
      INSERT INTO user_profiles (id, total_points, matches_played, matches_won, problems_solved)
      VALUES (
        NEW.player1_id,
        p1_points,
        1,
        CASE WHEN NEW.winner = 'player1' THEN 1 ELSE 0 END,
        CASE WHEN NEW.player1_passed THEN 1 ELSE 0 END
      )
      ON CONFLICT (id) DO UPDATE SET
        total_points = user_profiles.total_points + p1_points,
        matches_played = user_profiles.matches_played + 1,
        matches_won = user_profiles.matches_won + CASE WHEN NEW.winner = 'player1' THEN 1 ELSE 0 END,
        problems_solved = user_profiles.problems_solved + CASE WHEN NEW.player1_passed THEN 1 ELSE 0 END,
        updated_at = NOW();

      -- Store points in match record
      NEW.player1_points := p1_points;
    END IF;

    -- Calculate points for player 2
    IF NOT p2_is_bot AND NEW.player2_id IS NOT NULL AND NEW.player2_passed AND NEW.player2_time IS NOT NULL THEN
      p2_points := calculate_match_points(
        problem_difficulty,
        NEW.player2_time,
        NEW.winner = 'player2',
        p1_is_bot
      );

      -- Update player 2 profile
      INSERT INTO user_profiles (id, total_points, matches_played, matches_won, problems_solved)
      VALUES (
        NEW.player2_id,
        p2_points,
        1,
        CASE WHEN NEW.winner = 'player2' THEN 1 ELSE 0 END,
        CASE WHEN NEW.player2_passed THEN 1 ELSE 0 END
      )
      ON CONFLICT (id) DO UPDATE SET
        total_points = user_profiles.total_points + p2_points,
        matches_played = user_profiles.matches_played + 1,
        matches_won = user_profiles.matches_won + CASE WHEN NEW.winner = 'player2' THEN 1 ELSE 0 END,
        problems_solved = user_profiles.problems_solved + CASE WHEN NEW.player2_passed THEN 1 ELSE 0 END,
        updated_at = NOW();

      -- Store points in match record
      NEW.player2_points := p2_points;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update profiles after match completion
DROP TRIGGER IF EXISTS trigger_update_user_profile ON matches;
CREATE TRIGGER trigger_update_user_profile
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_after_match();
