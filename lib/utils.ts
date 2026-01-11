/**
 * Generate a short, memorable player name
 */
export function generatePlayerName(): string {
  const adjectives = [
    'Swift', 'Quick', 'Fast', 'Rapid', 'Speedy', 'Lightning', 'Blazing',
    'Nimble', 'Agile', 'Sharp', 'Smart', 'Clever', 'Bright', 'Genius',
    'Elite', 'Pro', 'Master', 'Epic', 'Legendary', 'Stellar'
  ]

  const nouns = [
    'Coder', 'Dev', 'Hacker', 'Ninja', 'Wizard', 'Master', 'Guru',
    'Champion', 'Legend', 'Hero', 'Ace', 'Star', 'Phoenix', 'Dragon',
    'Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Hawk'
  ]

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)

  return `${adj}${noun}${num}`
}

/**
 * Format milliseconds to MM:SS
 */
export function formatTime(ms: number | null): string {
  if (!ms) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format milliseconds to MM:SS.mm
 */
export function formatTimeDetailed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((ms % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * Get difficulty color classes
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-900 text-green-300'
    case 'medium':
      return 'bg-yellow-900 text-yellow-300'
    case 'hard':
      return 'bg-red-900 text-red-300'
    default:
      return 'bg-gray-900 text-gray-300'
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Delay helper
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
