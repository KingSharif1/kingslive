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

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ summary: 'AI summary unavailable (Gemini API key not configured).' });
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
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{
                                text: `Summarize these Git commits in 2 short plain-English sentences for a project overview. Focus on what changed. Be concise and skip commit IDs.\n\n${commitList}`,
                            }],
                        }],
                        generationConfig: { maxOutputTokens: 150, temperature: 0.4 },
                    }),
                    signal: controller.signal,
                }
            );
        } finally {
            clearTimeout(timeout);
        }

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const errMsg = (errBody as any)?.error?.message || `Gemini API error ${res.status}`;
            console.error('[ai-summary] Gemini error:', errMsg);
            return NextResponse.json({ summary: 'Could not generate summary.' });
        }

        const data = await res.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Could not generate summary.';
        return NextResponse.json({ summary });

    } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        console.error('[ai-summary] Error:', err?.message || err);
        return NextResponse.json({
            summary: isTimeout ? 'Summary timed out — try again.' : 'Could not generate summary.',
        });
    }
}
