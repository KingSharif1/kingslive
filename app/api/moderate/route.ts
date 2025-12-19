import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      // Fallback to basic moderation if no API key
      console.log('OpenAI API key not configured, using basic moderation')
      return NextResponse.json({
        flagged: false,
        categories: {},
        usingFallback: true
      })
    }

    // Call OpenAI Moderation API
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'omni-moderation-latest'
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI Moderation API error:', error)
      // Return safe fallback on API error
      return NextResponse.json({
        flagged: false,
        categories: {},
        error: 'Moderation API unavailable'
      })
    }

    const data = await response.json()
    const result = data.results?.[0]

    if (!result) {
      return NextResponse.json({
        flagged: false,
        categories: {},
        error: 'No moderation result'
      })
    }

    // Extract flagged categories
    const flaggedCategories: string[] = []
    if (result.categories) {
      for (const [category, isFlagged] of Object.entries(result.categories)) {
        if (isFlagged) {
          flaggedCategories.push(category)
        }
      }
    }

    return NextResponse.json({
      flagged: result.flagged,
      categories: result.categories,
      flaggedCategories,
      categoryScores: result.category_scores
    })

  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', flagged: false },
      { status: 500 }
    )
  }
}
