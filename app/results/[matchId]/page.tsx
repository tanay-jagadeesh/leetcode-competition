'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Match, Problem, LeaderboardEntry } from '@/lib/supabase'
import { getPlayerId } from '@/lib/session'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2'>('player1')
  const [didWin, setDidWin] = useState(false)

  useEffect(() => {
    loadResults()
  }, [matchId])

  const loadResults = async () => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*, problems(*)')
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError

      const currentMatch = matchData as any
      setMatch(currentMatch)

      const problemData = currentMatch.problems as Problem
      setProblem(problemData)

      const currentPlayerId = getPlayerId()
      const role = currentPlayerId === currentMatch.player2_id ? 'player2' : 'player1'
      setPlayerRole(role)

      const won = currentMatch.winner === role
      setDidWin(won)

      const { data: leaderboardData } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('problem_id', problemData.id)
        .order('time_ms', { ascending: true })
        .limit(10)

      setLeaderboard(leaderboardData || [])
    } catch (error) {
      console.error('Error loading results:', error)
    }
  }

  const formatTime = (ms: number | null) => {
    if (!ms) return '--:--'
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayAgain = () => {
    router.push('/queue')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (!match || !problem) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-muted">Loading results...</div>
      </div>
    )
  }

  const playerTime = match[`${playerRole}_time`]
  const playerPassed = match[`${playerRole}_passed`]
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1'
  const opponentTime = match[`${opponentRole}_time`]
  const opponentPassed = match[`${opponentRole}_passed`]

  return (
    <main className="min-h-screen bg-base">
      {/* Header */}
      <header className="border-b border-base-lighter">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={handleGoHome}
            className="text-sm text-muted hover:text-stone-200 transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Result header */}
        <div className="mb-16">
          {didWin ? (
            <>
              <div className="text-sm uppercase tracking-wider text-success mb-4">Victory</div>
              <h1 className="text-4xl mb-3">You won</h1>
              <p className="text-muted">Submitted the correct solution first</p>
            </>
          ) : match.winner === 'draw' ? (
            <>
              <div className="text-sm uppercase tracking-wider text-warning mb-4">Draw</div>
              <h1 className="text-4xl mb-3">Match incomplete</h1>
              <p className="text-muted">Neither player submitted a passing solution</p>
            </>
          ) : (
            <>
              <div className="text-sm uppercase tracking-wider text-muted mb-4">Defeated</div>
              <h1 className="text-4xl mb-3">Opponent won</h1>
              <p className="text-muted">They submitted a correct solution faster</p>
            </>
          )}
        </div>

        {/* Problem info */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg mb-1">{problem.title}</h2>
              <span className={`text-xs ${
                problem.difficulty === 'easy' ? 'text-success' :
                problem.difficulty === 'medium' ? 'text-warning' :
                'text-error'
              }`}>
                {problem.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Time comparison */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <div className={`card p-6 ${didWin ? 'border-success/30' : ''}`}>
            <div className="text-xs uppercase tracking-wider text-subtle mb-3">Your time</div>
            <div className="font-mono text-3xl mb-3">{formatTime(playerTime)}</div>
            <div className={`text-sm ${playerPassed ? 'text-success' : 'text-error'}`}>
              {playerPassed ? 'All tests passed' : 'Some tests failed'}
            </div>
          </div>

          <div className={`card p-6 ${!didWin && match.winner !== 'draw' ? 'border-error/30' : ''}`}>
            <div className="text-xs uppercase tracking-wider text-subtle mb-3">Opponent time</div>
            <div className="font-mono text-3xl mb-3">{formatTime(opponentTime)}</div>
            <div className={`text-sm ${opponentPassed ? 'text-success' : 'text-error'}`}>
              {opponentPassed ? 'All tests passed' : 'Some tests failed'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="card p-4">
            <div className="text-2xl font-mono mb-1">
              {playerPassed ? problem.test_cases.length : 0}/{problem.test_cases.length}
            </div>
            <div className="text-xs text-subtle">Tests passed</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-mono mb-1">
              {playerTime ? Math.floor(playerTime / 1000) : 0}s
            </div>
            <div className="text-xs text-subtle">Total time</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-mono mb-1 text-accent">
              +{match[`${playerRole}_points`] || 0}
            </div>
            <div className="text-xs text-subtle">Points earned</div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-12">
            <h2 className="text-sm uppercase tracking-wider text-subtle mb-6">
              Leaderboard — {problem.title}
            </h2>
            <div className="space-y-px bg-base-lighter rounded-lg overflow-hidden">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="bg-base p-4 flex items-center justify-between hover:bg-base-light transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 text-center font-mono text-sm ${
                      idx === 0 ? 'text-success' :
                      idx === 1 ? 'text-stone-400' :
                      idx === 2 ? 'text-warning' :
                      'text-subtle'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm">{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-subtle">{entry.language}</span>
                    <span className="font-mono text-muted">{formatTime(entry.time_ms)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="btn-primary px-6 py-3"
          >
            Play again
          </button>
          <button
            onClick={handleGoHome}
            className="btn-secondary px-6 py-3"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  )
}
