/**
 * AI-powered hints using Google Gemini API
 * Provides helpful guidance when user's code fails tests
 */

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
