import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { action, owner, repo, path, query } = await req.json()

    const githubToken = process.env.GITHUB_TOKEN

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Milo-Assistant'
    }

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`
    }

    switch (action) {
      case 'search_repos': {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          return NextResponse.json({ error: 'GitHub search failed' }, { status: response.status })
        }
        
        const data = await response.json()
        const repos = data.items?.map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          url: repo.html_url
        })) || []
        
        return NextResponse.json({ repos })
      }

      case 'get_repo': {
        const url = `https://api.github.com/repos/${owner}/${repo}`
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          return NextResponse.json({ error: 'Repository not found' }, { status: response.status })
        }
        
        const data = await response.json()
        return NextResponse.json({
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          topics: data.topics,
          url: data.html_url,
          default_branch: data.default_branch
        })
      }

      case 'get_contents': {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path || ''}`
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          return NextResponse.json({ error: 'Content not found' }, { status: response.status })
        }
        
        const data = await response.json()
        
        // If it's a file, decode content
        if (data.content && data.encoding === 'base64') {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          return NextResponse.json({
            type: 'file',
            name: data.name,
            path: data.path,
            content: content.slice(0, 10000), // Limit content size
            size: data.size
          })
        }
        
        // If it's a directory, return file list
        if (Array.isArray(data)) {
          const items = data.map((item: any) => ({
            name: item.name,
            type: item.type,
            path: item.path,
            size: item.size
          }))
          return NextResponse.json({ type: 'directory', items })
        }
        
        return NextResponse.json(data)
      }

      case 'get_issues': {
        const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to fetch issues' }, { status: response.status })
        }
        
        const data = await response.json()
        const issues = data.map((issue: any) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          labels: issue.labels?.map((l: any) => l.name) || [],
          created_at: issue.created_at,
          url: issue.html_url
        }))
        
        return NextResponse.json({ issues })
      }

      case 'get_commits': {
        const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`
        const response = await fetch(url, { headers })
        
        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to fetch commits' }, { status: response.status })
        }
        
        const data = await response.json()
        const commits = data.map((commit: any) => ({
          sha: commit.sha.slice(0, 7),
          message: commit.commit.message.split('\n')[0],
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          url: commit.html_url
        }))
        
        return NextResponse.json({ commits })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json({ error: 'GitHub API failed' }, { status: 500 })
  }
}
