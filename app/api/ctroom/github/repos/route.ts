import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const token = req.headers.get('x-github-token') || process.env.GITHUB_TOKEN;

    if (!token) {
        return NextResponse.json({ error: 'No GitHub token configured' }, { status: 401 });
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'kingslive-ctroom',
    };

    try {
        // Fetch user info + repos in parallel
        const [userRes, reposRes] = await Promise.all([
            fetch('https://api.github.com/user', { headers }),
            fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', { headers }),
        ]);

        if (!userRes.ok) {
            const err = await userRes.json().catch(() => ({}));
            return NextResponse.json({ error: (err as any).message || 'GitHub auth failed' }, { status: userRes.status });
        }

        const [user, repos] = await Promise.all([userRes.json(), reposRes.ok ? reposRes.json() : []]);

        return NextResponse.json({
            user: {
                login: user.login,
                name: user.name,
                avatar: user.avatar_url,
                url: user.html_url,
            },
            repos: (repos as any[]).map((r: any) => ({
                id: r.id,
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                url: r.html_url,
                private: r.private,
                language: r.language,
                stars: r.stargazers_count,
                updatedAt: r.updated_at,
                defaultBranch: r.default_branch,
            })),
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch repos' }, { status: 500 });
    }
}
