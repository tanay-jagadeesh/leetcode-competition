-- Daily Ranked Ladder System
-- Tracks daily performance and awards badges to top performers

-- Create daily_rankings table
CREATE TABLE IF NOT EXISTS daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_points INTEGER NOT NULL DEFAULT 0,
  daily_matches_won INTEGER NOT NULL DEFAULT 0,
  daily_matches_played INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  percentile REAL,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_rankings_date ON daily_rankings(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_rank ON daily_rankings(date DESC, rank ASC);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_user_date ON daily_rankings(user_id, date DESC);

-- Add badges column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Function to calculate daily points from a match
CREATE OR REPLACE FUNCTION update_daily_ranking(
  p_user_id TEXT,
  p_points INTEGER,
  p_won BOOLEAN
) RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update daily ranking for today
  INSERT INTO daily_rankings (user_id, date, daily_points, daily_matches_won, daily_matches_played)
  VALUES (
    p_user_id,
    today_date,
    p_points,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    daily_points = daily_rankings.daily_points + p_points,
    daily_matches_won = daily_rankings.daily_matches_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    daily_matches_played = daily_rankings.daily_matches_played + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate ranks and percentiles for a given date
CREATE OR REPLACE FUNCTION recalculate_daily_ranks(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  total_players INTEGER;
  player_record RECORD;
  current_rank INTEGER := 1;
  prev_points INTEGER := -1;
  rank_counter INTEGER := 1;
BEGIN
  -- Get total number of players for this date
  SELECT COUNT(*) INTO total_players
  FROM daily_rankings
  WHERE date = p_date;

  -- If no players, exit
  IF total_players = 0 THEN
    RETURN;
  END IF;

  -- Loop through players ordered by daily_points descending
  FOR player_record IN
    SELECT user_id, daily_points
    FROM daily_rankings
    WHERE date = p_date
    ORDER BY daily_points DESC, daily_matches_won DESC, daily_matches_played ASC
  LOOP
    -- If points changed, update rank counter
    IF player_record.daily_points != prev_points THEN
      current_rank := rank_counter;
      prev_points := player_record.daily_points;
    END IF;

    -- Calculate percentile (lower is better - rank 1 = 0%, rank N = 100%)
    -- Top 1% = 0-1%, Top 5% = 1-5%, Top 10% = 5-10%, etc.
    DECLARE
      calculated_percentile REAL;
      badge_text TEXT;
    BEGIN
      calculated_percentile := (current_rank::REAL / total_players::REAL) * 100.0;

      -- Assign badge based on percentile
      IF calculated_percentile <= 1.0 THEN
        badge_text := 'top_1';
      ELSIF calculated_percentile <= 5.0 THEN
        badge_text := 'top_5';
      ELSIF calculated_percentile <= 10.0 THEN
        badge_text := 'top_10';
      ELSIF calculated_percentile <= 25.0 THEN
        badge_text := 'top_25';
      ELSE
        badge_text := NULL;
      END IF;

      -- Update the ranking record
      UPDATE daily_rankings
      SET
        rank = current_rank,
        percentile = calculated_percentile,
        badge = badge_text,
        updated_at = NOW()
      WHERE user_id = player_record.user_id AND date = p_date;

      -- Update user_profiles badges array (add today's badge if earned)
      IF badge_text IS NOT NULL THEN
        UPDATE user_profiles
        SET badges = (
          SELECT jsonb_agg(DISTINCT badge_value)
          FROM (
            SELECT jsonb_array_elements_text(badges) AS badge_value
            UNION
            SELECT badge_text
          ) AS all_badges
        )
        WHERE id = player_record.user_id
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(badges) AS existing_badge
          WHERE existing_badge = badge_text
        );
      END IF;
    END;

    rank_counter := rank_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily rankings when match completes
CREATE OR REPLACE FUNCTION update_daily_ranking_on_match()
RETURNS TRIGGER AS $$
DECLARE
  p1_points INTEGER;
  p2_points INTEGER;
  p1_won BOOLEAN;
  p2_won BOOLEAN;
BEGIN
  -- Only process when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Skip bots
    IF NOT (NEW.player1_id LIKE 'bot_%') AND NEW.player1_points IS NOT NULL THEN
      p1_won := (NEW.winner = 'player1' AND NEW.player1_passed = true);
      PERFORM update_daily_ranking(NEW.player1_id, NEW.player1_points, p1_won);
    END IF;

    IF NOT (NEW.player2_id LIKE 'bot_%') AND NEW.player2_id IS NOT NULL AND NEW.player2_points IS NOT NULL THEN
      p2_won := (NEW.winner = 'player2' AND NEW.player2_passed = true);
      PERFORM update_daily_ranking(NEW.player2_id, NEW.player2_points, p2_won);
    END IF;

    -- Recalculate ranks for today after updating
    PERFORM recalculate_daily_ranks(CURRENT_DATE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_daily_ranking ON matches;
CREATE TRIGGER trigger_update_daily_ranking
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_ranking_on_match();

-- Enable RLS
ALTER TABLE daily_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can read daily rankings" ON daily_rankings;
CREATE POLICY "Anyone can read daily rankings" ON daily_rankings FOR SELECT USING (true);

-- Function to reset daily rankings (call this daily via cron or scheduled job)
CREATE OR REPLACE FUNCTION reset_daily_rankings()
RETURNS VOID AS $$
BEGIN
  -- This function can be called to prepare for a new day
  -- Actual reset happens automatically when new matches complete
  -- But we can use this to clean up old data if needed
  DELETE FROM daily_rankings WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

