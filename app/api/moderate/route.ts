import { NextRequest, NextResponse } from 'next/server'

// POST /api/moderate — wraps the OpenAI Moderation API for comment checks.
// Called by lib/content-moderation.ts (moderateWithOpenAI).
//
// Fail-open by design: any failure (no API key, OpenAI error) returns
// { flagged: false } so a moderation outage never blocks comment submission.
// NOTE: when no key is configured the response intentionally omits
// `usingFallback` — lib/content-moderation.ts only auto-approves when that
// field is unset, which preserves the long-standing live behavior of
// instantly approving clean comments.

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text?: unknown }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ flagged: false, error: 'Missing text' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ flagged: false })
    }

    const resp = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
    })

    if (!resp.ok) {
      console.error('OpenAI moderation error:', resp.status)
      return NextResponse.json({ flagged: false })
    }

    const data = (await resp.json()) as {
      results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>
    }
    const result = data.results?.[0]
    const flaggedCategories = result?.categories
      ? Object.keys(result.categories).filter((k) => result.categories?.[k])
      : []

    return NextResponse.json({ flagged: result?.flagged ?? false, flaggedCategories })
  } catch (err) {
    console.error('Moderation route error:', err)
    return NextResponse.json({ flagged: false })
  }
}
