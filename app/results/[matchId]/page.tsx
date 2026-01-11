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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    router.push('/')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (!match || !problem) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">Loading results...</div>
      </div>
    )
  }

  const playerTime = match[`${playerRole}_time`]
  const playerPassed = match[`${playerRole}_passed`]
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1'
  const opponentTime = match[`${opponentRole}_time`]
  const opponentPassed = match[`${opponentRole}_passed`]

  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <button
            onClick={handleGoHome}
            className="text-sm text-sub hover:text-text transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-20">
        {/* Result header */}
        <div className="mb-16">
          {didWin ? (
            <>
              <div className="text-xs uppercase tracking-wider text-win mb-4 font-medium">Victory</div>
              <h1 className="text-4xl font-semibold mb-4 text-text">You won</h1>
              <p className="text-sub">Submitted the correct solution first</p>
            </>
          ) : match.winner === 'draw' ? (
            <>
              <div className="text-xs uppercase tracking-wider text-warning mb-4 font-medium">Draw</div>
              <h1 className="text-4xl font-semibold mb-4 text-text">Match incomplete</h1>
              <p className="text-sub">Neither player submitted a passing solution</p>
            </>
          ) : (
            <>
              <div className="text-xs uppercase tracking-wider text-sub mb-4 font-medium">Defeated</div>
              <h1 className="text-4xl font-semibold mb-4 text-text">Opponent won</h1>
              <p className="text-sub">They submitted a correct solution faster</p>
            </>
          )}
        </div>

        {/* Problem info */}
        <div className="card p-6 mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2 text-text">{problem.title}</h2>
              <span className={`text-xs font-medium ${
                problem.difficulty === 'easy' ? 'text-win' :
                problem.difficulty === 'medium' ? 'text-warning' :
                'text-lose'
              }`}>
                {problem.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Time comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className={`card p-8 ${didWin ? 'border-win/30' : ''}`}>
            <div className="text-xs uppercase tracking-wider text-sub mb-4 font-medium">Your time</div>
            <div className="font-mono text-4xl mb-4 text-text">{formatTime(playerTime)}</div>
            <div className={`text-sm font-medium ${playerPassed ? 'text-win' : 'text-lose'}`}>
              {playerPassed ? 'All tests passed' : 'Some tests failed'}
            </div>
          </div>

          <div className={`card p-8 ${!didWin && match.winner !== 'draw' ? 'border-lose/30' : ''}`}>
            <div className="text-xs uppercase tracking-wider text-sub mb-4 font-medium">Opponent time</div>
            <div className="font-mono text-4xl mb-4 text-text">{formatTime(opponentTime)}</div>
            <div className={`text-sm font-medium ${opponentPassed ? 'text-win' : 'text-lose'}`}>
              {opponentPassed ? 'All tests passed' : 'Some tests failed'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-3xl font-mono mb-2 text-text">
              {playerPassed ? problem.test_cases.length : 0}/{problem.test_cases.length}
            </div>
            <div className="text-xs text-sub font-medium">Tests passed</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-mono mb-2 text-text">
              {playerTime ? Math.floor(playerTime / 1000) : 0}s
            </div>
            <div className="text-xs text-sub font-medium">Total time</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-mono mb-2 text-accent">
              +{match[`${playerRole}_points`] || 0}
            </div>
            <div className="text-xs text-sub font-medium">Points earned</div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs uppercase tracking-wider text-sub mb-8 font-medium">
              Leaderboard — {problem.title}
            </h2>
            <div className="space-y-1">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="card p-5 flex items-center justify-between hover:border-[#D1CFC9] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 text-center font-mono text-sm font-medium ${
                      idx === 0 ? 'text-win' :
                      idx === 1 ? 'text-sub' :
                      idx === 2 ? 'text-warning' :
                      'text-sub'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm text-text font-medium">{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-sub">{entry.language}</span>
                    <span className="font-mono text-text">{formatTime(entry.time_ms)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handlePlayAgain}
            className="btn-primary"
          >
            Play again
          </button>
          <button
            onClick={handleGoHome}
            className="btn-secondary"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  )
}
