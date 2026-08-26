import { NextRequest, NextResponse } from 'next/server'

/**
 * Lightweight GitHub connection probe — never returns the token.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-github-token') || process.env.GITHUB_TOKEN
  const source = req.headers.get('x-github-token')
    ? 'settings'
    : process.env.GITHUB_TOKEN
      ? 'env'
      : null

  if (!token) {
    return NextResponse.json({
      connected: false,
      source: null,
      user: null,
      scopes: null,
      hint: 'Add GITHUB_TOKEN on Vercel, or paste a Personal Access Token in Settings → Integrations.',
    })
  }

  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kingslive-ctroom',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({
      connected: false,
      source,
      user: null,
      scopes: null,
      error: (err as { message?: string }).message || 'GitHub auth failed',
      hint: 'Token may be expired or missing repo scopes. Create a classic PAT with repo + workflow, or fine-grained with Contents + Pull requests (read/write).',
    })
  }

  const user = await res.json()
  const scopes = res.headers.get('x-oauth-scopes')

  let deployHookRepos: string[] = []
  if (process.env.VERCEL_DEPLOY_HOOKS) {
    try {
      deployHookRepos = Object.keys(JSON.parse(process.env.VERCEL_DEPLOY_HOOKS) as Record<string, string>)
    } catch {
      deployHookRepos = []
    }
  }

  return NextResponse.json({
    connected: true,
    source,
    user: {
      login: user.login,
      name: user.name,
      avatar: user.avatar_url,
      url: user.html_url,
    },
    scopes: scopes ? scopes.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
    deployHookRepos,
  })
}
