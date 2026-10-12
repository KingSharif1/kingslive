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

        // NOTE (2026-10-12): Gemini models are deprecated (404) and the Gemini
        // account has depleted credits (402). Using OpenAI instead.
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ summary: 'AI summary unavailable (OpenAI API key not configured).' });
        }

        const commitList = commits
            .slice(0, 15)
            .map((c, i) => `${i + 1}. ${c.message.split('\n')[0]}${c.author ? ` — ${c.author}` : ''}${c.date ? ` (${new Date(c.date).toLocaleDateString()})` : ''}`)
            .join('\n');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        let res: Response;
        try {
            res = await fetch(
                `https://api.openai.com/v1/chat/completions`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{
                            role: 'user',
                            content: `Summarize these Git commits in 2 short plain-English sentences for a project overview. Focus on what changed. Be concise and skip commit IDs.\n\n${commitList}`,
                        }],
                        max_tokens: 150,
                        temperature: 0.4,
                    }),
                    signal: controller.signal,
                }
            );
        } finally {
            clearTimeout(timeout);
        }

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const errMsg = (errBody as any)?.error?.message || `OpenAI API error ${res.status}`;
            console.error('[ai-summary] OpenAI error:', errMsg);
            return NextResponse.json({ summary: 'Could not generate summary.' });
        }

        const data = await res.json();
        const summary = data.choices?.[0]?.message?.content?.trim() || 'Could not generate summary.';
        return NextResponse.json({ summary });

    } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        console.error('[ai-summary] Error:', err?.message || err);
        return NextResponse.json({
            summary: isTimeout ? 'Summary timed out — try again.' : 'Could not generate summary.',
        });
    }
}
