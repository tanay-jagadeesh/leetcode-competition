'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { supabase, Problem, Match } from '@/lib/supabase'
import { executeCode, TestResult } from '@/lib/code-executor'
import { getPlayerId } from '@/lib/session'

export default function RacePage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string

  const [match, setMatch] = useState<Match | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language] = useState('python')
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [opponentStatus, setOpponentStatus] = useState<'waiting' | 'coding' | 'testing' | 'submitted'>('waiting')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2'>('player1')

  const startTime = useRef<number>(Date.now())
  const timerInterval = useRef<NodeJS.Timeout>()
  const botTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadMatch()
    startTimer()

    // Keyboard shortcuts
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyboard)

    // Subscribe to match updates
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          const updatedMatch = payload.new as Match
          setMatch(updatedMatch)
          updateOpponentStatus(updatedMatch)

          // If both submitted, go to results
          if (updatedMatch.status === 'completed') {
            setTimeout(() => router.push(`/results/${matchId}`), 2000)
          }
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('keydown', handleKeyboard)
      channel.unsubscribe()
      if (timerInterval.current) clearInterval(timerInterval.current)
      if (botTimeout.current) clearTimeout(botTimeout.current)
    }
  }, [matchId, router])

  const loadMatch = async () => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*, problems(*)')
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError

      const currentMatch = matchData as any
      setMatch(currentMatch)

      // Determine player role
      const currentPlayerId = getPlayerId()
      const role = currentPlayerId === currentMatch.player2_id ? 'player2' : 'player1'
      setPlayerRole(role)

      const problemData = currentMatch.problems as Problem
      setProblem(problemData)
      setCode(problemData.starter_code[language] || '')

      // If opponent is a bot, schedule bot submission
      const opponentId = role === 'player1' ? currentMatch.player2_id : currentMatch.player1_id
      if (opponentId?.startsWith('bot_')) {
        scheduleBotSubmission(currentMatch)
      }
    } catch (error) {
      console.error('Error loading match:', error)
      router.push('/')
    }
  }

  const scheduleBotSubmission = (currentMatch: any) => {
    // Bot has variable skill level - sometimes fast, sometimes slow
    // This creates competitive matches where you can win or lose
    const botSkillMultiplier = 0.5 + Math.random() * 1.0 // 0.5x to 1.5x speed

    // Bot "codes" for 20-40 seconds (shows as coding)
    const codingDelay = (20000 + Math.random() * 20000) * botSkillMultiplier

    // Then "tests" for 5-10 seconds
    const testingDelay = codingDelay + (5000 + Math.random() * 5000)

    // Then submits after total of 30-90 seconds (more realistic range)
    const botDelay = (30000 + Math.random() * 60000) * botSkillMultiplier

    // Simulate coding phase
    setTimeout(() => {
      setOpponentStatus('coding')
    }, 3000)

    // Simulate testing phase
    setTimeout(() => {
      setOpponentStatus('testing')
    }, testingDelay)

    // Submit with actual code execution
    botTimeout.current = setTimeout(async () => {
      const botTime = Math.floor(botDelay)
      const role = playerRole === 'player1' ? 'player2' : 'player1'

      setOpponentStatus('submitted')

      // Bot always passes (submits correct solution)
      // Update the match with bot's results
      await supabase
        .from('matches')
        .update({
          [`${role}_time`]: botTime,
          [`${role}_passed`]: true,
        })
        .eq('id', matchId)

      // Check if player has also submitted to determine winner
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (updatedMatch) {
        const bothSubmitted =
          updatedMatch.player1_passed !== null &&
          updatedMatch.player2_passed !== null

        if (bothSubmitted) {
          // Determine winner based on time and correctness
          let winner: 'player1' | 'player2' | 'draw' = 'draw'

          if (updatedMatch.player1_passed && !updatedMatch.player2_passed) {
            winner = 'player1'
          } else if (!updatedMatch.player1_passed && updatedMatch.player2_passed) {
            winner = 'player2'
          } else if (updatedMatch.player1_passed && updatedMatch.player2_passed) {
            winner = updatedMatch.player1_time! < updatedMatch.player2_time! ? 'player1' : 'player2'
          }

          await supabase
            .from('matches')
            .update({
              status: 'completed',
              winner,
            })
            .eq('id', matchId)
        }
      }
    }, botDelay)
  }

  const startTimer = () => {
    startTime.current = Date.now()
    timerInterval.current = setInterval(() => {
      setTimer(Date.now() - startTime.current)
    }, 100)
  }

  const updateOpponentStatus = (currentMatch: Match) => {
    const opponentRole = playerRole === 'player1' ? 'player2' : 'player1'
    const opponentTime = currentMatch[`${opponentRole}_time`]
    const opponentPassed = currentMatch[`${opponentRole}_passed`]

    if (opponentPassed !== null) {
      setOpponentStatus('submitted')
    } else if (opponentTime !== null) {
      setOpponentStatus('testing')
    } else {
      setOpponentStatus('coding')
    }
  }

  const handleRunTests = async () => {
    if (!problem || isRunning) return

    setIsRunning(true)
    setOpponentStatus('testing')

    try {
      // Run against sample test cases only
      const sampleTests = problem.test_cases.filter(tc => tc.is_sample)
      const result = await executeCode(code, language, sampleTests)
      setTestResults(result.results)
    } catch (error: any) {
      setTestResults([{
        passed: false,
        input: {},
        expected: null,
        actual: null,
        error: error.message || 'Execution error'
      }])
    } finally {
      setIsRunning(false)
      setOpponentStatus('coding')
    }
  }

  const handleSubmit = async () => {
    if (!problem || !match || isSubmitting || hasSubmitted) return

    setIsSubmitting(true)

    try {
      // Run against ALL test cases
      const result = await executeCode(code, language, problem.test_cases)
      setTestResults(result.results)

      const currentTime = Date.now() - startTime.current
      const allPassed = result.allPassed

      // Update match with results
      const { error } = await supabase
        .from('matches')
        .update({
          [`${playerRole}_time`]: currentTime,
          [`${playerRole}_passed`]: allPassed,
        })
        .eq('id', matchId)

      if (error) throw error

      setHasSubmitted(true)

      // Check if match is complete
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (updatedMatch) {
        const bothSubmitted =
          updatedMatch.player1_passed !== null &&
          updatedMatch.player2_passed !== null

        if (bothSubmitted) {
          // Determine winner
          let winner: 'player1' | 'player2' | 'draw' = 'draw'

          if (updatedMatch.player1_passed && !updatedMatch.player2_passed) {
            winner = 'player1'
          } else if (!updatedMatch.player1_passed && updatedMatch.player2_passed) {
            winner = 'player2'
          } else if (updatedMatch.player1_passed && updatedMatch.player2_passed) {
            winner = updatedMatch.player1_time! < updatedMatch.player2_time! ? 'player1' : 'player2'
          }

          await supabase
            .from('matches')
            .update({
              status: 'completed',
              winner,
            })
            .eq('id', matchId)

          // Add to leaderboard if passed
          if (allPassed) {
            await supabase
              .from('leaderboard')
              .insert({
                problem_id: problem.id,
                username: `Player_${playerRole}`,
                time_ms: currentTime,
                language,
              })
          }

          setTimeout(() => router.push(`/results/${matchId}`), 2000)
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  if (!problem || !match) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-2xl text-white">Loading race...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-300 flex flex-col">
      {/* Top Bar */}
      <div className="bg-dark-200 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-3xl font-bold text-gradient">
            {formatTime(timer)}
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              opponentStatus === 'coding' ? 'bg-blue-400 animate-pulse' :
              opponentStatus === 'testing' ? 'bg-yellow-400 animate-pulse' :
              opponentStatus === 'submitted' ? 'bg-green-400' : 'bg-gray-500'
            }`}></div>
            <span className="text-gray-300">
              Opponent: {
                opponentStatus === 'coding' ? '💻 Coding...' :
                opponentStatus === 'testing' ? '🧪 Testing...' :
                opponentStatus === 'submitted' ? '✓ Submitted!' : 'Waiting...'
              }
            </span>
          </div>
        </div>
        {hasSubmitted && (
          <div className="text-yellow-400 font-semibold">
            ⏳ Waiting for opponent...
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Statement */}
        <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{problem.title}</h1>
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              problem.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
              problem.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              {problem.difficulty.toUpperCase()}
            </span>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap mb-6">
              {problem.description}
            </div>

            <h3 className="text-xl font-bold text-white mb-3">Constraints</h3>
            <div className="text-gray-300 whitespace-pre-wrap mb-6">
              {problem.constraints}
            </div>

            <h3 className="text-xl font-bold text-white mb-3">Sample Test Cases</h3>
            <div className="space-y-3">
              {problem.test_cases.filter(tc => tc.is_sample).map((tc, idx) => (
                <div key={idx} className="bg-dark-200 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Input:</div>
                  <code className="text-green-400">{JSON.stringify(tc.input)}</code>
                  <div className="text-sm text-gray-400 mt-2 mb-1">Expected Output:</div>
                  <code className="text-blue-400">{JSON.stringify(tc.expected_output)}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-3">Test Results</h3>
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      result.passed
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-red-900/20 border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                        {result.passed ? '✓' : '✗'}
                      </span>
                      <span className="font-semibold text-white">
                        Test {idx + 1}
                      </span>
                    </div>
                    {!result.passed && (
                      <>
                        <div className="text-sm text-gray-400">Input: {JSON.stringify(result.input)}</div>
                        <div className="text-sm text-gray-400">Expected: {JSON.stringify(result.expected)}</div>
                        <div className="text-sm text-gray-400">Got: {result.error || JSON.stringify(result.actual)}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Code Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Bottom Bar */}
          <div className="bg-dark-200 border-t border-gray-700 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Language: Python
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRunTests}
                disabled={isRunning || hasSubmitted}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Running...' : 'Run Tests'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasSubmitted}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold glow-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Submitted!' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
