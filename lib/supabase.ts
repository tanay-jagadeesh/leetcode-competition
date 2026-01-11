import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Problem = {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  test_cases: TestCase[]
  starter_code: { [key: string]: string }
  constraints: string
  created_at?: string
}

export type TestCase = {
  input: any
  expected_output: any
  is_sample?: boolean
}

export type Match = {
  id: string
  problem_id: string
  player1_id: string
  player2_id: string | null
  player1_time: number | null
  player2_time: number | null
  player1_passed: boolean | null
  player2_passed: boolean | null
  player1_points: number | null
  player2_points: number | null
  status: 'waiting' | 'active' | 'completed'
  winner: 'player1' | 'player2' | 'draw' | null
  created_at: string
}

export type LeaderboardEntry = {
  id: string
  problem_id: string
  username: string
  time_ms: number
  language: string
  created_at: string
}

export type UserProfile = {
  id: string
  username: string
  total_points: number
  matches_played: number
  matches_won: number
  problems_solved: number
  created_at: string
  updated_at: string
  last_seen?: string
}
