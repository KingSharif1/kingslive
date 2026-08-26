import { NextRequest, NextResponse } from 'next/server'
import { getGithubRepoPath } from '@/lib/portfolio-projects'

export const revalidate = 3600

type RepoStats = {
  fullName: string
  public: boolean
  commitCount: number | null
  lastCommitAt: string | null
  lastCommitMessage: string | null
  updatedAt: string | null
  stars: number
}

/**
 * Public GitHub repo stats for the portfolio.
 * Only returns data for public repos. Private → { public: false }.
 */
export async function GET(request: NextRequest) {
  const repoParam = request.nextUrl.searchParams.get('repo')
  const path = getGithubRepoPath(
    repoParam?.includes('github.com') ? repoParam : repoParam ? `https://github.com/${repoParam}` : null
  )

  if (!path || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(path)) {
    return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'kingslive-portfolio',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${path}`, {
      headers,
      next: { revalidate: 3600 },
    })

    if (repoRes.status === 404) {
      return NextResponse.json({
        fullName: path,
        public: false,
        commitCount: null,
        lastCommitAt: null,
        lastCommitMessage: null,
        updatedAt: null,
        stars: 0,
      } satisfies RepoStats)
    }

    if (!repoRes.ok) {
      return NextResponse.json({ error: 'GitHub unavailable' }, { status: 502 })
    }

    const repo = (await repoRes.json()) as {
      full_name: string
      private: boolean
      pushed_at: string | null
      updated_at: string | null
      stargazers_count: number
      default_branch: string
    }

    if (repo.private) {
      return NextResponse.json({
        fullName: repo.full_name,
        public: false,
        commitCount: null,
        lastCommitAt: null,
        lastCommitMessage: null,
        updatedAt: null,
        stars: 0,
      } satisfies RepoStats)
    }

    const commitsRes = await fetch(
      `https://api.github.com/repos/${path}/commits?per_page=1&sha=${encodeURIComponent(repo.default_branch || 'main')}`,
      { headers, next: { revalidate: 3600 } }
    )

    let lastCommitAt: string | null = repo.pushed_at
    let lastCommitMessage: string | null = null
    let commitCount: number | null = null

    if (commitsRes.ok) {
      const commits = (await commitsRes.json()) as Array<{
        commit?: { message?: string; committer?: { date?: string }; author?: { date?: string } }
      }>
      const latest = commits[0]
      if (latest?.commit) {
        lastCommitMessage = (latest.commit.message || '').split('\n')[0].slice(0, 120)
        lastCommitAt =
          latest.commit.committer?.date || latest.commit.author?.date || lastCommitAt
      }

      const link = commitsRes.headers.get('link')
      if (link) {
        const lastMatch = link.match(/[?&]page=(\d+)>;\s*rel="last"/)
        if (lastMatch) commitCount = Number(lastMatch[1])
      } else {
        commitCount = commits.length
      }
    }

    // Prefer Contributors API total when Link header page count is a poor proxy
    // (Link last page ≈ commit count when per_page=1 — that's intentional)

    const stats: RepoStats = {
      fullName: repo.full_name,
      public: true,
      commitCount,
      lastCommitAt,
      lastCommitMessage,
      updatedAt: repo.updated_at,
      stars: repo.stargazers_count ?? 0,
    }

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load repo stats' }, { status: 500 })
  }
}
