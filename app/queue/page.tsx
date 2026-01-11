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
  const [status, setStatus] = useState<'searching' | 'matched' | 'creating'>('searching')

  useEffect(() => {
    let timer: NodeJS.Timeout
    let botTimeout: NodeJS.Timeout
    let channel: any

    const findMatch = async () => {
      try {
        // First, try to join an existing waiting match
        const { data: waitingMatches } = await supabase
          .from('matches')
          .select('*')
          .eq('status', 'waiting')
          .is('player2_id', null)
          .order('created_at', { ascending: true })
          .limit(1)

        if (waitingMatches && waitingMatches.length > 0) {
          // Join existing match
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
            setTimeout(() => router.push(`/race/${match.id}`), 1000)
            return
          }
        }

        // No existing match, create a new one
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

        // Subscribe to match updates
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
                setTimeout(() => router.push(`/race/${newMatch.id}`), 1000)
              }
            }
          )
          .subscribe()

        // After 30 seconds, match with a bot
        botTimeout = setTimeout(async () => {
          const botId = `bot_${uuidv4()}`
          const { error } = await supabase
            .from('matches')
            .update({
              player2_id: botId,
              status: 'active'
            })
            .eq('id', newMatch.id)

          if (!error) {
            setStatus('matched')
            setTimeout(() => router.push(`/race/${newMatch.id}`), 1000)
          }
        }, 30000)

      } catch (error) {
        console.error('Error finding match:', error)
      }
    }

    findMatch()

    // Wait time counter
    timer = setInterval(() => {
      setWaitTime(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(timer)
      clearTimeout(botTimeout)
      if (channel) channel.unsubscribe()
    }
  }, [playerId, router])

  const handleCancel = () => {
    if (matchId) {
      // Delete the match if we created it
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
    <main className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 border-8 border-secondary border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
        </div>

        {/* Status */}
        <h1 className="text-4xl font-bold mb-4 text-white">
          {status === 'searching' && 'Finding Opponent...'}
          {status === 'matched' && '✓ Match Found!'}
          {status === 'creating' && 'Creating Match...'}
        </h1>

        {status === 'searching' && (
          <>
            <p className="text-xl text-gray-400 mb-2">
              Searching for a worthy opponent
            </p>
            <p className="text-sm text-gray-500 mb-8">
              {waitTime}s elapsed • Bot match in {Math.max(0, 30 - waitTime)}s
            </p>
          </>
        )}

        {status === 'matched' && (
          <p className="text-xl text-green-400 mb-8">
            Preparing your race...
          </p>
        )}

        {/* Cancel Button */}
        {status === 'searching' && (
          <button
            onClick={handleCancel}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}

        {/* Tips */}
        {status === 'searching' && (
          <div className="mt-16 max-w-md mx-auto">
            <div className="bg-dark-200 p-6 rounded-xl border-gradient">
              <h3 className="text-lg font-bold mb-3 text-white">Quick Tips</h3>
              <ul className="text-left text-gray-400 space-y-2 text-sm">
                <li>• Read the problem carefully before coding</li>
                <li>• Use "Run Tests" to check sample cases</li>
                <li>• Submit when all tests pass</li>
                <li>• Speed matters - but correctness matters more</li>
                <li>• Press Ctrl+Enter to submit quickly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
