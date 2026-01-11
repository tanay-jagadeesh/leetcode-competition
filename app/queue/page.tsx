'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getPlayerId, setCurrentMatchId } from '@/lib/session'

type MatchMode = 'pvp' | 'bot' | null

function QueueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [waitTime, setWaitTime] = useState(0)
  const [playerId] = useState(() => getPlayerId())
  const [matchId, setMatchId] = useState<string | null>(null)
  const [status, setStatus] = useState<'searching' | 'matched'>('searching')
  const [matchMode, setMatchMode] = useState<MatchMode>(null)
  const channelRef = useRef<any>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Read mode from URL on mount
  useEffect(() => {
    const mode = searchParams.get('mode') as 'pvp' | 'bot' | null
    if (mode === 'pvp' || mode === 'bot') {
      setMatchMode(mode)
    } else {
      // Invalid or missing mode, redirect to home
      router.push('/')
    }
  }, [searchParams, router])

  // Matchmaking logic - only runs when mode is explicitly set
  useEffect(() => {
    // Don't start matchmaking until mode is set
    if (matchMode === null) return

    let timer: NodeJS.Timeout
    let isActive = true

    const tryJoinExistingMatch = async (): Promise<boolean> => {
      if (!isActive || matchMode !== 'pvp') return false

      try {
        const { data: waitingMatches } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'waiting')
          .is('player2_id', null)
          .neq('player1_id', playerId) // Don't join own match
          .order('created_at', { ascending: true })
          .limit(1)

        if (waitingMatches && waitingMatches.length > 0) {
          const match = waitingMatches[0]

          // Try to claim this match
          const { error } = await supabase
            .from('matches')
            .update({
              player2_id: playerId,
              status: 'active'
            })
            .eq('id', match.id)
            .is('player2_id', null) // Only if still available

          if (!error) {
            setStatus('matched')
            setCurrentMatchId(match.id)
            setTimeout(() => router.push(`/race/${match.id}`), 800)
            return true
          }
        }
      } catch (error) {
        console.error('Error joining match:', error)
      }

      return false
    }

    const createMatch = async () => {
      if (!isActive) return

      try {
        const { data: problems } = await supabase
          .from('problems')
          .select('id')
          .limit(10)

        if (!problems || problems.length === 0) {
          throw new Error('No problems available')
        }

        const randomProblem = problems[Math.floor(Math.random() * problems.length)]

        // For bot mode, immediately add bot as player2
        const botId = matchMode === 'bot' ? `bot_${uuidv4()}` : null

        const { data: newMatch, error: createError } = await supabase
          .from('matches')
          .insert({
            problem_id: randomProblem.id,
            player1_id: playerId,
            player2_id: botId, // null for PvP, bot ID for bot mode
            status: botId ? 'active' : 'waiting' // active immediately for bot, waiting for PvP
          })
          .select()
          .single()

        if (createError) throw createError

        setMatchId(newMatch.id)
        setCurrentMatchId(newMatch.id)

        if (matchMode === 'bot') {
          // Bot mode: immediately proceed to race
          setStatus('matched')
          setTimeout(() => router.push(`/race/${newMatch.id}`), 800)
        } else {
          // PvP mode: subscribe to match updates and poll for opponents
          const channel = supabase
            .channel(`match:${newMatch.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'matches',
                filter: `id=eq.${newMatch.id}`
              },
              (payload) => {
                const updatedMatch = payload.new as any
                if (updatedMatch.status === 'active' && updatedMatch.player2_id) {
                  setStatus('matched')
                  channel.unsubscribe()
                  if (pollingRef.current) {
                    clearInterval(pollingRef.current)
                  }
                  setTimeout(() => router.push(`/race/${newMatch.id}`), 800)
                }
              }
            )
            .subscribe()

          channelRef.current = channel

          // Start polling for new waiting matches every 3 seconds
          pollingRef.current = setInterval(async () => {
            if (status === 'matched' || !isActive) {
              if (pollingRef.current) {
                clearInterval(pollingRef.current)
              }
              return
            }

            // Check if someone else created a match we can join
            const joined = await tryJoinExistingMatch()
            if (joined && pollingRef.current) {
              clearInterval(pollingRef.current)
            }
          }, 3000)
        }
      } catch (error) {
        console.error('Error creating match:', error)
      }
    }

    const startMatchmaking = async () => {
      if (matchMode === 'bot') {
        // Bot mode: create match immediately with bot
        await createMatch()
      } else if (matchMode === 'pvp') {
        // PvP mode: try to join existing match first, then create if none found
        const joined = await tryJoinExistingMatch()
        if (!joined && isActive) {
          await createMatch()
        }
      }
    }

    startMatchmaking()

    // Timer for display
    timer = setInterval(() => {
      setWaitTime(t => t + 1)
    }, 1000)

    return () => {
      isActive = false
      clearInterval(timer)
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [playerId, router, matchMode, status])

  const handleCancel = () => {
    if (matchId) {
      supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
        .eq('player1_id', playerId)
        .eq('status', 'waiting') // Only delete if still waiting
        .then(() => router.push('/'))
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-8 py-16">
      <div className="max-w-md w-full">
        {/* Status header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-full border-2 border-border relative">
            {status === 'searching' && (
              <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-30"></div>
            )}
            <div className={`w-2 h-2 rounded-full ${status === 'searching' ? 'bg-accent' : 'bg-win'}`}></div>
          </div>

          <h1 className="text-2xl font-semibold mb-4 text-text">
            {status === 'searching' ? 'Finding opponent' : 'Match found'}
          </h1>

          {status === 'searching' ? (
            <div className="space-y-3">
              <p className="text-sub">
                {matchMode === 'bot' 
                  ? 'Setting up practice match...' 
                  : 'Searching for opponent...'}
              </p>
              {matchMode === 'pvp' && (
                <p className="text-sm text-sub font-mono">
                  {waitTime}s
                </p>
              )}
            </div>
          ) : (
            <p className="text-win font-medium">Starting match...</p>
          )}
        </div>

        {/* Mode indicator */}
        {status === 'searching' && matchMode && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                matchMode === 'bot' ? 'bg-accent/10' : 'bg-accent/10'
              }`}>
                <span className="text-lg">{matchMode === 'bot' ? '🤖' : '⚔️'}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-1">
                  {matchMode === 'bot' ? 'Practice vs Bot' : 'Quick Match (1v1)'}
                </h3>
                <p className="text-xs text-sub">
                  {matchMode === 'bot' 
                    ? 'Playing against AI opponent' 
                    : 'Matching with real players'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tips section */}
        {status === 'searching' && (
          <div className="card p-6 space-y-4 mb-8">
            <h3 className="text-xs uppercase tracking-wider text-sub font-medium">Before you start</h3>
            <ul className="space-y-3 text-sm text-sub">
              <li className="flex gap-3">
                <span className="text-sub">—</span>
                <span>Read constraints carefully before implementing</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sub">—</span>
                <span>Run tests frequently to catch errors early</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sub">—</span>
                <span>Submit only when all sample tests pass</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sub">—</span>
                <span>Use Ctrl+Enter (Cmd+Enter on Mac) to submit</span>
              </li>
            </ul>
          </div>
        )}

        {/* Cancel button */}
        {status === 'searching' && (
          <div className="text-center">
            <button
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancel search
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function QueuePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-sub">Loading...</div>
      </main>
    }>
      <QueueContent />
    </Suspense>
  )
}
