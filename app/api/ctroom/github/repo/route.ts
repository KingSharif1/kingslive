import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get('repo');
    const token = req.headers.get('x-github-token') || process.env.GITHUB_TOKEN;

    if (!repo) {
        return NextResponse.json({ error: 'Missing repo param' }, { status: 400 });
    }

    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'kingslive-ctroom'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const [repoRes, commitsRes, issuesRes, prsRes, branchRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${repo}`, { headers }),
            fetch(`https://api.github.com/repos/${repo}/commits?per_page=20`, { headers }),
            fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=10`, { headers }),
            fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=10`, { headers }),
            fetch(`https://api.github.com/repos/${repo}/branches`, { headers }),
        ]);

        if (!repoRes.ok) {
            const err = await repoRes.json().catch(() => ({}));
            return NextResponse.json(
                { error: (err as any).message || 'GitHub API error' },
                { status: repoRes.status }
            );
        }

        const [repoData, commits, issues, prs, branches] = await Promise.all([
            repoRes.json(),
            commitsRes.ok ? commitsRes.json() : [],
            issuesRes.ok ? issuesRes.json() : [],
            prsRes.ok ? prsRes.json() : [],
            branchRes.ok ? branchRes.json() : [],
        ]);

        const filteredIssues = (issues as any[]).filter((i: any) => !i.pull_request);

        // Language colour map (subset)
        const langColors: Record<string, string> = {
            TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
            Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', Ruby: '#701516',
            CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051', Swift: '#ffac45',
        };

        return NextResponse.json({
            name: repoData.name,
            fullName: repoData.full_name,
            description: repoData.description,
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            watchers: repoData.watchers_count,
            openIssues: repoData.open_issues_count,
            language: repoData.language,
            languageColor: langColors[repoData.language] || '#6b7280',
            defaultBranch: repoData.default_branch,
            updatedAt: repoData.updated_at,
            pushedAt: repoData.pushed_at,
            htmlUrl: repoData.html_url,
            private: repoData.private,
            branches: (branches as any[]).map((b: any) => b.name),
            commits: (commits as any[]).map((c: any) => {
                const msg = c.commit?.message || '';
                const [title, ...rest] = msg.split('\n');
                return {
                    sha: c.sha?.slice(0, 7),
                    fullSha: c.sha,
                    message: title.trim(),
                    body: rest.join('\n').trim() || null,
                    author: c.commit?.author?.name,
                    authorLogin: c.author?.login || null,
                    authorAvatar: c.author?.avatar_url || null,
                    date: c.commit?.author?.date,
                    url: c.html_url,
                };
            }),
            issues: filteredIssues.map((i: any) => ({
                number: i.number,
                title: i.title,
                url: i.html_url,
                createdAt: i.created_at,
                labels: (i.labels as any[]).map((l: any) => ({ name: l.name, color: l.color })),
                comments: i.comments,
            })),
            pullRequests: (prs as any[]).map((p: any) => ({
                number: p.number,
                title: p.title,
                url: p.html_url,
                createdAt: p.created_at,
                draft: p.draft,
                user: p.user?.login,
                additions: p.additions,
                deletions: p.deletions,
                changedFiles: p.changed_files,
                labels: (p.labels as any[]).map((l: any) => ({ name: l.name, color: l.color })),
            })),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch GitHub data' }, { status: 500 });
    }
}
