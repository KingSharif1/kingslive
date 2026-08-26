import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '../../middleware'

type MergeMethod = 'merge' | 'squash' | 'rebase'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.authorized) return auth.response

  const token = req.headers.get('x-github-token') || process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'GitHub not connected — set GITHUB_TOKEN or add a PAT in Settings → Integrations' },
      { status: 401 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const repo = typeof body.repo === 'string' ? body.repo.trim() : ''
  const pullNumber = Number(body.pullNumber)
  const mergeMethod = (body.mergeMethod || 'squash') as MergeMethod
  const commitTitle = typeof body.commitTitle === 'string' ? body.commitTitle : undefined

  if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return NextResponse.json({ error: 'Invalid repo (expected owner/name)' }, { status: 400 })
  }
  if (!Number.isFinite(pullNumber) || pullNumber < 1) {
    return NextResponse.json({ error: 'Invalid pullNumber' }, { status: 400 })
  }
  if (!['merge', 'squash', 'rebase'].includes(mergeMethod)) {
    return NextResponse.json({ error: 'Invalid mergeMethod' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${pullNumber}/merge`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'kingslive-ctroom',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        merge_method: mergeMethod,
        ...(commitTitle ? { commit_title: commitTitle } : {}),
      }),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string }).message || 'Merge failed' },
      { status: res.status }
    )
  }

  return NextResponse.json({
    merged: Boolean((data as { merged?: boolean }).merged),
    sha: (data as { sha?: string }).sha,
    message: (data as { message?: string }).message,
  })
}
