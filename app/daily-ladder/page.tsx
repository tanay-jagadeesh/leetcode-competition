'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, DailyRanking, UserProfile } from '@/lib/supabase'
import { getPlayerId } from '@/lib/session'

type DailyRankingWithUser = DailyRanking & {
  user_profiles: UserProfile
}

const BADGE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  top_1: { label: 'Top 1%', color: 'text-yellow-600', icon: '👑' },
  top_5: { label: 'Top 5%', color: 'text-purple-600', icon: '💎' },
  top_10: { label: 'Top 10%', color: 'text-blue-600', icon: '⭐' },
  top_25: { label: 'Top 25%', color: 'text-green-600', icon: '🏆' },
}

export default function DailyLadderPage() {
  const router = useRouter()
  const [rankings, setRankings] = useState<DailyRankingWithUser[]>([])
  const [currentUserRanking, setCurrentUserRanking] = useState<DailyRankingWithUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const loadDailyRankings = useCallback(async () => {
    try {
      setIsLoading(true)
      const currentUserId = getPlayerId()

      // Fetch today's rankings with user profiles
      const { data: rankingsData, error } = await supabase
        .from('daily_rankings')
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('date', selectedDate)
        .order('rank', { ascending: true, nullsLast: true })
        .limit(100)

      if (error) throw error

      const rankingsWithUsers = (rankingsData || []) as DailyRankingWithUser[]
      setRankings(rankingsWithUsers)

      // Find current user's ranking
      const userRanking = rankingsWithUsers.find(r => r.user_id === currentUserId)
      setCurrentUserRanking(userRanking || null)
    } catch (error) {
      console.error('Error loading daily rankings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    loadDailyRankings()
  }, [loadDailyRankings])

  const getBadgeDisplay = (badge: string | null) => {
    if (!badge || !BADGE_INFO[badge]) return null
    const info = BADGE_INFO[badge]
    const bgColorMap: Record<string, string> = {
      'text-yellow-600': 'bg-yellow-100',
      'text-purple-600': 'bg-purple-100',
      'text-blue-600': 'bg-blue-100',
      'text-green-600': 'bg-green-100',
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${info.color} ${bgColorMap[info.color] || 'bg-gray-100'}`}>
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">Loading daily ladder...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-sub hover:text-text transition-colors"
          >
            ← Back to home
          </button>
          <div className="text-xl font-semibold text-text">Daily Ranked Ladder</div>
          <div className="w-20"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Date Selector */}
        <div className="mb-8">
          <label className="text-sm font-medium text-text mb-2 block">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="input"
          />
          <p className="text-xs text-sub mt-2">{formatDate(selectedDate)}</p>
        </div>

        {/* Current User Stats Card */}
        {currentUserRanking ? (
          <div className="card p-8 mb-12 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-sub mb-2 font-medium">Your Daily Rank</div>
                <div className="text-4xl font-bold text-text">
                  #{currentUserRanking.rank || '—'}
                </div>
                {currentUserRanking.percentile !== null && (
                  <div className="text-sm text-sub mt-1">
                    Top {currentUserRanking.percentile.toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-sub mb-2 font-medium">Daily Points</div>
                <div className="text-3xl font-mono font-bold text-accent">
                  {currentUserRanking.daily_points}
                </div>
                <div className="text-xs text-sub mt-1">
                  {currentUserRanking.daily_matches_won}W / {currentUserRanking.daily_matches_played}G
                </div>
              </div>
            </div>
            {currentUserRanking.badge && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-sub">Badge earned:</span>
                {getBadgeDisplay(currentUserRanking.badge)}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8 mb-12 border-border/50">
            <div className="text-center text-sub">
              <p className="text-sm mb-2">You haven&apos;t played any matches today</p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary mt-4"
              >
                Start Competing
              </button>
            </div>
          </div>
        )}

        {/* Rankings Table */}
        <div className="card overflow-hidden">
          <div className="border-b border-border bg-bg px-6 py-4">
            <h2 className="text-lg font-semibold text-text">Top Players</h2>
            <p className="text-xs text-sub mt-1">Ranked by daily points earned</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-bg">
                <tr>
                  <th className="text-left p-5 text-xs uppercase tracking-wider text-sub font-semibold">Rank</th>
                  <th className="text-left p-5 text-xs uppercase tracking-wider text-sub font-semibold">Player</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Points</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Wins</th>
                  <th className="text-right p-5 text-xs uppercase tracking-wider text-sub font-semibold">Games</th>
                  <th className="text-center p-5 text-xs uppercase tracking-wider text-sub font-semibold">Badge</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-sub">
                      No rankings yet for this date. Be the first to compete!
                    </td>
                  </tr>
                ) : (
                  rankings.map((ranking, idx) => {
                    const isCurrentUser = ranking.user_id === getPlayerId()
                    return (
                      <tr
                        key={ranking.id}
                        className={`border-b border-border hover:bg-bg transition-colors ${
                          isCurrentUser ? 'bg-accent/5' : ''
                        }`}
                      >
                        <td className="p-5">
                          <span className={`font-mono text-sm font-medium ${
                            ranking.rank === 1 ? 'text-yellow-600' :
                            ranking.rank === 2 ? 'text-gray-400' :
                            ranking.rank === 3 ? 'text-amber-600' :
                            'text-sub'
                          }`}>
                            {ranking.rank ? `#${ranking.rank}` : '—'}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text">
                              {ranking.user_profiles?.username || 'Anonymous'}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded font-medium">You</span>
                            )}
                          </div>
                        </td>
                        <td className="p-5 text-right font-mono text-accent font-semibold">
                          {ranking.daily_points}
                        </td>
                        <td className="p-5 text-right font-mono text-win">
                          {ranking.daily_matches_won}
                        </td>
                        <td className="p-5 text-right font-mono text-text">
                          {ranking.daily_matches_played}
                        </td>
                        <td className="p-5 text-center">
                          {getBadgeDisplay(ranking.badge)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 card p-6 bg-bg border-border/50">
          <h3 className="text-sm font-semibold text-text mb-4">How Daily Rankings Work</h3>
          <ul className="space-y-2 text-sm text-sub">
            <li className="flex gap-2">
              <span>•</span>
              <span>Rankings reset every day at midnight UTC</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Earn points by winning matches (more points for harder problems and faster times)</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Top 1% earn 👑 badge, Top 5% earn 💎, Top 10% earn ⭐, Top 25% earn 🏆</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Badges are permanent and displayed on your profile</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}

