/**
 * AI-powered hints using Google Gemini API
 * Provides helpful guidance when user's code fails tests
 *
 * FREE TIER LIMITS (Gemini API):
 * - 60 requests per minute
 * - 1,500 requests per day
 * - 1 million tokens per day
 *
 * Local rate limiting prevents excessive API usage
 */

// Simple in-memory rate limiter
const rateLimiter = {
  requests: [] as number[],
  maxRequestsPerMinute: 10, // Conservative limit
  maxRequestsPerHour: 50,   // Extra safety

  canMakeRequest(): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000

    // Clean old requests
    this.requests = this.requests.filter(time => time > oneHourAgo)

    const recentMinute = this.requests.filter(time => time > oneMinuteAgo).length
    const recentHour = this.requests.length

    if (recentMinute >= this.maxRequestsPerMinute) {
      console.warn('Rate limit: Too many requests per minute')
      return false
    }

    if (recentHour >= this.maxRequestsPerHour) {
      console.warn('Rate limit: Too many requests per hour')
      return false
    }

    this.requests.push(now)
    return true
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
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return "Add NEXT_PUBLIC_GEMINI_API_KEY to get AI hints!"
    }

    // Rate limit check
    if (!rateLimiter.canMakeRequest()) {
      return "Rate limit reached. Please wait a moment before requesting another hint."
    }

    const prompt = `You are a helpful coding mentor. A student is solving this problem:

Problem: ${problemTitle}
${problemDescription}

Their code:
\`\`\`python
${userCode}
\`\`\`

This test case failed:
- Input: ${JSON.stringify(failedTest.input)}
- Expected output: ${JSON.stringify(failedTest.expected)}
- Got: ${failedTest.actual ? JSON.stringify(failedTest.actual) : 'Error'}
${failedTest.error ? `- Error: ${failedTest.error}` : ''}

Give a brief, helpful hint (2-3 sentences max) to help them fix the bug. Don't give the full solution, just guide them in the right direction. Be encouraging!`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const hint = data.candidates[0]?.content?.parts[0]?.text || 'Try reviewing your logic and edge cases!'

    return hint.trim()
  } catch (error) {
    console.error('Error getting AI hint:', error)
    return 'Think about the edge cases and test your logic step by step!'
  }
}

export async function chatWithAI(
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return "Add NEXT_PUBLIC_GEMINI_API_KEY to enable AI assistant!"
    }

    // Rate limit check
    if (!rateLimiter.canMakeRequest()) {
      return "Rate limit reached. Please wait a moment before sending another message."
    }

    // Build conversation context
    let conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}`)
      .join('\n\n')

    const prompt = `You are a helpful coding mentor helping a student solve this problem:

Problem: ${problemTitle}
${problemDescription}

Their current code:
\`\`\`python
${userCode}
\`\`\`

Previous conversation:
${conversationText}

Student's question: ${userQuestion}

Provide helpful guidance without giving away the complete solution. Be concise (2-4 sentences), encouraging, and focus on teaching concepts. If they're stuck, suggest what to think about rather than what to code.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const response_text = data.candidates[0]?.content?.parts[0]?.text || 'I can help you think through this problem. What specifically are you struggling with?'

    return response_text.trim()
  } catch (error) {
    console.error('Error chatting with AI:', error)
    return 'I encountered an error. Try asking your question again!'
  }
}
