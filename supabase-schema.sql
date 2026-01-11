-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  test_cases JSONB NOT NULL,
  starter_code JSONB NOT NULL,
  constraints TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id) NOT NULL,
  player1_id TEXT NOT NULL,
  player2_id TEXT,
  player1_time INTEGER,
  player2_time INTEGER,
  player1_passed BOOLEAN,
  player2_passed BOOLEAN,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  winner TEXT CHECK (winner IN ('player1', 'player2', 'draw')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id) NOT NULL,
  username TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_problem_time ON leaderboard(problem_id, time_ms ASC);

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);

-- Create policies for insert
CREATE POLICY "Anyone can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert leaderboard" ON leaderboard FOR INSERT WITH CHECK (true);

-- Create policies for update
CREATE POLICY "Anyone can update matches" ON matches FOR UPDATE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
