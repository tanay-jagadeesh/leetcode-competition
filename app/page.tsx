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
    <main className="min-h-screen bg-base">
      {/* Header */}
      <header className="border-b border-base-lighter">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-medium">CodeClash</div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="status-dot bg-success"></span>
            <span>{playersOnline} online</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="space-y-6 mb-12">
          <h1 className="text-5xl font-medium tracking-tight">
            1v1 competitive coding.
            <br />
            <span className="text-muted">Prove you&apos;re faster.</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl">
            Real-time algorithmic duels. Same problem, two developers, one winner.
            Test your speed and accuracy against the global community.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleFindMatch}
            disabled={isLoading}
            className="btn-primary px-6 py-3 text-base"
          >
            {isLoading ? 'Finding match...' : 'Find match'}
          </button>
          <span className="text-sm text-subtle">Match in under 30 seconds</span>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-base-lighter">
        <h2 className="text-sm uppercase tracking-wider text-subtle mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-3">
            <div className="text-subtle text-sm">01</div>
            <h3 className="text-xl">Match instantly</h3>
            <p className="text-muted text-sm leading-relaxed">
              Find an opponent or race against our competitive bot. No waiting.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-subtle text-sm">02</div>
            <h3 className="text-xl">Solve under pressure</h3>
            <p className="text-muted text-sm leading-relaxed">
              Both players receive identical problems. Timer starts immediately.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-subtle text-sm">03</div>
            <h3 className="text-xl">First correct wins</h3>
            <p className="text-muted text-sm leading-relaxed">
              Submit a passing solution faster than your opponent to claim victory.
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      {recentMatches.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-20 border-t border-base-lighter">
          <h2 className="text-sm uppercase tracking-wider text-subtle mb-8">Recent matches</h2>
          <div className="space-y-px bg-base-lighter rounded-lg overflow-hidden">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="bg-base p-4 flex items-center justify-between text-sm hover:bg-base-light transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted">
                    {new Date(match.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="text-stone-200">
                    {(match.problems as any)?.title || 'Problem'}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-muted">
                    {match.player1_time && Math.floor(match.player1_time / 1000)}s
                    <span className="mx-2 text-subtle">vs</span>
                    {match.player2_time && Math.floor(match.player2_time / 1000)}s
                  </span>
                  <span className={`text-xs ${
                    match.winner === 'draw' ? 'text-muted' : 'text-success'
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
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-base-lighter">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-2">
            <h3 className="text-base">Real-time competition</h3>
            <p className="text-sm text-muted leading-relaxed">
              Watch opponent status live. Know when they&apos;re testing, debugging, or submitting.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base">Instant validation</h3>
            <p className="text-sm text-muted leading-relaxed">
              Run test cases as you code. Catch errors before submitting your final solution.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base">AI-powered hints</h3>
            <p className="text-sm text-muted leading-relaxed">
              Get guidance when stuck. Learn better approaches without spoiling the solution.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base">Global leaderboards</h3>
            <p className="text-sm text-muted leading-relaxed">
              Compete for the fastest time on each problem. Track your ranking over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-lighter mt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-subtle">
            Built for developers who thrive under pressure
          </p>
        </div>
      </footer>
    </main>
  )
}
