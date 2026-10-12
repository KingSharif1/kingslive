import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const customSearch = google.customsearch('v1');

// ─── Milo v2 mind: soul + long-term memories ─────────────────────────────────

async function getMiloMind(): Promise<{ soul: string; memories: string[] }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const [{ data: soulRow }, { data: memRows }] = await Promise.all([
      supabase.from('milo_config').select('value').eq('key', 'soul').maybeSingle(),
      supabase.from('milo_memories').select('fact').order('importance', { ascending: false }).limit(20),
    ]);
    return {
      soul: typeof soulRow?.value === 'string' ? soulRow.value : '',
      memories: (memRows || []).map((m: any) => m.fact),
    };
  } catch {
    return { soul: '', memories: [] };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CtroomContext {
    today?: string;
    tasks?: Array<{ title: string; priority: string; category: string; dueDate?: string; dueTime?: string; project?: string }>;
    todayTaskCount?: number;
    missions?: Array<{ name: string; description?: string; progress: number; status: string }>;
    vault?: { monthlySpend: number; topCategory: string };
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ThinkingStep {
    title: string;
    status: 'pending' | 'completed' | 'failed';
    description: string;
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(ctx?: CtroomContext, soul?: string, memories?: string[]): string {
    const today = ctx?.today ? new Date(ctx.today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Soul first — his words define who Milo is. Fall back to the built-in default.
    let prompt = soul?.trim() || `You are Milo, King Sharif's elite personal AI assistant — think Jarvis from Iron Man.
You are sharp, direct, context-aware, and always helpful. You know what King is working on.

King's Profile:
- Name: King Sharif
- Role: Creative Developer & UX Engineer
- Location: Chicago, IL
- Stack: Next.js, React, TailwindCSS, Supabase, AI Integration
- Portfolio: kingsharif.com
- Interests: AI Agents, Minimalist Design, Creative Coding

Today is ${today}.`;

    // Always ground in today, even with a custom soul.
    if (soul?.trim() && !soul.includes(today)) {
        prompt += `\n\nToday is ${today}.`;
    }

    // Long-term memories — things Milo must not forget.
    if (memories && memories.length > 0) {
        prompt += `\n\nThings you remember about King:\n${memories.map(m => `  • ${m}`).join('\n')}`;
    }

    if (ctx?.todayTaskCount !== undefined) {
        prompt += `\n\nToday's workload: ${ctx.todayTaskCount} task${ctx.todayTaskCount !== 1 ? 's' : ''} on deck.`;
    }

    if (ctx?.tasks && ctx.tasks.length > 0) {
        const taskLines = ctx.tasks
            .slice(0, 15)
            .map(t => `  • [${t.priority.toUpperCase()}] ${t.title}${t.dueTime ? ` @ ${t.dueTime}` : ''}${t.project ? ` (${t.project})` : ''}`)
            .join('\n');
        prompt += `\n\nActive tasks:\n${taskLines}`;
    }

    if (ctx?.missions && ctx.missions.length > 0) {
        const missionLines = ctx.missions
            .map(m => `  • ${m.name} — ${m.progress}% complete [${m.status}]${m.description ? `: ${m.description}` : ''}`)
            .join('\n');
        prompt += `\n\nActive projects/missions:\n${missionLines}`;
    }

    if (ctx?.vault) {
        prompt += `\n\nVault snapshot: $${ctx.vault.monthlySpend.toFixed(0)} spent this month, top category: ${ctx.vault.topCategory}.`;
    }

    prompt += `\n\nInstructions:
- Be concise and direct — no unnecessary filler
- Reference King's actual tasks and projects when relevant
- Format responses cleanly using markdown when helpful
- You have access to web search and GitHub context tools when needed
- Never pretend to be a different AI system

## Your hands — you can DO things, not just talk
When King asks you to do something (add a task, remember something, update a project, log spending),
emit an action block on its own line in your response, then continue talking naturally:

[ACTION:task.create {"title": "Review Stella PR", "priority": "high"}]
[ACTION:memory.remember {"fact": "King prefers dark mode", "importance": 6}]
[ACTION:task.complete {"title": "Review Stella PR"}]
[ACTION:project.update {"id": "<id>", "progress": 75}]
[ACTION:transaction.add {"amount": 12.50, "description": "Coffee", "type": "expense", "confirm": true}]

Rules:
- Only emit actions King actually asked for or clearly implied. Never invent actions.
- transaction.add always needs "confirm": true — if King hasn't confirmed, ASK first, don't emit.
- After emitting, briefly say what you did in plain words. The UI executes and shows a ✓ chip.`;

    return prompt;
}

// ─── Tool: Web search ─────────────────────────────────────────────────────────

async function webSearch(query: string): Promise<string> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CX;
    if (!apiKey || !cx) throw new Error('Search API keys missing');

    const res = await customSearch.cse.list({ cx, q: query, auth: apiKey, num: 5 });
    if (!res.data.items || res.data.items.length === 0) return 'No results found.';

    return res.data.items
        .map((item: any) => `**${item.title}**\n${item.snippet}\n${item.link}`)
        .join('\n\n');
}

// ─── Tool: GitHub context ─────────────────────────────────────────────────────

async function githubContext(): Promise<string> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token missing');

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'kingslive-milo',
    };
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8', { headers });
    if (!res.ok) throw new Error('GitHub API error');

    const repos: any[] = await res.json();
    return repos
        .map(r => `**${r.full_name}** (${r.language || 'unknown'}) — ${r.description || 'no description'} — updated ${new Date(r.updated_at).toLocaleDateString()}`)
        .join('\n');
}

// ─── Model routing ────────────────────────────────────────────────────────────

async function callAnthropic(systemPrompt: string, messages: ChatMessage[], modelId: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key missing');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error?.message || `Anthropic error ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
}

async function callOpenAI(systemPrompt: string, messages: ChatMessage[], modelId: string, baseUrl = 'https://api.openai.com/v1'): Promise<string> {    const apiKey = baseUrl.includes('groq') ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error(`API key missing for ${baseUrl}`);

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens: 2048,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({ role: m.role, content: m.content })),
            ],
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callGemini(systemPrompt: string, messages: ChatMessage[], modelId: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key missing');

    const contents = [
        // Gemini doesn't have a system role in the same way — prepend to first user turn
        {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\n\n${messages[0]?.content || ''}` }],
        },
        ...messages.slice(1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
    ];

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 2048 } }),
        }
    );

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error?.message || `Gemini error ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Decide model: cheap router picks the best engine per task ───────────────

async function decideModel(query: string, messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return 'gpt-4o-mini';

  // Fast heuristic first: short casual messages never need the big model.
  const q = query.trim();
  if (q.length < 60 && !/(code|write|essay|analyze|analyse|explain|compare|design|debug|plan)/i.test(q)) {
    return 'gpt-4o-mini';
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You route tasks to the best AI model. Reply with exactly one word: QUICK or DEEP.
QUICK = simple Q&A, small talk, short factual answers, quick rewrites.
DEEP = code, debugging, long writing, analysis, planning, math, multi-step reasoning.
Conversation so far: ${messages.slice(-4).map(m => `${m.role}: ${m.content.slice(0, 120)}`).join('\n')}`,
          },
          { role: 'user', content: q.slice(0, 500) },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    const data = await res.json();
    const verdict = (data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
    if (verdict.startsWith('DEEP')) {
      return process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-6' : 'gpt-4o';
    }
    return 'gpt-4o-mini';
  } catch {
    return 'gpt-4o-mini';
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { messages, model, tools, ctroomContext } = await req.json() as {
            messages: ChatMessage[];
            model: string;
            thinkingMode?: string;
            tools?: string[];
            ctroomContext?: CtroomContext;
        };

        const lastMessage = messages[messages.length - 1];
        const query = lastMessage?.content || '';

        const thinkingSteps: ThinkingStep[] = [];
        thinkingSteps.push({ title: 'Processing Request', status: 'completed', description: `Model: ${model}` });

        // Milo v2: soul + long-term memories shape every response.
        const { soul, memories } = await getMiloMind();
        let systemPrompt = buildSystemPrompt(ctroomContext, soul, memories);

        // Web search tool
        const needsSearch = tools?.includes('web') && (
            query.toLowerCase().includes('search') ||
            query.toLowerCase().includes('find') ||
            query.toLowerCase().includes('current') ||
            query.toLowerCase().includes('news') ||
            query.toLowerCase().includes('latest') ||
            (query.length > 20 && query.includes('?'))
        );

        if (needsSearch) {
            thinkingSteps.push({ title: 'Searching Web', status: 'pending', description: `Query: ${query.slice(0, 60)}` });
            try {
                const results = await webSearch(query);
                systemPrompt += `\n\nWeb search results for "${query}":\n${results}`;
                thinkingSteps[thinkingSteps.length - 1].status = 'completed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Results injected into context';
            } catch {
                thinkingSteps[thinkingSteps.length - 1].status = 'failed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Search unavailable';
            }
        }

        // GitHub context tool
        if (tools?.includes('github')) {
            thinkingSteps.push({ title: 'Checking GitHub', status: 'pending', description: 'Fetching recent repos' });
            try {
                const ghContext = await githubContext();
                systemPrompt += `\n\nKing's recent GitHub repos:\n${ghContext}`;
                thinkingSteps[thinkingSteps.length - 1].status = 'completed';
                thinkingSteps[thinkingSteps.length - 1].description = 'GitHub context loaded';
            } catch {
                thinkingSteps[thinkingSteps.length - 1].status = 'failed';
                thinkingSteps[thinkingSteps.length - 1].description = 'GitHub unavailable';
            }
        }

        thinkingSteps.push({ title: 'Generating Response', status: 'pending', description: `Using ${model}` });

        let content = '';
        let routedModel = model;

        // ─── Decide model (router) ───────────────────────────────────────────
        // When the client sends model: 'auto', a cheap model picks the best
        // engine for the task. Quick Q&A -> gpt-4o-mini; deep work -> gpt-4o
        // (Claude when ANTHROPIC_API_KEY is installed).
        if (model === 'auto') {
            thinkingSteps.push({ title: 'Deciding Model', status: 'pending', description: 'Routing to the best engine' });
            try {
                routedModel = await decideModel(query, messages);
                thinkingSteps[thinkingSteps.length - 1].status = 'completed';
                thinkingSteps[thinkingSteps.length - 1].description = `Routed to ${routedModel}`;
            } catch {
                routedModel = 'gpt-4o-mini';
                thinkingSteps[thinkingSteps.length - 1].status = 'failed';
                thinkingSteps[thinkingSteps.length - 1].description = 'Router failed, using default';
            }
        }

        // Route to the right provider.
        // NOTE (2026-10-12): all gemini-2.x models are deprecated (404) and the
        // Gemini account has depleted credits (402), so any gemini- request is
        // rerouted to OpenAI until the account is topped up.
        if (routedModel.startsWith('claude-')) {
            content = await callAnthropic(systemPrompt, messages, routedModel);
        } else if (routedModel.startsWith('gpt-')) {
            content = await callOpenAI(systemPrompt, messages, routedModel);
        } else if (routedModel === 'groq-llama') {
            content = await callOpenAI(systemPrompt, messages, 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1');
        } else if (routedModel.startsWith('gemini-')) {
            content = await callOpenAI(systemPrompt, messages, 'gpt-4o-mini');
        } else {
            // Fallback: try OpenAI (verified working 2026-10-12).
            // Gemini models are deprecated and the Gemini account has no credits.
            try {
                content = await callOpenAI(systemPrompt, messages, 'gpt-4o-mini');
            } catch {
                content = await callOpenAI(systemPrompt, messages, 'gpt-4o');
            }
        }

        thinkingSteps[thinkingSteps.length - 1].status = 'completed';
        thinkingSteps[thinkingSteps.length - 1].description = 'Response ready';

        return NextResponse.json({ content, thinkingSteps });
    } catch (err: any) {
        console.error('[/api/chat] Error:', err);
        return NextResponse.json(
            { error: err.message || 'Chat API error', thinkingSteps: [] },
            { status: 500 }
        );
    }
}
