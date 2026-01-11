'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, UserProfile } from '@/lib/supabase'
import { getPlayerId } from '@/lib/session'

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      // Fetch top 100 players
      const { data: topPlayers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(100)

      if (error) throw error
      setLeaderboard(topPlayers || [])

      // Fetch current user's profile and rank
      const currentUserId = getPlayerId()
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (userProfile) {
        setCurrentUserProfile(userProfile)

        // Calculate user's rank
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_points', userProfile.total_points)

        if (count !== null) {
          setCurrentUserRank(count + 1)
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWinRate = (profile: UserProfile) => {
    if (profile.matches_played === 0) return '0%'
    return `${Math.round((profile.matches_won / profile.matches_played) * 100)}%`
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-sub hover:text-text transition-colors"
          >
            ← Back to home
          </button>
          <div className="text-xl font-semibold text-text">Global Leaderboard</div>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Current user stats */}
        {currentUserProfile && (
          <div className="card p-8 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-sub mb-2 font-medium">Your rank</div>
                <div className="text-4xl font-semibold text-text">
                  {currentUserRank ? getRankBadge(currentUserRank) : '--'}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-12">
                <div>
                  <div className="text-3xl font-mono text-accent font-semibold">{currentUserProfile.total_points}</div>
                  <div className="text-xs text-sub font-medium mt-1">Points</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-text font-semibold">{currentUserProfile.matches_won}</div>
                  <div className="text-xs text-sub font-medium mt-1">Wins</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-text font-semibold">{currentUserProfile.problems_solved}</div>
                  <div className="text-xs text-sub font-medium mt-1">Solved</div>
                </div>
                <div>
                  <div className="text-3xl font-mono text-text font-semibold">{getWinRate(currentUserProfile)}</div>
                  <div className="text-xs text-sub font-medium mt-1">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-bg">
                <tr>
                  <th className="text-left p-5 text-xs uppercase tracking-wider text-sub font-semibold">Rank</th>
                  <th className="text-left p-5 text-xs uppercase tracking-wider text-sub font-semibold">Player</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Points</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Matches</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Wins</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Solved</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((profile, idx) => (
                  <tr
                    key={profile.id}
                    className={`border-b border-border hover:bg-bg transition-colors ${
                      profile.id === currentUserProfile?.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="p-5">
                      <span className={`font-mono text-sm font-medium ${
                        idx === 0 ? 'text-win' :
                        idx === 1 ? 'text-sub' :
                        idx === 2 ? 'text-warning' :
                        'text-sub'
                      }`}>
                        {getRankBadge(idx + 1)}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text">{profile.username}</span>
                        {profile.id === currentUserProfile?.id && (
                          <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded font-medium">You</span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right font-mono text-accent font-semibold">{profile.total_points}</td>
                    <td className="p-5 text-right font-mono text-text">{profile.matches_played}</td>
                    <td className="p-5 text-right font-mono text-win">{profile.matches_won}</td>
                    <td className="p-5 text-right font-mono text-text">{profile.problems_solved}</td>
                    <td className="p-5 text-right font-mono text-text">{getWinRate(profile)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-16 text-sub">
            No players yet. Be the first to compete!
          </div>
        )}
      </div>
    </main>
  )
}
