import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Hint cost in points
const HINT_COST = 5

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
    let body
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json(
        { error: '❌ Invalid JSON in request body.' },
        { status: 400 }
      )
    }

    const { problemTitle, problemDescription, userCode, userQuestion, conversationHistory, clientId } = body

    // Validate required fields
    if (!problemTitle || !problemDescription || !userCode || !userQuestion) {
      return NextResponse.json(
        { error: '❌ Missing required fields: problemTitle, problemDescription, userCode, and userQuestion are required.' },
        { status: 400 }
      )
    }

    // Check if user has enough points for a hint (REQUIRED if clientId provided)
    if (clientId) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('id', clientId)
        .single()

      // If profile doesn't exist, create one with 0 points
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - create with 0 points
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: clientId,
            username: 'Anonymous',
            total_points: 0,
            matches_played: 0,
            matches_won: 0,
            problems_solved: 0
          })
          .select()
          .single()

        if (newProfile && newProfile.total_points < HINT_COST) {
          return NextResponse.json(
            { 
              error: `Need more points for hints: price per hint is 5. You currently have ${newProfile.total_points} points. Win matches to earn more points!`,
              pointsRemaining: newProfile.total_points,
              hintsAvailable: 0
            },
            { status: 403 }
          )
        }
      } else if (!profileError && userProfile) {
        // Profile exists - check points
        const availableHints = Math.floor(userProfile.total_points / HINT_COST)
        if (availableHints < 1) {
          return NextResponse.json(
            { 
              error: `Need more points for hints: price per hint is 5. You currently have ${userProfile.total_points} points. Win matches to earn more points!`,
              pointsRemaining: userProfile.total_points,
              hintsAvailable: 0
            },
            { status: 403 }
          )
        }
      } else {
        // Error fetching profile - default to blocking
        return NextResponse.json(
          { 
            error: `Need more points for hints: price per hint is 5. Unable to verify your points. Please try again.`,
            pointsRemaining: 0,
            hintsAvailable: 0
          },
          { status: 403 }
        )
      }
    } else {
      // No clientId provided - block the request
      return NextResponse.json(
        { 
          error: `Need more points for hints: price per hint is 5. Please ensure you're logged in.`,
          pointsRemaining: 0,
          hintsAvailable: 0
        },
        { status: 403 }
      )
    }

    // Rate limiting by client ID (use default if not provided)
    const rateLimitId = clientId || 'anonymous'
    if (!rateLimiter.canMakeRequest(rateLimitId)) {
      return NextResponse.json(
        { error: '⏳ Rate limit reached. Please wait a moment before sending another message.' },
        { status: 429 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: '⚠️ AI assistant not configured. Add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Build messages array for OpenAI API
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: 'You are a helpful coding mentor helping a student solve programming problems. Provide helpful guidance without giving away the complete solution. Be concise (2-4 sentences), encouraging, and focus on teaching concepts. If they\'re stuck, suggest what to think about rather than what to code.'
      }
    ]

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Add conversation history
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })
      })
    }

    // Add the current user question
    messages.push({
      role: 'user',
      content: `Problem: ${problemTitle}\n${problemDescription}\n\nTheir current code:\n\`\`\`python\n${userCode}\n\`\`\`\n\nStudent's question: ${userQuestion}`
    })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', response.status, errorData)

      if (response.status === 401) {
        return NextResponse.json(
          { error: '❌ Invalid API key. Please check your OPENAI_API_KEY.' },
          { status: 401 }
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
    
    // Handle OpenAI API response structure
    if (!data.choices || data.choices.length === 0) {
      console.error('OpenAI API returned no choices:', data)
      return NextResponse.json(
        { error: '❌ AI service returned an empty response. Please try again.' },
        { status: 500 }
      )
    }

    const choice = data.choices[0]
    if (!choice.message || !choice.message.content) {
      console.error('OpenAI API choice has no message content:', choice)
      return NextResponse.json(
        { error: '❌ AI service returned invalid content. Please try again.' },
        { status: 500 }
      )
    }

        const responseText = choice.message.content ||
          'I can help you think through this problem. What specifically are you struggling with?'

        // Deduct points for hint usage
        if (clientId) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey)
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('total_points')
            .eq('id', clientId)
            .single()

          if (userProfile && userProfile.total_points >= HINT_COST) {
            await supabase
              .from('user_profiles')
              .update({ 
                total_points: userProfile.total_points - HINT_COST,
                updated_at: new Date().toISOString()
              })
              .eq('id', clientId)

            const newPoints = userProfile.total_points - HINT_COST
            const remainingHints = Math.floor(newPoints / HINT_COST)

            return NextResponse.json({ 
              text: responseText.trim(),
              pointsRemaining: newPoints,
              hintsAvailable: remainingHints,
              hintCost: HINT_COST
            })
          }
        }

        return NextResponse.json({ text: responseText.trim() })
  } catch (error) {
    console.error('Error in AI chat:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `❌ An error occurred: ${errorMessage}. Please try again.` },
      { status: 500 }
    )
  }
}
