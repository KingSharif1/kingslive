import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '../../middleware'

/**
 * Trigger a Vercel production deploy via Deploy Hook.
 * Hook URL can come from the request body or VERCEL_DEPLOY_HOOKS JSON env:
 * { "KingSharif1/kingslive": "https://api.vercel.com/v1/integrations/deploy/..." }
 */
function hookFromEnv(repo: string): string | null {
  const raw = process.env.VERCEL_DEPLOY_HOOKS
  if (!raw) return null
  try {
    const map = JSON.parse(raw) as Record<string, string>
    return map[repo] || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.authorized) return auth.response

  const body = await req.json().catch(() => ({}))
  const repo = typeof body.repo === 'string' ? body.repo.trim() : ''
  const hookUrl =
    (typeof body.hookUrl === 'string' && body.hookUrl.trim()) ||
    (repo ? hookFromEnv(repo) : null)

  if (!hookUrl) {
    return NextResponse.json(
      {
        error:
          'No deploy hook. Paste a Vercel Deploy Hook URL for this repo, or set VERCEL_DEPLOY_HOOKS in env.',
      },
      { status: 400 }
    )
  }

  if (!hookUrl.startsWith('https://api.vercel.com/')) {
    return NextResponse.json({ error: 'Deploy hook must be a Vercel api.vercel.com URL' }, { status: 400 })
  }

  const res = await fetch(hookUrl, { method: 'POST' })
  const text = await res.text()
  let data: unknown = null
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text.slice(0, 200) }
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Deploy hook failed', status: res.status, detail: data },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    repo: repo || null,
    job: data,
  })
}

export async function GET() {
  const raw = process.env.VERCEL_DEPLOY_HOOKS
  let repos: string[] = []
  if (raw) {
    try {
      repos = Object.keys(JSON.parse(raw) as Record<string, string>)
    } catch {
      repos = []
    }
  }
  return NextResponse.json({
    envHooksConfigured: repos,
  })
}
