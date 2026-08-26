import { NextResponse } from 'next/server';

// Returns which env-var keys are configured — never exposes the actual values
export async function GET() {
    let vercelDeployHooks = 0
    if (process.env.VERCEL_DEPLOY_HOOKS) {
        try {
            vercelDeployHooks = Object.keys(
                JSON.parse(process.env.VERCEL_DEPLOY_HOOKS) as Record<string, string>
            ).length
        } catch {
            vercelDeployHooks = 0
        }
    }

    return NextResponse.json({
        openai:    !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google:    !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        github:    !!process.env.GITHUB_TOKEN,
        groq:      !!process.env.GROQ_API_KEY,
        vercelDeployHooks,
    });
}
