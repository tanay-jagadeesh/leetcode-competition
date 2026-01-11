import { v4 as uuidv4 } from 'uuid'

const PLAYER_ID_KEY = 'leetcode_race_player_id'

/**
 * Get or create a persistent player ID
 */
export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return `player_${uuidv4()}`
  }

  let playerId = sessionStorage.getItem(PLAYER_ID_KEY)

  if (!playerId) {
    playerId = `player_${uuidv4()}`
    sessionStorage.setItem(PLAYER_ID_KEY, playerId)
  }

  return playerId
}

/**
 * Clear player ID (for testing)
 */
export function clearPlayerId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(PLAYER_ID_KEY)
  }
}

/**
 * Store match ID for current player
 */
export function setCurrentMatchId(matchId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('current_match_id', matchId)
  }
}

/**
 * Get current match ID
 */
export function getCurrentMatchId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return sessionStorage.getItem('current_match_id')
}

/**
 * Clear current match
 */
export function clearCurrentMatch(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('current_match_id')
  }
}
