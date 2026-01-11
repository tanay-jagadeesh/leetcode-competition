import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
const rateLimiter = {
  requests: new Map<string, number[]>(),
  maxRequestsPerMinute: 10,
  maxRequestsPerHour: 50,

  canMakeRequest(clientId: string): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000

    // Get or create request history for this client
    let requests = this.requests.get(clientId) || []

    // Clean old requests
    requests = requests.filter(time => time > oneHourAgo)
    this.requests.set(clientId, requests)

    const recentMinute = requests.filter(time => time > oneMinuteAgo).length
    const recentHour = requests.length

    if (recentMinute >= this.maxRequestsPerMinute) {
      return false
    }

    if (recentHour >= this.maxRequestsPerHour) {
      return false
    }

    requests.push(now)
    this.requests.set(clientId, requests)
    return true
  }
}

export async function POST(req: NextRequest) {
  try {
    const { problemTitle, problemDescription, userCode, userQuestion, conversationHistory, clientId } = await req.json()

    // Rate limiting by client ID
    if (!rateLimiter.canMakeRequest(clientId)) {
      return NextResponse.json(
        { error: '⏳ Rate limit reached. Please wait a moment before sending another message.' },
        { status: 429 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: '⚠️ AI assistant not configured. Add GEMINI_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Build conversation context
    const conversationText = conversationHistory
      .map((msg: any) => `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}`)
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Gemini API error:', response.status, errorData)

      if (response.status === 400) {
        return NextResponse.json(
          { error: '❌ Invalid API key. Please check your GEMINI_API_KEY.' },
          { status: 400 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: '⏳ API rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        )
      }

      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'I can help you think through this problem. What specifically are you struggling with?'

    return NextResponse.json({ text: responseText.trim() })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: '❌ An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
