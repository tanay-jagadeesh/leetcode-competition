'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, UserProfile } from '@/lib/supabase'
import { getPlayerId } from '@/lib/session'
import { useAuth } from '@/lib/auth-context'
import ModeSelectionModal from '@/app/components/ModeSelectionModal'
import AuthModal from '@/app/components/AuthModal'

export default function Home() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [playersOnline, setPlayersOnline] = useState(0)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showModeModal, setShowModeModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const updatePresence = async () => {
    try {
      const playerId = getPlayerId()
      await fetch('/api/ping', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({ playerId }),
        cache: 'no-store'
      })
    } catch (error) {
      // Silently fail - presence tracking is not critical
      console.error('Error updating presence:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Count players who are actively playing (in active or waiting matches)
      // Exclude bots and count unique players
      const { data: activeMatches, error: matchesError } = await supabase
        .from('matches')
        .select('player1_id, player2_id')
        .in('status', ['active', 'waiting'])

      if (matchesError) {
        console.error('Error counting active players:', matchesError)
        setPlayersOnline(0)
      } else if (activeMatches) {
        // Collect all unique player IDs (excluding bots)
        const playerIds = new Set<string>()
        activeMatches.forEach(match => {
          // Only count real players, not bots
          if (match.player1_id && typeof match.player1_id === 'string' && !match.player1_id.startsWith('bot_')) {
            playerIds.add(match.player1_id)
          }
          if (match.player2_id && typeof match.player2_id === 'string' && !match.player2_id.startsWith('bot_')) {
            playerIds.add(match.player2_id)
          }
        })
        setPlayersOnline(playerIds.size)
      } else {
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
      // Use authenticated user ID if available, otherwise fallback to anonymous
      const userId = user?.id || getPlayerId()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setUserProfile(data)
      } else if (error && error.code === 'PGRST116') {
        // User profile doesn't exist yet - create one with 0 points
        const username = user?.email?.split('@')[0] || 'Anonymous'
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            username: username,
            total_points: 0,
            matches_played: 0,
            matches_won: 0,
            problems_solved: 0
          })
          .select()
          .single()
        
        if (newProfile) {
          setUserProfile(newProfile)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  useEffect(() => {
    // Update user's last_seen timestamp immediately
    updatePresence()
    
    fetchStats()
    fetchUserProfile()
    
    // Update presence every 30 seconds (more frequent for accurate tracking)
    const presenceInterval = setInterval(updatePresence, 30000)
    
    // Refresh stats every 10 seconds
    const statsInterval = setInterval(fetchStats, 10000)
    
    return () => {
      clearInterval(presenceInterval)
      clearInterval(statsInterval)
    }
  }, [user]) // Re-fetch profile when auth state changes

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
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
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
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-sub font-medium">{userProfile?.username || user.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-sub">{user.email}</div>
                  </div>
                  <button
                    onClick={signOut}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary text-sm px-5 py-2.5"
                >
                  Sign In
                </button>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="status-dot bg-win"></span>
                <span className="text-text">{playersOnline} online</span>
              </div>
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

          {/* Points Display - Always Visible */}
          <div className="inline-flex items-center gap-6 px-6 py-4 mb-8 bg-card border border-border rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-sub font-medium mb-1">Your Points</div>
              <div className="text-3xl font-mono text-accent font-bold tabular-nums">
                {userProfile ? userProfile.total_points : 0}
              </div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-sub font-medium mb-1">Available Hints</div>
              <div className="text-3xl font-mono text-text font-bold tabular-nums">
                {userProfile ? Math.floor(userProfile.total_points / 5) : 0}
              </div>
              <div className="text-[10px] text-sub mt-0.5">5 points per hint</div>
            </div>
          </div>

          {/* Daily Ladder CTA */}
          <div className="mb-12">
            <button
              onClick={() => router.push('/daily-ladder')}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent to-accent/80 text-white font-semibold rounded-lg shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-lg">🏆</span>
              <div className="text-left">
                <div className="text-sm font-bold">Daily Ranked Ladder</div>
                <div className="text-xs opacity-90">Compete for top % badges</div>
              </div>
              <span className="ml-2">→</span>
            </button>
          </div>

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
            {recentMatches.map((match) => {
              // Determine if current user won this match
              const currentPlayerId = getPlayerId()
              const userRole = currentPlayerId === match.player2_id ? 'player2' : 'player1'
              const userWon = match.winner === userRole && match[`${userRole}_passed`] === true
              const userPassed = match[`${userRole}_passed`] === true
              const opponentRole = userRole === 'player1' ? 'player2' : 'player1'
              const opponentPassed = match[`${opponentRole}_passed`] === true
              
              // Determine result status
              let resultText = 'Draw'
              let resultColor = 'text-sub'
              
              if (match.winner === 'draw' || (!userPassed && !opponentPassed)) {
                resultText = 'Draw'
                resultColor = 'text-sub'
              } else if (userWon) {
                resultText = 'Won'
                resultColor = 'text-win'
              } else {
                resultText = 'Lost'
                resultColor = 'text-lose'
              }

              return (
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
                    <span className={`text-xs font-medium ${resultColor}`}>
                      {resultText}
                    </span>
                  </div>
                </div>
              )
            })}
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
