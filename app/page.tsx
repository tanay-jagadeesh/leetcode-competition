'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [playersOnline, setPlayersOnline] = useState(0)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const { data: activeMatches } = await supabase
        .from('matches')
        .select('player1_id, player2_id')
        .eq('status', 'active')

      let realPlayers = 0
      activeMatches?.forEach(match => {
        if (!match.player1_id.startsWith('bot_')) realPlayers++
        if (match.player2_id && !match.player2_id.startsWith('bot_')) realPlayers++
      })
      setPlayersOnline(realPlayers)

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

  const handleFindMatch = async () => {
    setIsLoading(true)
    router.push('/queue')
  }

  return (
    <main className="min-h-screen bg-base relative overflow-hidden">
      {/* Ambient background effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none"></div>

      {/* Header */}
      <header className="relative border-b border-base-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-gradient">CodeClash</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="status-dot bg-success"></span>
            <span className="text-gray-300">{playersOnline} online</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-gradient">
            1v1 CODE BATTLE
          </h1>
          <p className="text-2xl text-gray-300 mb-4 font-semibold">
            Race. Code. Win.
          </p>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-12">
            Real-time algorithmic duels against developers worldwide.
            Same problem, one winner. Prove you&apos;re faster.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleFindMatch}
              disabled={isLoading}
              className="btn-primary px-8 py-4 text-lg"
            >
              {isLoading ? 'Finding match...' : 'Start Battle'}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="status-dot bg-success"></div>
            <span className="text-sm text-muted">{playersOnline} players online</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card-hover p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Matching</h3>
            <p className="text-muted text-sm">
              Find an opponent in seconds. No queue, no wait. Just pure competition.
            </p>
          </div>
          <div className="card-hover p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Under Pressure</h3>
            <p className="text-muted text-sm">
              Timer starts the moment you see the problem. Every second counts.
            </p>
          </div>
          <div className="card-hover p-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Winner Takes All</h3>
            <p className="text-muted text-sm">
              First to submit a passing solution wins. Claim your spot on the leaderboard.
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      {recentMatches.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-20 border-t border-base-border">
          <h2 className="text-sm uppercase tracking-wider text-subtle mb-8">Recent battles</h2>
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="card-hover p-4 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-subtle">
                    {new Date(match.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-gray-200 font-medium">
                    {(match.problems as any)?.title || 'Problem'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-muted font-mono text-sm">
                    {match.player1_time && Math.floor(match.player1_time / 1000)}s
                    <span className="mx-2 text-subtle">vs</span>
                    {match.player2_time && Math.floor(match.player2_time / 1000)}s
                  </span>
                  <span className={`text-xs font-semibold ${
                    match.winner === 'draw' ? 'text-warning' : 'text-success'
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
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-base-border">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">⚡ Real-time competition</h3>
            <p className="text-sm text-muted leading-relaxed">
              Watch opponent status live. Know when they&apos;re testing, debugging, or submitting.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">🎯 Instant validation</h3>
            <p className="text-sm text-muted leading-relaxed">
              Run test cases as you code. Catch errors before submitting your final solution.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">🤖 AI-powered hints</h3>
            <p className="text-sm text-muted leading-relaxed">
              Get guidance when stuck. Learn better approaches without spoiling the solution.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">🏆 Global leaderboards</h3>
            <p className="text-sm text-muted leading-relaxed">
              Compete for the fastest time on each problem. Track your ranking over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-border mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-subtle">
            Built for developers who thrive under pressure
          </p>
        </div>
      </footer>
    </main>
  )
}
