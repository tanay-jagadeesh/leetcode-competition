'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import confetti from 'canvas-confetti'
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

      // Determine player role
      const currentPlayerId = getPlayerId()
      const role = currentPlayerId === currentMatch.player2_id ? 'player2' : 'player1'
      setPlayerRole(role)

      const won = currentMatch.winner === role
      setDidWin(won)

      // Trigger confetti if won
      if (won) {
        triggerConfetti()
      }

      // Load leaderboard
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

  const triggerConfetti = () => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
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
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-2xl text-white">Loading results...</div>
      </div>
    )
  }

  const playerTime = match[`${playerRole}_time`]
  const playerPassed = match[`${playerRole}_passed`]
  const opponentRole = playerRole === 'player1' ? 'player2' : 'player1'
  const opponentTime = match[`${opponentRole}_time`]
  const opponentPassed = match[`${opponentRole}_passed`]

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Result Banner */}
        <div className="text-center mb-12 animate-slide-up">
          {didWin ? (
            <>
              <div className="text-8xl mb-4">🏆</div>
              <h1 className="text-6xl font-bold mb-4 text-gradient">
                YOU WIN!
              </h1>
              <p className="text-2xl text-green-400">
                Congratulations! You solved it faster!
              </p>
            </>
          ) : match.winner === 'draw' ? (
            <>
              <div className="text-8xl mb-4">🤝</div>
              <h1 className="text-6xl font-bold mb-4 text-yellow-400">
                DRAW
              </h1>
              <p className="text-2xl text-gray-300">
                Neither player solved the problem correctly
              </p>
            </>
          ) : (
            <>
              <div className="text-8xl mb-4">💪</div>
              <h1 className="text-6xl font-bold mb-4 text-gray-300">
                GOOD EFFORT!
              </h1>
              <p className="text-2xl text-gray-400">
                Your opponent was faster this time
              </p>
            </>
          )}
        </div>

        {/* Problem Info */}
        <div className="bg-dark-200 p-6 rounded-xl border-gradient mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{problem.title}</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            problem.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
            problem.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
            'bg-red-900 text-red-300'
          }`}>
            {problem.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Time Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Your Result */}
          <div className={`p-6 rounded-xl border-2 ${
            didWin ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-dark-200'
          }`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">YOUR TIME</div>
              <div className="text-4xl font-bold text-white mb-3">
                {formatTime(playerTime)}
              </div>
              <div className={`text-sm font-semibold ${
                playerPassed ? 'text-green-400' : 'text-red-400'
              }`}>
                {playerPassed ? '✓ All tests passed' : '✗ Some tests failed'}
              </div>
            </div>
          </div>

          {/* Opponent Result */}
          <div className={`p-6 rounded-xl border-2 ${
            !didWin && match.winner !== 'draw' ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-dark-200'
          }`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">OPPONENT TIME</div>
              <div className="text-4xl font-bold text-white mb-3">
                {formatTime(opponentTime)}
              </div>
              <div className={`text-sm font-semibold ${
                opponentPassed ? 'text-green-400' : 'text-red-400'
              }`}>
                {opponentPassed ? '✓ All tests passed' : '✗ Some tests failed'}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-dark-200 p-6 rounded-xl border-gradient mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              🏆 Leaderboard - {problem.title}
            </h2>
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-dark-100 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-white font-semibold">{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{entry.language}</span>
                    <span className="text-green-400 font-mono">
                      {formatTime(entry.time_ms)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white text-xl font-bold rounded-xl glow-button"
          >
            Play Again
          </button>
          <button
            onClick={handleGoHome}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-xl font-bold rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>

        {/* Fun Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-dark-200 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {playerPassed ? problem.test_cases.length : 0}/{problem.test_cases.length}
            </div>
            <div className="text-sm text-gray-400">Tests Passed</div>
          </div>
          <div className="bg-dark-200 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {playerTime ? Math.floor(playerTime / 1000) : 0}s
            </div>
            <div className="text-sm text-gray-400">Total Time</div>
          </div>
          <div className="bg-dark-200 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {problem.difficulty === 'easy' ? '+10' :
               problem.difficulty === 'medium' ? '+25' : '+50'} XP
            </div>
            <div className="text-sm text-gray-400">Points Earned</div>
          </div>
        </div>
      </div>
    </main>
  )
}
