import { NextResponse } from 'next/server';

// Returns which env-var keys are configured — never exposes the actual values
export async function GET() {
    return NextResponse.json({
        openai:    !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google:    !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        github:    !!process.env.GITHUB_TOKEN,
        groq:      !!process.env.GROQ_API_KEY,
    });
}
