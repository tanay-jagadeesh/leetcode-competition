'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

  useEffect(() => {
    loadMatch()
    startTimer()

    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
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
          setIsLoadingHint(true)
          const hint = await getHint(
            problem.title,
            problem.description,
            code,
            firstFailure
          )
          setAiHint(hint)
          setIsLoadingHint(false)
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

  const handleSubmit = async () => {
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
          // Determine winner
          let winner: 'player1' | 'player2' | 'draw' = 'draw'

          if (updatedMatch.player1_passed && !updatedMatch.player2_passed) {
            winner = 'player1'
          } else if (!updatedMatch.player1_passed && updatedMatch.player2_passed) {
            winner = 'player2'
          } else if (updatedMatch.player1_passed && updatedMatch.player2_passed) {
            // Both passed - winner is the one with faster time
            if (updatedMatch.player1_time && updatedMatch.player2_time) {
              winner = updatedMatch.player1_time < updatedMatch.player2_time ? 'player1' : 'player2'
            } else {
              winner = 'draw'
            }
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
  }

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
        content: response,
        timestamp: Date.now()
      }

      setChatMessages(prev => [...prev, assistantMessage])
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

  return (
    <div className="h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-6">
          <div className="font-mono text-base font-medium text-text">{formatTime(timer)}</div>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`status-dot ${
              opponentStatus === 'coding' ? 'bg-accent' :
              opponentStatus === 'testing' ? 'bg-warning' :
              opponentStatus === 'submitted' ? 'bg-win' : 'bg-sub'
            }`}></span>
            <span className="text-sub">Opponent: {opponentStatusText[opponentStatus]}</span>
          </div>
        </div>
        {hasSubmitted && (
          <div className="text-sm text-warning font-medium">Waiting for opponent</div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Problem */}
        <div className={`${isChatOpen ? 'w-1/3' : 'w-1/2'} border-r border-border overflow-y-auto transition-all duration-300 bg-card`}>
          <div className="p-10 max-w-2xl">
            {/* Problem header */}
            <div className="mb-10">
              <h1 className="text-2xl font-semibold mb-4 text-text">{problem.title}</h1>
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded ${
                problem.difficulty === 'easy' ? 'bg-win/10 text-win' :
                problem.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-lose/10 text-lose'
              }`}>
                {problem.difficulty}
              </span>
            </div>

            {/* Description */}
            <div className="space-y-8 text-sm text-sub leading-relaxed">
              <div className="whitespace-pre-wrap">
                {problem.description}
              </div>

              <div>
                <h3 className="text-text mb-3 text-xs uppercase tracking-wider font-medium">Constraints</h3>
                <div className="whitespace-pre-wrap">
                  {problem.constraints}
                </div>
              </div>

              <div>
                <h3 className="text-text mb-4 text-xs uppercase tracking-wider font-medium">Examples</h3>
                <div className="space-y-3">
                  {problem.test_cases.filter(tc => tc.is_sample).map((tc, idx) => (
                    <div key={idx} className="card p-4 font-mono text-xs space-y-2 bg-bg">
                      <div>
                        <span className="text-sub">Input:</span>{' '}
                        <span className="text-text">{JSON.stringify(tc.input)}</span>
                      </div>
                      <div>
                        <span className="text-sub">Output:</span>{' '}
                        <span className="text-text">{JSON.stringify(tc.expected_output)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Hint */}
            {(aiHint || isLoadingHint) && (
              <div className="mt-10 card p-5 border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3">
                  <span className="text-accent text-sm">→</span>
                  <div className="flex-1 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-accent font-medium">Hint</div>
                    {isLoadingHint ? (
                      <div className="text-sm text-sub italic">Generating hint...</div>
                    ) : (
                      <p className="text-sm text-sub leading-relaxed">{aiHint}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Test results */}
            {testResults.length > 0 && (
              <div className="mt-10 space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`card p-4 border ${
                      result.passed
                        ? 'border-win/20 bg-win/5'
                        : 'border-lose/20 bg-lose/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-sub font-medium">Test {idx + 1}</span>
                      <span className={`text-xs font-medium ${
                        result.passed ? 'text-win' : 'text-lose'
                      }`}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    {!result.passed && (
                      <div className="font-mono text-xs text-sub space-y-1">
                        <div>Input: {JSON.stringify(result.input)}</div>
                        <div>Expected: {JSON.stringify(result.expected)}</div>
                        <div>Got: {result.error || JSON.stringify(result.actual)}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center panel - Editor */}
        <div className={`${isChatOpen ? 'w-1/3' : 'w-1/2'} flex flex-col transition-all duration-300 bg-card`}>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                fontFamily: 'ui-monospace, monospace',
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Editor footer */}
          <div className="border-t border-border p-5 flex items-center justify-between bg-bg">
            <div className="flex items-center gap-4">
              <span className="text-xs text-sub">Python</span>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="text-xs text-accent hover:text-[#2E4BD9] transition-colors font-medium"
              >
                {isChatOpen ? '← Close AI' : 'AI Assistant →'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRunTests}
                disabled={isRunning || hasSubmitted}
                className="btn-secondary text-sm"
              >
                {isRunning ? 'Running...' : 'Run tests'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasSubmitted}
                className="btn-primary text-sm"
              >
                {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Submitted' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - AI Chat */}
        {isChatOpen && (
          <div className="w-1/3 border-l border-border flex flex-col bg-card">
            {/* Chat header */}
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-text">AI Coding Assistant</h3>
                  <p className="text-xs text-sub mt-1">Ask questions about the problem</p>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-sub hover:text-text transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-3xl mb-4">💬</div>
                  <p className="text-sm text-sub mb-2">No messages yet</p>
                  <p className="text-xs text-sub">
                    Ask me anything about the problem
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-accent text-white'
                            : 'bg-bg border border-border text-text'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSendingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-bg border border-border rounded-lg px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat input */}
            <div className="border-t border-border p-5 bg-bg">
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
                  placeholder="Ask a question..."
                  className="flex-1 input"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSendingMessage}
                  className="btn-primary"
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-sub mt-3">
                Press Enter to send
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
