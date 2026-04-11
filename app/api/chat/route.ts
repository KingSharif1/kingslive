import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const customSearch = google.customsearch('v1');

// ─── Milo System Prompt ───────────────────────────────────────────────────────

function buildSystemPrompt(ctroomContext?: { tasks?: any[]; missions?: any[] }) {
    let prompt = `You are Milo, King Sharif's elite personal AI — a Jarvis-like intelligence built into his private creator OS.

About King:
- Creative Developer & UX Engineer based in Chicago, IL
- Works on Next.js, React, Tailwind, AI, Supabase, Three.js
- Building "kingslive" — a personal portfolio + private creator command center

Personality:
- Sharp, direct, smart — no filler, no fluff
- Speak like a trusted advisor: concise, confident, insightful
- Know when to be brief and when to go deep
- You're aware of King's work and can reference it specifically`;

    if (ctroomContext?.tasks && ctroomContext.tasks.length > 0) {
        const today = new Date().toDateString();
        const todayTasks = ctroomContext.tasks.filter((t: any) => {
            try { return new Date(t.date).toDateString() === today; } catch { return false; }
        });
        const overdue = ctroomContext.tasks.filter((t: any) => {
            try { return new Date(t.date) < new Date() && new Date(t.date).toDateString() !== today; } catch { return false; }
        });

        prompt += `\n\nCurrent Tasks (${ctroomContext.tasks.length} active):`;
        if (todayTasks.length > 0) {
            prompt += `\nDue Today (${todayTasks.length}): ${todayTasks.map((t: any) => `"${t.title}" [${t.priority}]`).join(', ')}`;
        }
        if (overdue.length > 0) {
            prompt += `\nOverdue (${overdue.length}): ${overdue.slice(0, 5).map((t: any) => `"${t.title}"`).join(', ')}`;
        }
        const upcoming = ctroomContext.tasks.filter((t: any) => {
            try { return new Date(t.date) > new Date(); } catch { return false; }
        }).slice(0, 5);
        if (upcoming.length > 0) {
            prompt += `\nUpcoming: ${upcoming.map((t: any) => `"${t.title}" [${t.priority}]`).join(', ')}`;
        }
    }

    if (ctroomContext?.missions && ctroomContext.missions.length > 0) {
        prompt += `\n\nActive Projects (${ctroomContext.missions.length}):`;
        ctroomContext.missions.slice(0, 6).forEach((m: any) => {
            prompt += `\n- "${m.name}" — ${m.progress ?? 0}% complete, priority: ${m.priority}${m.description ? `, ${m.description}` : ''}${m.repoUrl ? `, repo: ${m.repoUrl}` : ''}`;
        });
    }

    prompt += `\n\nRespond in markdown where helpful. Be specific when you can reference King's actual data above.`;
    return prompt;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function doWebSearch(query: string): Promise<string | null> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CX;
    if (!apiKey || !cx) return null;
    try {
        const res = await customSearch.cse.list({ cx, q: query, auth: apiKey, num: 5 });
        if (!res.data.items?.length) return null;
        return res.data.items.map((item: any) => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n');
    } catch { return null; }
}

async function doGithubContext(query: string): Promise<string | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return null;
    try {
        const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8', {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return null;
        const repos = await res.json();
        return repos.map((r: any) => `- ${r.name} (${r.language || 'N/A'}): ${r.description || 'No description'}`).join('\n');
    } catch { return null; }
}

// ─── Provider functions ───────────────────────────────────────────────────────

async function callOpenAI(model: string, systemPrompt: string, messages: any[]): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('No OpenAI key');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model,
            messages: [{ role: 'system', content: systemPrompt }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
            max_tokens: 1500,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'OpenAI error');
    return data.choices?.[0]?.message?.content || '';
}

async function callGemini(model: string, systemPrompt: string, messages: any[]): Promise<string> {
    const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('No Gemini key');
    // Map friendly model names to API model IDs
    const modelMap: Record<string, string> = {
        'gemini-flash': 'gemini-2.0-flash',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-pro': 'gemini-1.5-pro',
        'gemini-1.5-pro': 'gemini-1.5-pro',
    };
    const apiModel = modelMap[model] || model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${key}`;
    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am Milo.' }] },
        ...messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
    ];
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAnthropic(model: string, systemPrompt: string, messages: any[]): Promise<string> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('No Anthropic key');
    // Map friendly model names to API model IDs
    const modelMap: Record<string, string> = {
        'claude-sonnet': 'claude-sonnet-4-6',
        'claude-sonnet-4-6': 'claude-sonnet-4-6',
        'claude-opus': 'claude-opus-4-6',
        'claude-haiku': 'claude-haiku-4-5-20251001',
    };
    const apiModel = modelMap[model] || model;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key.trim(),
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: apiModel,
            max_tokens: 1500,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.[0]?.text || '';
}

async function callGroq(model: string, systemPrompt: string, messages: any[]): Promise<string> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('No Groq key');
    const modelMap: Record<string, string> = {
        'groq-llama': 'llama-3.3-70b-versatile',
        'groq-mixtral': 'mixtral-8x7b-32768',
    };
    const apiModel = modelMap[model] || 'llama-3.3-70b-versatile';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
            model: apiModel,
            messages: [{ role: 'system', content: systemPrompt }, ...messages.map((m: any) => ({ role: m.role, content: m.content }))],
            max_tokens: 1500,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Groq error');
    return data.choices?.[0]?.message?.content || '';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const { messages, model, thinkingMode, tools, ctroomContext } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const query = lastMessage?.content || '';

        const thinkingSteps: { title: string; status: string; description: string }[] = [];
        thinkingSteps.push({ title: 'Processing Request', status: 'completed', description: `Model: ${model}` });

        // Build base system prompt with ctroom context
        let systemPrompt = buildSystemPrompt(ctroomContext);

        // Web Search
        const needsSearch = tools?.includes('search-web') ||
            (query.toLowerCase().includes('search') && !query.toLowerCase().includes('github'));
        if (needsSearch) {
            thinkingSteps.push({ title: 'Searching the Web', status: 'pending', description: query });
            const results = await doWebSearch(query);
            if (results) {
                systemPrompt += `\n\nWeb Search Results:\n${results}`;
                thinkingSteps[thinkingSteps.length - 1].status = 'completed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Found relevant results';
            } else {
                thinkingSteps[thinkingSteps.length - 1].status = 'failed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Search unavailable';
            }
        }

        // GitHub Context
        const needsGithub = tools?.includes('github') || query.toLowerCase().includes('github');
        if (needsGithub) {
            thinkingSteps.push({ title: 'Checking GitHub', status: 'pending', description: 'Fetching repositories...' });
            const repoList = await doGithubContext(query);
            if (repoList) {
                systemPrompt += `\n\nGitHub Repositories:\n${repoList}`;
                thinkingSteps[thinkingSteps.length - 1].status = 'completed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Repos loaded';
            } else {
                thinkingSteps[thinkingSteps.length - 1].status = 'failed';
                thinkingSteps[thinkingSteps.length - 1].description = 'GitHub unavailable';
            }
        }

        // Generate response
        thinkingSteps.push({ title: 'Generating Response', status: 'pending', description: `Using ${model}` });

        let generatedText = '';
        let usedProvider = '';

        try {
            if (model.startsWith('gpt')) {
                generatedText = await callOpenAI(model, systemPrompt, messages);
                usedProvider = 'OpenAI';
            } else if (model.includes('gemini')) {
                generatedText = await callGemini(model, systemPrompt, messages);
                usedProvider = 'Google';
            } else if (model.includes('claude')) {
                generatedText = await callAnthropic(model, systemPrompt, messages);
                usedProvider = 'Anthropic';
            } else if (model.startsWith('groq')) {
                generatedText = await callGroq(model, systemPrompt, messages);
                usedProvider = 'Groq';
            } else {
                // Fallback: try Gemini first, then OpenAI
                if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
                    generatedText = await callGemini('gemini-2.0-flash', systemPrompt, messages);
                    usedProvider = 'Google';
                } else if (process.env.OPENAI_API_KEY) {
                    generatedText = await callOpenAI('gpt-4o-mini', systemPrompt, messages);
                    usedProvider = 'OpenAI';
                } else {
                    generatedText = "No AI provider available. Please add an API key in Settings.";
                }
            }
        } catch (err: any) {
            console.error('Provider error:', err);
            generatedText = `Error: ${err.message || 'Failed to get a response.'}`;
        }

        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description = usedProvider || model;

        return NextResponse.json({
            message: generatedText || "I don't have that information right now.",
            thinkingSteps,
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
