'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Editor from '@monaco-editor/react'
import { supabase, Problem, Match } from '@/lib/supabase'
import { executeCode, TestResult } from '@/lib/code-executor'
import { getPlayerId } from '@/lib/session'
import { getHint, chatWithAI } from '@/lib/ai-hints'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

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
  const [aiHint, setAiHint] = useState<string>('')
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [opponentStatus, setOpponentStatus] = useState<'waiting' | 'coding' | 'testing' | 'submitted'>('waiting')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2'>('player1')
  const [userPoints, setUserPoints] = useState<number | null>(null)
  const [hintsAvailable, setHintsAvailable] = useState<number>(0)

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const startTime = useRef<number>(Date.now())
  const timerInterval = useRef<NodeJS.Timeout>()
  const botTimeout = useRef<NodeJS.Timeout>()
  const completionCheckInterval = useRef<NodeJS.Timeout>()
  const handleSubmitRef = useRef<() => Promise<void>>()

  useEffect(() => {
    loadMatch()
    startTimer()

    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmitRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyboard)

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

          // Handle match completion - redirect to results
          if (updatedMatch.status === 'completed') {
            // Clear polling interval if it exists
            if (completionCheckInterval.current) {
              clearInterval(completionCheckInterval.current)
            }
            // Small delay to show final state
            setTimeout(() => {
              router.push(`/results/${matchId}`)
            }, 1500)
          }
        }
      )
      .subscribe()

    // Fallback: Poll for match completion every 2 seconds
    // This ensures we catch completion even if real-time subscription fails
    completionCheckInterval.current = setInterval(async () => {
      try {
        const { data: currentMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single()

        if (currentMatch && currentMatch.status === 'completed') {
          if (completionCheckInterval.current) {
            clearInterval(completionCheckInterval.current)
          }
          router.push(`/results/${matchId}`)
        }
      } catch (error) {
        // Silently fail - polling is just a fallback
        console.error('Error checking match completion:', error)
      }
    }, 2000)

    return () => {
      window.removeEventListener('keydown', handleKeyboard)
      channel.unsubscribe()
      if (timerInterval.current) clearInterval(timerInterval.current)
      if (botTimeout.current) clearTimeout(botTimeout.current)
      if (completionCheckInterval.current) clearInterval(completionCheckInterval.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const currentPlayerId = getPlayerId()
      const role = currentPlayerId === currentMatch.player2_id ? 'player2' : 'player1'
      setPlayerRole(role)

      const problemData = currentMatch.problems as Problem
      setProblem(problemData)
      setCode(problemData.starter_code[language] || '')

      // Load user points for hint system
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('id', currentPlayerId)
        .single()

      if (userProfile) {
        setUserPoints(userProfile.total_points)
        setHintsAvailable(Math.floor(userProfile.total_points / 5))
      }

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
    const botSkillMultiplier = 0.5 + Math.random() * 1.0
    const codingDelay = (20000 + Math.random() * 20000) * botSkillMultiplier
    const testingDelay = codingDelay + (5000 + Math.random() * 5000)
    const botDelay = (30000 + Math.random() * 60000) * botSkillMultiplier

    setTimeout(() => setOpponentStatus('coding'), 3000)
    setTimeout(() => setOpponentStatus('testing'), testingDelay)

    botTimeout.current = setTimeout(async () => {
      const botTime = Math.floor(botDelay)
      const role = playerRole === 'player1' ? 'player2' : 'player1'
      setOpponentStatus('submitted')

      await supabase
        .from('matches')
        .update({
          [`${role}_time`]: botTime,
          [`${role}_passed`]: true,
        })
        .eq('id', matchId)

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
    setAiHint('')

    try {
      const sampleTests = problem.test_cases.filter(tc => tc.is_sample)
      const result = await executeCode(code, language, sampleTests)
      setTestResults(result.results)

      if (!result.allPassed) {
        const firstFailure = result.results.find(r => !r.passed)
        if (firstFailure) {
          if (hintsAvailable > 0) {
            setIsLoadingHint(true)
            try {
              const hint = await getHint(
                problem.title,
                problem.description,
                code,
                firstFailure
              )
              setAiHint(hint)
              // Update hints after using one (points deducted on server)
              if (userPoints !== null && userPoints >= 5) {
                const newPoints = userPoints - 5
                setUserPoints(newPoints)
                setHintsAvailable(Math.floor(newPoints / 5))
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Failed to get hint'
              setAiHint(errorMsg)
              // If error is about insufficient points, update state
              if (errorMsg.includes('Not enough points')) {
                setHintsAvailable(0)
              }
            } finally {
              setIsLoadingHint(false)
            }
          } else {
            setAiHint(`💡 You need 5 points to get a hint. You currently have ${userPoints || 0} points. Win matches to earn more points!`)
          }
        }
      }
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

  const handleSubmit = useCallback(async () => {
    if (!problem || !match || isSubmitting || hasSubmitted) return

    setIsSubmitting(true)

    try {
      const result = await executeCode(code, language, problem.test_cases)
      setTestResults(result.results)

      const currentTime = Date.now() - startTime.current
      const allPassed = result.allPassed

      const { error } = await supabase
        .from('matches')
        .update({
          [`${playerRole}_time`]: currentTime,
          [`${playerRole}_passed`]: allPassed,
        })
        .eq('id', matchId)

      if (error) throw error

      setHasSubmitted(true)

      // Fetch the latest match state after our update
      const { data: updatedMatch, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) {
        console.error('Error fetching updated match:', fetchError)
        return
      }

      if (updatedMatch) {
        // Check if both players have submitted (both have non-null passed values AND times)
        const bothSubmitted =
          updatedMatch.player1_passed !== null &&
          updatedMatch.player1_time !== null &&
          updatedMatch.player2_passed !== null &&
          updatedMatch.player2_time !== null &&
          updatedMatch.status !== 'completed' // Only complete if not already completed

        if (bothSubmitted) {
          // Determine winner - ONLY players who passed tests can win
          let winner: 'player1' | 'player2' | 'draw' = 'draw'

          if (updatedMatch.player1_passed && !updatedMatch.player2_passed) {
            // Player 1 passed, player 2 didn't - player 1 wins
            winner = 'player1'
          } else if (!updatedMatch.player1_passed && updatedMatch.player2_passed) {
            // Player 2 passed, player 1 didn't - player 2 wins
            winner = 'player2'
          } else if (updatedMatch.player1_passed && updatedMatch.player2_passed) {
            // Both passed - winner is the one with faster time
            if (updatedMatch.player1_time && updatedMatch.player2_time) {
              winner = updatedMatch.player1_time < updatedMatch.player2_time ? 'player1' : 'player2'
            } else {
              winner = 'draw'
            }
          } else {
            // Neither player passed - it's a draw
            winner = 'draw'
          }

          // Update match status to completed (only if not already completed)
          const { error: completeError } = await supabase
            .from('matches')
            .update({
              status: 'completed',
              winner,
            })
            .eq('id', matchId)
            .eq('status', 'active') // Only update if still active (prevents race condition)

          if (completeError) {
            console.error('Error completing match:', completeError)
          }

          // Add to leaderboard if solution passed
          if (allPassed) {
            try {
              await supabase
                .from('leaderboard')
                .insert({
                  problem_id: problem.id,
                  username: `Player_${playerRole}`,
                  time_ms: currentTime,
                  language,
                })
            } catch (leaderboardError) {
              // Leaderboard insert is not critical, log but don't fail
              console.error('Error adding to leaderboard:', leaderboardError)
            }
          }

          // Redirect will be handled by the subscription, but add a fallback
          setTimeout(() => {
            router.push(`/results/${matchId}`)
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [problem, match, isSubmitting, hasSubmitted, code, language, playerRole, matchId, router])

  // Update ref whenever handleSubmit changes
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !problem || isSendingMessage) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now()
    }

    setChatMessages(prev => [...prev, userMessage])
    const inputValue = chatInput.trim()
    setChatInput('')
    setIsSendingMessage(true)

    try {
      const response = await chatWithAI(
        problem.title,
        problem.description,
        code,
        inputValue,
        chatMessages
      )

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        timestamp: Date.now()
      }

      setChatMessages(prev => [...prev, assistantMessage])

      // Update hints available after using a hint (5 points per hint)
      if (response.pointsRemaining !== undefined) {
        setUserPoints(response.pointsRemaining)
        setHintsAvailable(response.hintsAvailable || 0)
      } else if (userPoints !== null && userPoints >= 5) {
        // Fallback: manually calculate if API didn't return updated values
        const newPoints = userPoints - 5
        setUserPoints(newPoints)
        setHintsAvailable(Math.floor(newPoints / 5))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : '❌ An error occurred. Please try again.'
      
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now()
      }

      setChatMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  if (!problem || !match) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">Loading match...</div>
      </div>
    )
  }

  const opponentStatusText = {
    waiting: 'Waiting',
    coding: 'Coding',
    testing: 'Testing',
    submitted: 'Submitted'
  }

  // Calculate if we're leading or lagging (simplified - in real app, compare progress)
  const isLeading = opponentStatus === 'waiting' || opponentStatus === 'coding'
  const isLagging = opponentStatus === 'submitted' && !hasSubmitted

  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden">
      {/* Enhanced Top Bar with Competitive Feel */}
      <header className="border-b border-border bg-card">
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="grid grid-cols-4 items-center gap-8">
            {/* Left: Timer - Most Prominent */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-sub font-medium mb-1">Time</div>
                <div className="font-mono text-3xl font-bold text-text tabular-nums">
                  {formatTime(timer)}
                </div>
              </div>
              {timer > 0 && (
                <div className="w-1 h-8 bg-accent rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Points Display */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-sub font-medium mb-1">Points</div>
                <div className="font-mono text-2xl font-bold text-accent tabular-nums">
                  {userPoints !== null ? userPoints : '...'}
                </div>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-sub font-medium mb-1">Hints</div>
                <div className="font-mono text-2xl font-bold text-text tabular-nums">
                  {hintsAvailable}
                </div>
              </div>
            </div>

            {/* Center: Competitive Status */}
            <div className="flex items-center justify-center gap-6 col-span-2">
              {/* Opponent Indicator */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${
                    opponentStatus === 'coding' ? 'bg-accent animate-pulse' :
                    opponentStatus === 'testing' ? 'bg-warning animate-pulse' :
                    opponentStatus === 'submitted' ? 'bg-win' : 'bg-sub'
                  }`}></div>
                  {opponentStatus === 'coding' && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent animate-ping opacity-75"></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase tracking-wider text-sub font-medium">Opponent</div>
                  <div className="text-sm font-semibold text-text">{opponentStatusText[opponentStatus]}</div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="text-sub text-xs font-medium">VS</div>

              {/* Your Status */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  hasSubmitted ? 'bg-win' : isRunning ? 'bg-warning animate-pulse' : 'bg-accent'
                }`}></div>
                <div className="flex flex-col">
                  <div className="text-[10px] uppercase tracking-wider text-sub font-medium">You</div>
                  <div className="text-sm font-semibold text-text">
                    {hasSubmitted ? 'Submitted' : isRunning ? 'Testing' : 'Coding'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Status Message */}
            <div className="flex justify-end">
              {hasSubmitted && (
                <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-warning">Waiting for opponent</span>
                </div>
              )}
              {isLagging && (
                <div className="flex items-center gap-2 px-4 py-2 bg-lose/10 border border-lose/20 rounded-lg">
                  <span className="text-xs font-medium text-lose">Opponent finished first</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Panel - Problem (Editorial Layout) */}
        <div className={`${isChatOpen ? 'col-span-3' : 'col-span-4'} border-r border-border overflow-y-auto bg-card transition-all duration-300`}>
          <div className="max-w-2xl mx-auto px-10 py-12">
            {/* Problem Header - Enhanced */}
            <div className="mb-12">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-text leading-tight tracking-tight">
                  {problem.title}
                </h1>
                <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                  problem.difficulty === 'easy' ? 'bg-win/10 text-win border border-win/20' :
                  problem.difficulty === 'medium' ? 'bg-warning/10 text-warning border border-warning/20' :
                  'bg-lose/10 text-lose border border-lose/20'
                }`}>
                  {problem.difficulty}
                </span>
              </div>
            </div>

            {/* Description - Editorial Style */}
            <div className="space-y-10">
              <div className="prose prose-sm max-w-none">
                <div className="text-base text-text leading-relaxed whitespace-pre-wrap font-[450]">
                  {problem.description}
                </div>
              </div>

              <div>
                <h3 className="text-text mb-4 text-xs uppercase tracking-widest font-bold">Constraints</h3>
                <div className="whitespace-pre-wrap text-sm text-sub leading-relaxed font-mono bg-bg p-4 rounded-lg border border-border">
                  {problem.constraints}
                </div>
              </div>

              <div>
                <h3 className="text-text mb-5 text-xs uppercase tracking-widest font-bold">Examples</h3>
                <div className="space-y-4">
                  {problem.test_cases.filter(tc => tc.is_sample).map((tc, idx) => (
                    <div key={idx} className="card p-5 font-mono text-sm space-y-3 bg-bg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-sub uppercase tracking-wider">Example {idx + 1}</span>
                      </div>
                      <div>
                        <span className="text-sub font-medium">Input:</span>
                        <div className="mt-1 text-text font-mono">{JSON.stringify(tc.input)}</div>
                      </div>
                      <div>
                        <span className="text-sub font-medium">Output:</span>
                        <div className="mt-1 text-text font-mono">{JSON.stringify(tc.expected_output)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Hint - Enhanced */}
            {(aiHint || isLoadingHint) && (
              <div className="mt-12 card p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-lg">💡</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-accent font-bold">Hint</div>
                    {isLoadingHint ? (
                      <div className="text-sm text-sub italic flex items-center gap-2">
                        <span className="inline-block w-1 h-1 bg-accent rounded-full animate-pulse"></span>
                        Generating hint...
                      </div>
                    ) : (
                      <p className="text-sm text-text leading-relaxed font-[450]">{aiHint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Test Results - Enhanced */}
            {testResults.length > 0 && (
              <div className="mt-12 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">Test Results</h3>
                  <div className={`text-sm font-semibold ${
                    testResults.every(r => r.passed) ? 'text-win' : 'text-lose'
                  }`}>
                    {testResults.filter(r => r.passed).length}/{testResults.length} passed
                  </div>
                </div>
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`card p-5 border-2 transition-all ${
                      result.passed
                        ? 'border-win/30 bg-win/5'
                        : 'border-lose/30 bg-lose/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          result.passed ? 'bg-win text-white' : 'bg-lose text-white'
                        }`}>
                          {result.passed ? '✓' : '✗'}
                        </div>
                        <span className="text-sm font-semibold text-text">Test Case {idx + 1}</span>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        result.passed ? 'text-win' : 'text-lose'
                      }`}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    {!result.passed && (
                      <div className="font-mono text-xs text-sub space-y-2 bg-bg p-3 rounded border border-border">
                        <div><span className="font-semibold">Input:</span> {JSON.stringify(result.input)}</div>
                        <div><span className="font-semibold">Expected:</span> {JSON.stringify(result.expected)}</div>
                        <div><span className="font-semibold">Got:</span> {result.error || JSON.stringify(result.actual)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Code Editor (Primary Focus) */}
        <div className={`${isChatOpen ? 'col-span-5' : 'col-span-8'} flex flex-col transition-all duration-300 bg-card border-r border-border`}>
          {/* Editor Header */}
          <div className="border-b border-border px-6 py-3 bg-bg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-sub uppercase tracking-wider">Code Editor</span>
              <span className="text-xs text-sub font-mono">Python</span>
            </div>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-xs text-accent hover:text-[#2E4BD9] transition-colors font-semibold flex items-center gap-2"
            >
              {isChatOpen ? (
                <>
                  <span>←</span> Close AI
                </>
              ) : (
                <>
                  AI Assistant <span>→</span>
                </>
              )}
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden relative">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                fontFamily: 'ui-monospace, "SF Mono", Monaco, monospace',
                padding: { top: 20, bottom: 20 },
                wordWrap: 'on',
                lineHeight: 24,
              }}
            />
          </div>

          {/* Editor Footer - Enhanced */}
          <div className="border-t border-border px-6 py-4 bg-bg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {testResults.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border">
                    <span className="text-xs font-semibold text-text">
                      {testResults.filter(r => r.passed).length}/{testResults.length} passed
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRunTests}
                  disabled={isRunning || hasSubmitted}
                  className="btn-secondary text-sm px-5 py-2.5 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isRunning ? (
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                      Running...
                    </span>
                  ) : (
                    'Run Tests'
                  )}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasSubmitted}
                  className="btn-primary text-sm px-6 py-2.5 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                      Submitting...
                    </span>
                  ) : hasSubmitted ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-win rounded-full"></span>
                      Submitted
                    </span>
                  ) : (
                    'Submit Solution'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Assistant with Avatar */}
        {isChatOpen && (
          <div className="col-span-4 border-l border-border flex flex-col bg-card">
            {/* Chat Header with Avatar */}
            <div className="border-b border-border p-6 bg-gradient-to-br from-accent/5 to-accent/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* AI Avatar - Custom avatar image */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/40 flex items-center justify-center overflow-hidden shadow-sm">
                      <Image
                        src="/ai-avatar.png"
                        alt="AI Coding Mentor"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    {/* Speaking indicator */}
                    {isSendingMessage && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-win rounded-full border-2 border-card animate-pulse shadow-sm"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text">AI Coding Mentor</h3>
                    <p className="text-xs text-sub mt-0.5">Ask me anything about the problem</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-sub hover:text-text transition-colors p-1.5 hover:bg-bg rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages - Enhanced */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {chatMessages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-accent/40 flex items-center justify-center shadow-sm overflow-hidden">
                    <Image
                      src="/ai-avatar.png"
                      alt="AI Coding Mentor"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm font-semibold text-text mb-2">Start a conversation</p>
                  <p className="text-xs text-sub">
                    Ask me anything about the problem or approach
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center shadow-sm mt-1 overflow-hidden">
                          <Image
                            src="/ai-avatar.png"
                            alt="AI Assistant"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'bg-bg border border-border text-text shadow-sm'
                        }`}
                      >
                        <p className="leading-relaxed font-[450]">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mt-1">
                          <span className="text-accent text-xs font-bold">You</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex justify-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center shadow-sm overflow-hidden">
                        <Image
                          src="/ai-avatar.png"
                          alt="AI Assistant"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="bg-bg border border-border rounded-xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input - Enhanced */}
            <div className="border-t border-border p-6 bg-bg">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask a question about the problem..."
                  className="flex-1 input text-sm"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="btn-primary px-5 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-sub mt-3 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">Enter</kbd> to send
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
