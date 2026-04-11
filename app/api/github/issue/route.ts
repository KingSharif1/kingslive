import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const token = req.headers.get('x-github-token') || process.env.GITHUB_TOKEN;
    if (!token) return NextResponse.json({ error: 'No GitHub token' }, { status: 401 });

    const body = await req.json();
    const { repo, title, body: issueBody, labels } = body;

    if (!repo || !title) {
        return NextResponse.json({ error: 'repo and title are required' }, { status: 400 });
    }

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'kingslive-ctroom',
        },
        body: JSON.stringify({ title, body: issueBody || '', labels: labels || [] }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message || 'Failed' }, { status: res.status });

    return NextResponse.json({
        number: data.number,
        title: data.title,
        url: data.html_url,
        createdAt: data.created_at,
        labels: (data.labels as any[]).map((l: any) => ({ name: l.name, color: l.color })),
        comments: 0,
    });
}
