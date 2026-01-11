/**
 * AI-powered hints using Google Gemini 1.5 Flash API
 * Now using server-side API routes for better security
 *
 * FREE TIER LIMITS (Gemini 1.5 Flash):
 * - 15 requests per minute
 * - 1,500 requests per day
 * - 1 million tokens per minute
 *
 * Server-side rate limiting prevents excessive API usage
 */

import { getPlayerId } from './session'

export async function chatWithAI(
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemTitle,
        problemDescription,
        userCode,
        userQuestion,
        conversationHistory,
        clientId: getPlayerId(), // Use player ID for rate limiting
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return data.error || '❌ An error occurred. Please try again.'
    }

    return data.text
  } catch (error) {
    console.error('Error chatting with AI:', error)
    return '❌ Network error. Please check your connection and try again.'
  }
}

export async function getHint(
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  failedTest: {
    input: any
    expected: any
    actual: any
    error?: string
  }
): Promise<string> {
  // Convert hint request into a chat message
  const question = `My code failed this test case:
- Input: ${JSON.stringify(failedTest.input)}
- Expected: ${JSON.stringify(failedTest.expected)}
- Got: ${failedTest.actual ? JSON.stringify(failedTest.actual) : 'Error'}
${failedTest.error ? `- Error: ${failedTest.error}` : ''}

Can you give me a hint about what might be wrong?`

  return chatWithAI(problemTitle, problemDescription, userCode, question, [])
}
