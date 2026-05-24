import { NextRequest, NextResponse } from 'next/server';

interface Commit {
    sha: string;
    message: string;
    author?: string;
    date?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { commits } = await req.json() as { commits: Commit[] };

        if (!commits || commits.length === 0) {
            return NextResponse.json({ summary: 'No commits to summarize.' });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 503 });
        }

        const commitList = commits
            .slice(0, 20)
            .map((c, i) => `${i + 1}. [${c.sha}] ${c.message}${c.author ? ` — by ${c.author}` : ''}${c.date ? ` (${new Date(c.date).toLocaleDateString()})` : ''}`)
            .join('\n');

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 256,
                messages: [
                    {
                        role: 'user',
                        content: `Summarize these Git commits in 2–3 plain-English sentences for a project overview dashboard. Focus on what was built or fixed, not technical commit IDs. Be concise and human-readable.\n\nCommits:\n${commitList}`,
                    },
                ],
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return NextResponse.json(
                { error: (err as any).error?.message || `Claude error ${res.status}` },
                { status: 500 }
            );
        }

        const data = await res.json();
        const summary = data.content?.[0]?.text?.trim() || 'Could not generate summary.';

        return NextResponse.json({ summary });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to generate summary' }, { status: 500 });
    }
}
