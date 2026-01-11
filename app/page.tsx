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
    const interval = setInterval(fetchStats, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Count active matches (only real matches, not bots)
      const { data: activeMatches } = await supabase
        .from('matches')
        .select('player1_id, player2_id')
        .eq('status', 'active')

      // Count only real players (exclude bot matches)
      let realPlayers = 0
      activeMatches?.forEach(match => {
        if (!match.player1_id.startsWith('bot_')) realPlayers++
        if (match.player2_id && !match.player2_id.startsWith('bot_')) realPlayers++
      })

      setPlayersOnline(realPlayers)

      // Fetch recent completed matches
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
    <main className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-7xl font-bold mb-6 text-gradient">
            1v1 LEETCODE RACE
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            Prove You&apos;re Faster
          </p>
          <p className="text-lg text-gray-400 mb-12">
            Race against developers worldwide. Same problem. Who solves it first?
          </p>

          {/* Find Match Button */}
          <button
            onClick={handleFindMatch}
            disabled={isLoading}
            className="group relative px-16 py-6 bg-gradient-to-r from-primary to-secondary text-white text-2xl font-bold rounded-xl glow-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Finding Match...
              </span>
            ) : (
              'FIND MATCH'
            )}
          </button>

          {/* Players Online */}
          <div className="mt-8 flex items-center justify-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-semibold">{playersOnline} players online</span>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-dark-200 p-8 rounded-xl border-gradient text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-white">1. Get Matched</h3>
              <p className="text-gray-400">
                Click Find Match and we&apos;ll pair you with an opponent instantly
              </p>
            </div>
            <div className="bg-dark-200 p-8 rounded-xl border-gradient text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-white">2. Race to Solve</h3>
              <p className="text-gray-400">
                Both see the same problem. Timer starts. Code as fast as you can.
              </p>
            </div>
            <div className="bg-dark-200 p-8 rounded-xl border-gradient text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3 text-white">3. First Wins</h3>
              <p className="text-gray-400">
                Submit correct solution first to win. See results & leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Recent Matches
            </h2>
            <div className="bg-dark-200 rounded-xl border-gradient overflow-hidden">
              <div className="divide-y divide-gray-700">
                {recentMatches.map((match, idx) => (
                  <div
                    key={match.id}
                    className="p-4 flex items-center justify-between hover:bg-dark-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        match.winner === 'player1' ? 'bg-green-400' :
                        match.winner === 'player2' ? 'bg-red-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className="text-gray-300">
                        {(match.problems as any)?.title || 'Problem'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-400">
                        Winner: {match.winner === 'player1' ? '🥇 Player 1' :
                                 match.winner === 'player2' ? '🥇 Player 2' : '🤝 Draw'}
                      </span>
                      <span className="text-gray-500">
                        {match.player1_time && Math.floor(match.player1_time / 1000)}s vs{' '}
                        {match.player2_time && Math.floor(match.player2_time / 1000)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-20 grid md:grid-cols-2 gap-6">
          <div className="bg-dark-200 p-6 rounded-xl border-gradient">
            <h3 className="text-xl font-bold mb-2 text-white">⚡ Real-Time Competition</h3>
            <p className="text-gray-400">
              See your opponent&apos;s progress live. Feel the pressure.
            </p>
          </div>
          <div className="bg-dark-200 p-6 rounded-xl border-gradient">
            <h3 className="text-xl font-bold mb-2 text-white">🎯 Instant Feedback</h3>
            <p className="text-gray-400">
              Run tests as you code. Know if your solution works.
            </p>
          </div>
          <div className="bg-dark-200 p-6 rounded-xl border-gradient">
            <h3 className="text-xl font-bold mb-2 text-white">🏆 Global Leaderboard</h3>
            <p className="text-gray-400">
              Beat the fastest times. Become a legend.
            </p>
          </div>
          <div className="bg-dark-200 p-6 rounded-xl border-gradient">
            <h3 className="text-xl font-bold mb-2 text-white">🤖 Always Playable</h3>
            <p className="text-gray-400">
              No players? Race against our bot. Never wait.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>Made for developers who love the thrill of competition</p>
      </footer>
    </main>
  )
}
