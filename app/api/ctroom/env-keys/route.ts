import { NextResponse } from 'next/server'

// This route returns env API keys so the Settings page can display and use them.
// Only accessible server-side. Keys are returned in full since this is a single-user admin app.
export async function GET() {
  return NextResponse.json({
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    google: process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    github: process.env.GITHUB_TOKEN || '',
  })
}
