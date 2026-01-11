'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { getPlayerId, setCurrentMatchId } from '@/lib/session'

export default function QueuePage() {
  const router = useRouter()
  const [waitTime, setWaitTime] = useState(0)
  const [playerId] = useState(() => getPlayerId())
  const [matchId, setMatchId] = useState<string | null>(null)
  const [status, setStatus] = useState<'searching' | 'matched'>('searching')
  const [allowBotMatch, setAllowBotMatch] = useState(true)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let botTimeout: NodeJS.Timeout
    let channel: any

    const findMatch = async () => {
      try {
        const { data: waitingMatches } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'waiting')
          .is('player2_id', null)
          .order('created_at', { ascending: true })
          .limit(1)

        if (waitingMatches && waitingMatches.length > 0) {
          const match = waitingMatches[0]
          const { error } = await supabase
            .from('matches')
            .update({
              player2_id: playerId,
              status: 'active'
            })
            .eq('id', match.id)

          if (!error) {
            setStatus('matched')
            setCurrentMatchId(match.id)
            setTimeout(() => router.push(`/race/${match.id}`), 800)
            return
          }
        }

        const { data: problems } = await supabase
          .from('problems')
          .select('id')
          .limit(10)

        if (!problems || problems.length === 0) {
          throw new Error('No problems available')
        }

        const randomProblem = problems[Math.floor(Math.random() * problems.length)]

        const { data: newMatch, error: createError } = await supabase
          .from('matches')
          .insert({
            problem_id: randomProblem.id,
            player1_id: playerId,
            status: 'waiting'
          })
          .select()
          .single()

        if (createError) throw createError

        setMatchId(newMatch.id)
        setCurrentMatchId(newMatch.id)

        channel = supabase
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
                setTimeout(() => router.push(`/race/${newMatch.id}`), 800)
              }
            }
          )
          .subscribe()

        // Only set bot timeout if user allows bot matches
        if (allowBotMatch) {
          botTimeout = setTimeout(async () => {
            const botId = `bot_${uuidv4()}`
            try {
              await supabase
                .from('matches')
                .update({
                  player2_id: botId,
                  status: 'active'
                })
                .eq('id', newMatch.id)
            } catch (err) {
              console.error('Bot match failed:', err)
            }
            setStatus('matched')
            setCurrentMatchId(newMatch.id)
            setTimeout(() => router.push(`/race/${newMatch.id}`), 800)
          }, 30000)
        }

      } catch (error) {
        console.error('Error finding match:', error)
      }
    }

    findMatch()

    timer = setInterval(() => {
      setWaitTime(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(timer)
      clearTimeout(botTimeout)
      if (channel) channel.unsubscribe()
    }
  }, [playerId, router, allowBotMatch])

  const handleCancel = () => {
    if (matchId) {
      supabase
        .from('matches')
        .delete()
        .eq('id', matchId)
        .eq('player1_id', playerId)
        .then(() => router.push('/'))
    } else {
      router.push('/')
    }
  }

  return (
    <main className="min-h-screen bg-base flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        {/* Status header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full border-2 border-accent relative">
            <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20"></div>
            <div className="w-2 h-2 bg-accent rounded-full"></div>
          </div>

          <h1 className="text-2xl mb-3">
            {status === 'searching' ? 'Finding opponent' : 'Match found'}
          </h1>

          {status === 'searching' ? (
            <div className="space-y-2">
              <p className="text-muted">
                {allowBotMatch ? 'Searching for available players' : 'Waiting for a real player'}
              </p>
              <p className="text-sm text-subtle font-mono">
                {waitTime}s{allowBotMatch && waitTime < 30 && ` • Bot match in ${30 - waitTime}s`}
              </p>
            </div>
          ) : (
            <p className="text-success">Starting match...</p>
          )}
        </div>

        {/* Match type toggle */}
        {status === 'searching' && (
          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1">Match preferences</h3>
                <p className="text-xs text-muted">
                  {allowBotMatch
                    ? 'Will match with bot after 30s if no player found'
                    : 'Only real players (may wait longer)'}
                </p>
              </div>
              <button
                onClick={() => setAllowBotMatch(!allowBotMatch)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowBotMatch ? 'bg-accent' : 'bg-base-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowBotMatch ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tips section */}
        {status === 'searching' && (
          <div className="card p-6 space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-subtle">Before you start</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-3">
                <span className="text-subtle">—</span>
                <span>Read constraints carefully before implementing</span>
              </li>
              <li className="flex gap-3">
                <span className="text-subtle">—</span>
                <span>Run tests frequently to catch errors early</span>
              </li>
              <li className="flex gap-3">
                <span className="text-subtle">—</span>
                <span>Submit only when all sample tests pass</span>
              </li>
              <li className="flex gap-3">
                <span className="text-subtle">—</span>
                <span>Use Ctrl+Enter (Cmd+Enter on Mac) to submit</span>
              </li>
            </ul>
          </div>
        )}

        {/* Cancel button */}
        {status === 'searching' && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCancel}
              className="btn-secondary text-sm"
            >
              Cancel search
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
