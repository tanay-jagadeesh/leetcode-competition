'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, UserProfile } from '@/lib/supabase'
import { getPlayerId } from '@/lib/session'
import ModeSelectionModal from '@/app/components/ModeSelectionModal'

export default function Home() {
  const router = useRouter()
  const [playersOnline, setPlayersOnline] = useState(0)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showModeModal, setShowModeModal] = useState(false)

  const updatePresence = async () => {
    try {
      const playerId = getPlayerId()
      await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      })
    } catch (error) {
      // Silently fail - presence tracking is not critical
      console.error('Error updating presence:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Count active users (users with last_seen within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinutesAgo)

      if (!countError && count !== null) {
        setPlayersOnline(count)
      } else {
        console.error('Error counting active users:', countError)
        setPlayersOnline(0)
      }

      const { data: matches } = await supabase
        .from('matches')
        .select('*, problems(title)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentMatches(matches || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const userId = getPlayerId()
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      // User profile doesn't exist yet
    }
  }

  useEffect(() => {
    // Update user's last_seen timestamp
    updatePresence()
    
    fetchStats()
    fetchUserProfile()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleFindMatch = () => {
    setShowModeModal(true)
  }

  const handleSelectMode = (mode: 'pvp' | 'bot') => {
    setShowModeModal(false)
    router.push(`/queue?mode=${mode}`)
  }

  return (
    <>
      <ModeSelectionModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        onSelectMode={handleSelectMode}
      />
      <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="text-xl font-semibold text-text">CodeClash</div>
          <div className="flex items-center gap-6">
            {userProfile && (
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex items-center gap-4 px-5 py-3 rounded-lg bg-card border border-border hover:border-accent/30 hover:shadow-md transition-all group"
              >
                <div className="text-right">
                  <div className="text-xs text-sub font-medium mb-1">Total Points</div>
                  <div className="text-2xl font-mono text-accent font-bold tabular-nums">{userProfile.total_points}</div>
                  <div className="text-[10px] text-sub mt-0.5">
                    {Math.floor(userProfile.total_points / 5)} hints available
                  </div>
                </div>
                <span className="text-sub group-hover:text-accent transition-colors text-lg">→</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="status-dot bg-win"></span>
              <span className="text-text">{playersOnline} online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-text">
            1v1 Code Battle
          </h1>
          <p className="text-xl text-text mb-3 font-medium">
            Race. Code. Win.
          </p>
          <p className="text-base text-sub max-w-xl mx-auto mb-8 leading-relaxed">
            Real-time algorithmic duels against developers worldwide.
            Same problem, one winner. Prove you&apos;re faster.
          </p>

          {/* Points Display - Prominent */}
          {userProfile && (
            <div className="inline-flex items-center gap-6 px-6 py-4 mb-12 bg-card border border-border rounded-lg">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-sub font-medium mb-1">Your Points</div>
                <div className="text-3xl font-mono text-accent font-bold tabular-nums">{userProfile.total_points}</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-sub font-medium mb-1">Available Hints</div>
                <div className="text-3xl font-mono text-text font-bold tabular-nums">{Math.floor(userProfile.total_points / 5)}</div>
                <div className="text-[10px] text-sub mt-0.5">5 points per hint</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={handleFindMatch}
              disabled={isLoading}
              className="btn-primary px-8 py-4 text-base"
            >
              {isLoading ? 'Finding match...' : 'Start Battle'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="status-dot bg-win"></span>
            <span className="text-sm text-sub">{playersOnline} players online</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-8">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-base font-semibold mb-3 text-text">Instant Matching</h3>
            <p className="text-sub text-sm leading-relaxed">
              Find an opponent in seconds. No queue, no wait. Just pure competition.
            </p>
          </div>
          <div className="card p-8">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-xl">⏱️</span>
            </div>
            <h3 className="text-base font-semibold mb-3 text-text">Code Under Pressure</h3>
            <p className="text-sub text-sm leading-relaxed">
              Timer starts the moment you see the problem. Every second counts.
            </p>
          </div>
          <div className="card p-8">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-xl">🏆</span>
            </div>
            <h3 className="text-base font-semibold mb-3 text-text">Winner Takes All</h3>
            <p className="text-sub text-sm leading-relaxed">
              First to submit a passing solution wins. Claim your spot on the leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      {recentMatches.length > 0 && (
        <section className="max-w-4xl mx-auto px-8 py-24 border-t border-border">
          <h2 className="text-xs uppercase tracking-wider text-sub mb-10 font-medium">Recent battles</h2>
          <div className="space-y-1">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="card p-5 flex items-center justify-between text-sm hover:border-[#D1CFC9] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-sub">
                    {new Date(match.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-text font-medium">
                    {(match.problems as any)?.title || 'Problem'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sub font-mono text-sm">
                    {match.player1_time && Math.floor(match.player1_time / 1000)}s
                    <span className="mx-2 text-sub">vs</span>
                    {match.player2_time && Math.floor(match.player2_time / 1000)}s
                  </span>
                  <span className={`text-xs font-medium ${
                    match.winner === 'draw' ? 'text-sub' : match.winner ? 'text-win' : 'text-lose'
                  }`}>
                    {match.winner === 'draw' ? 'Draw' : 'Won'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 py-24 border-t border-border">
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text">Real-time competition</h3>
            <p className="text-sm text-sub leading-relaxed">
              Watch opponent status live. Know when they&apos;re testing, debugging, or submitting.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text">Instant validation</h3>
            <p className="text-sm text-sub leading-relaxed">
              Run test cases as you code. Catch errors before submitting your final solution.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text">AI-powered hints</h3>
            <p className="text-sm text-sub leading-relaxed">
              Get guidance when stuck. Learn better approaches without spoiling the solution.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text">Global leaderboards</h3>
            <p className="text-sm text-sub leading-relaxed">
              Compete for the fastest time on each problem. Track your ranking over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <p className="text-sm text-sub">
            Built for developers who thrive under pressure
          </p>
        </div>
      </footer>
    </main>
    </>
  )
}
