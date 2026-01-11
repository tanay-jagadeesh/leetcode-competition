import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

const PLAYER_ID_KEY = 'leetcode_race_player_id'
let cachedAuthUserId: string | null = null

/**
 * Get or create a persistent player ID
 * If user is authenticated, use their user ID. Otherwise, use anonymous session ID.
 * This function is synchronous for backwards compatibility but checks auth state.
 */
export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    return `player_${uuidv4()}`
  }

  // Check if we have a cached auth user ID (updated by auth context)
  if (cachedAuthUserId) {
    return cachedAuthUserId
  }

  // Fallback to anonymous session ID
  let playerId = sessionStorage.getItem(PLAYER_ID_KEY)

  if (!playerId) {
    playerId = `player_${uuidv4()}`
    sessionStorage.setItem(PLAYER_ID_KEY, playerId)
  }

  return playerId
}

/**
 * Update cached auth user ID (called when auth state changes)
 */
export function updateCachedAuthUserId(userId: string | null): void {
  cachedAuthUserId = userId
  if (!userId) {
    // Clear auth user ID from cache
    cachedAuthUserId = null
  }
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
