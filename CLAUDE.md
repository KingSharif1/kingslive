# CLAUDE.md — KingsLive Project Handoff

> This file is the single source of truth for Claude Code working on this project.
> Read this entirely before touching any file. Update it when architecture changes.

---

## Who This Project Is For

**Owner:** King Sharif — Creative Developer, UX Engineer, Entrepreneur, early 20s, based in Abilene TX (HQ: "Ctroom").
**Goal:** A personal platform that is genuinely useful — not a demo, not a portfolio toy. Every section should work like a real product.
**Philosophy:** Build things that are personal, smart, and actually solve your problems. Milo (your AI) should feel like Jarvis. The Vault should feel like Rocket Money. The Ctroom should feel like a real control room.

---

## Project Overview

**Repo:** https://github.com/KingSharif1/kingslive
**Live URL:** https://kingslive.vercel.app (⚠️ currently serving wrong app — "Kings Ultra" — Vercel deploy is misconfigured, likely wrong branch)
**Stack:** Next.js 15 (App Router) · React 18 · TypeScript 5 · Tailwind CSS 3.4 · shadcn/ui (Radix primitives) · Supabase (auth + Postgres) · Sanity v4 (CMS/blog) · Vercel (deploy + analytics)

### The Three Sections

| Section | Route | Purpose | Status |
|---|---|---|---|
| **Portfolio** | `/` | Public-facing creative portfolio | Functional, updates coming |
| **Ctroom** | `/ctroom` | Personal HQ — missions, AI, vault, dreamboard | Auth works, features partial |
| **Vault** | `/vault` (+ `/ctroom` vault view) | Personal finance dashboard | 2,249 live transactions, Teller wired |

---

## Architecture

```
app/
├── ctroom/
│   ├── page.tsx                    ← Server component, renders <CtroomDashboard />
│   └── components/
│       ├── CtroomDashboard.tsx     ← THE master controller (all state lives here)
│       ├── LoginScreen.tsx         ← Magic-link login UI
│       ├── Sidebar.tsx
│       ├── MobileHeader.tsx
│       ├── TaskFormModal.tsx       ← Habit fields: frequency, duration, customDays
│       ├── MissionDetailModal.tsx  ← Project detail + tasks view
│       ├── UsageModal.tsx          ← AI token usage stats
│       └── views/
│           ├── DashboardView.tsx   ← Home overview
│           ├── ChatView.tsx        ← Milo AI chat UI
│           ├── IdeasView.tsx
│           ├── PlannerView.tsx     ← Task list + applyOvertime + systems/habits
│           ├── MissionsView.tsx    ← Project tracker list
│           ├── BlogView.tsx
│           ├── SettingsView.tsx
│           ├── VaultView.tsx       ← Finance dashboard (embedded)
│           └── DreamboardView.tsx  ← Vision/mood board (⚠ siloed, likely no persistence)
├── api/
│   ├── chat/route.ts               ← Milo AI — multi-model, non-streaming, read-only
│   ├── auth/
│   │   ├── verify-admin/route.ts   ← Checks email against admin_users table
│   │   ├── signout/route.ts
│   │   └── signout-redirect/route.ts
│   ├── ctroom/auth/verify/         ← Secondary admin verify used by CtroomDashboard
│   └── teller/                     ← Bank connection (Teller API routes)
├── auth/callback/route.ts          ← Magic-link exchange, sets ctroom_last_active cookie
├── vault/page.tsx                  ← Standalone vault route
├── blog/                           ← Sanity-powered blog
└── studio/                         ← Sanity Studio (self-hosted)

lib/
├── supabase.ts                     ← Browser Supabase client
└── utils.ts                        ← cn() class merge helper

middleware.ts                       ← Subdomain rewrites + 5hr sliding inactivity logout
WINDSURF_HANDOFF.md                 ← Session log from previous AI dev work (read for context)
```

### Data Flow — Ctroom

```
CtroomDashboard (master state)
    ↓ useEffect (auth === 'in')
    ↓ Phase 1: parallel → missions, actionItems, userProfile
    ↓ Phase 2: parallel → systems, ideas, messages, usageStats, settings
    ↓ local useState arrays (no Supabase realtime — multi-tab edits won't sync)
    ↓ optimistic updates via CtroomDataService → setActionItems(prev => ...)
    ↓ persists to Supabase + localStorage (sidebar-collapsed, theme, ctroom-accent, user-settings, usage-stats)

Views receive data via props, call handler functions from CtroomDashboard
DreamboardView takes NO props — fully siloed, manages own state internally
VaultView — lazy-mounted, absolute positioned panel (same as Dreamboard)
```

### Auth Flow

```
/ctroom page load
→ CtroomDashboard mounts, shows spinner (mounted flag prevents hydration mismatch)
→ supabase.auth.getSession()
→ POST /api/ctroom/auth/verify with user email
→ checks admin_users table using service-role key
→ if admin: render dashboard | if not: signOut()

Magic link:
→ LoginScreen → supabase.auth.signInWithOtp({ email })
→ email link → /auth/callback?code=...
→ sets ctroom_last_active cookie (5hr maxAge)
→ redirect to /ctroom

Inactivity logout (middleware.ts):
→ every /ctroom request refreshes ctroom_last_active cookie
→ if cookie missing → redirect to /api/auth/signout-redirect
→ session ends, user must re-authenticate
```

---

## Supabase Database

**Project ID:** `fcdzbnuyzdzqkuizvexk` ("kinglive cms", us-east-2)

### Tables

| Table | RLS | Rows | Issue |
|---|---|---|---|
| `admin_users` | ✅ ON | 2 | Good |
| `missions` | ❌ **OFF** | 0 | **SECURITY HOLE — fix immediately** |
| `systems` | ❌ **OFF** | 0 | **SECURITY HOLE — fix immediately** |
| `tasks` | ✅ ON | 0 | |
| `ideas` | ✅ ON | 0 | |
| `vault_transactions` | ✅ ON | 2,249 | Live finance data |

### Immediate SQL Fix (run in Supabase SQL Editor NOW)

```sql
-- Fix the security holes
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (tighter than "all authenticated")
CREATE POLICY "Admin only" ON public.missions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

CREATE POLICY "Admin only" ON public.systems
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));
```

### Known TypeScript Entity Shapes (from CtroomDashboard imports)

```typescript
ActionItem {
  id: string
  title: string
  description?: string
  status: 'todo' | 'done' | 'archived'
  category: string
  priority: string
  date: string
  dueTime?: string
  missionId?: string
  habitFrequency?: string
  habitDuration?: number
  habitCustomDays?: string[]
}

Mission {
  id: string
  name: string
  description?: string
  progress: number        // single integer — needs expanding for history
  status: string          // 'active' | 'completed' | 'paused'
  color: string
  repoUrl?: string
}

System {
  id: string
  frequency: string
  duration: number
  customDays?: string[]
}

Idea {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  date: string
}
```

---

## The AI (Milo) — Current State

**File:** `app/api/chat/route.ts`
**Personality:** "Milo" — King Sharif's elite personal AI assistant, framed as Jarvis from Iron Man.

### What Milo Currently Knows
- King's profile (hardcoded in system prompt): Creative Developer & UX Engineer
- Today's date
- Up to 30 active tasks (title, priority, category, dueDate, dueTime, mission name)
- Active missions (name, description, progress, status)
- `vault` context field EXISTS in the prompt builder but is **never populated** by the dashboard

### What Milo Does NOT Know
- Ideas, systems/habits, blog posts
- Dreamboard contents
- Full task history (archived/done tasks)
- Project drafts, notes, version history
- Finances (vault data field exists but isn't sent)

### Model Routing
```
claude-* → Anthropic Messages API
gpt-*    → OpenAI
groq-llama → Groq (llama-3.3-70b-versatile, 128K ctx, 32768 max output)
gemini-* → Google Gemini generateContent
fallback → gemini-2.0-flash → claude-sonnet-4-6
```

### Current Tools (prompt-injection style, NOT real function-calling)
1. **web search** — Google Custom Search via `googleapis` (⚠️ ~50MB dep — replace with raw fetch)
   - Triggered when query contains: search/find/current/news/latest or is a long question
2. **github** — lists 8 most recently updated repos via GitHub REST API

### Known Bugs in Chat
- Client reads `aiResponse.message || aiResponse.content` but route only returns `content` — `message` is dead code
- Responses are **non-streaming** (single JSON blob) — feels slow for long responses
- No write capability — Milo cannot create tasks, update missions, or touch the database

---

## What We Agreed to Build — Priority Order

### 🔴 Priority 0: Security (Do Before Anything Else)
1. Run the RLS SQL above on `missions` and `systems`
2. Fix the Vercel deployment (wrong app is live at kingslive.vercel.app)
3. Remove `.next/` from git: `git rm -r --cached .next && echo ".next" >> .gitignore`

### 🟠 Priority 1: Make Milo Actually Smart (Jarvis v1)
**Goal:** Milo knows everything about your projects and can take real actions.

**Step 1 — Migrate to Vercel AI SDK with streaming + tool-calling:**
```bash
npm install ai @ai-sdk/anthropic zod
```

**Step 2 — Replace the chat route with streamText + tools:**
```typescript
// app/api/chat/route.ts — new architecture
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages, context } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildSystemPrompt(context), // full context: tasks + missions + ideas + vault
    messages,
    tools: {
      createTask: {
        description: 'Create a new task in the planner',
        parameters: z.object({
          title: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
          dueDate: z.string().optional(),
          missionId: z.string().optional(),
        }),
        execute: async ({ title, priority, dueDate, missionId }) => {
          // call CtroomDataService or Supabase directly
          const { data } = await supabaseAdmin
            .from('tasks')
            .insert({ title, priority, date: dueDate, mission_id: missionId })
            .select().single()
          return { success: true, task: data }
        }
      },
      addIdea: {
        description: 'Capture a new idea',
        parameters: z.object({
          title: z.string(),
          content: z.string(),
          category: z.string().optional(),
        }),
        execute: async (params) => { /* supabase insert */ }
      },
      updateMissionProgress: {
        description: 'Update progress on a project/mission',
        parameters: z.object({
          missionId: z.string(),
          progress: z.number().min(0).max(100),
          note: z.string().optional(),
        }),
        execute: async ({ missionId, progress }) => { /* supabase update */ }
      },
      getFinancialSummary: {
        description: 'Get current financial snapshot from the Vault',
        parameters: z.object({}),
        execute: async () => { /* query vault_transactions */ }
      },
      webSearch: {
        description: 'Search the web for current information',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          // replace googleapis with direct fetch
          const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CX}&q=${encodeURIComponent(query)}`
          )
          const data = await res.json()
          return data.items?.slice(0, 5).map((i: any) => ({ title: i.title, snippet: i.snippet, url: i.link }))
        }
      }
    },
    maxSteps: 5, // agentic loop — Milo can call multiple tools per response
  })

  return result.toDataStreamResponse()
}
```

**Step 3 — Expand context sent to Milo:**
In `CtroomDashboard.tsx`, update `handleSendMessage` to also send:
- All ideas (not just missions + tasks)
- Systems/habits
- Vault summary (monthly spend, top categories, balance) — the field already exists in the prompt builder, just populate it
- Project drafts/notes when added

**Step 4 — Wire streaming on the client:**
Replace the current single-fetch in `ChatView.tsx` with the AI SDK's `useChat` hook:
```typescript
import { useChat } from 'ai/react'
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { context: ctroomContext } // passes your full data context
})
```

### 🟡 Priority 2: Project Tracker With History

**New Supabase table — `mission_revisions`:**
```sql
CREATE TABLE public.mission_revisions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id uuid REFERENCES missions(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,           -- full mission state at this point
  change_summary text,               -- "Updated progress to 60%", "Added task X"
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mission_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON public.mission_revisions
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- Auto-snapshot on every mission update
CREATE OR REPLACE FUNCTION snapshot_mission()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO mission_revisions (mission_id, snapshot)
  VALUES (NEW.id, row_to_json(NEW)::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_history
AFTER UPDATE ON missions
FOR EACH ROW EXECUTE FUNCTION snapshot_mission();
```

**Add to missions table:**
```sql
ALTER TABLE missions ADD COLUMN notes text;           -- rich notes/draft body
ALTER TABLE missions ADD COLUMN tags text[];          -- searchable tags
ALTER TABLE missions ADD COLUMN start_date date;
ALTER TABLE missions ADD COLUMN target_date date;
ALTER TABLE missions ADD COLUMN links jsonb;          -- [{ label, url }]
ALTER TABLE missions ADD COLUMN files jsonb;          -- file references
```

**Update `MissionDetailModal.tsx` to show:**
- Notes/draft area (use `react-markdown` for rendering, textarea for editing)
- Revision history timeline sidebar
- Status change log
- Linked GitHub repo stats (already has `repoUrl`)

### 🟡 Priority 3: Fix the Dreamboard

**The problem:** `DreamboardView` takes no props and likely has no database persistence. Canvas state is probably lost on refresh.

**New Supabase table:**
```sql
CREATE TABLE public.dreamboard_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,               -- 'image' | 'text' | 'goal' | 'link' | 'sticky'
  content text,
  image_url text,
  x float NOT NULL DEFAULT 0,
  y float NOT NULL DEFAULT 0,
  w float NOT NULL DEFAULT 200,
  h float NOT NULL DEFAULT 150,
  color text,
  metadata jsonb,                   -- extra type-specific data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dreamboard_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only" ON public.dreamboard_items
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));
```

**Recommended canvas library: tldraw**
```bash
npm install tldraw
```
Why tldraw over alternatives:
- ~44k GitHub stars, MIT/tldraw license (free for personal use)
- SDK 4.0 ships starter kits: "agent" kit lets Milo read/write the canvas
- Has `@tldraw/mermaid` for diagrams and an MCP server — Milo could literally add cards to your dreamboard
- First-class React, works with Next.js App Router

**Wire DreamboardView to share data with the dashboard:**
- Pass `missions`, `ideas`, `goals` as props so the board can render them as cards
- Save canvas state to `dreamboard_items` table on change (debounced, ~1 second)
- Load from Supabase on mount instead of localStorage

### 🟢 Priority 4: Day Organizer (Time-Block Calendar)

Tasks already have `date` and `dueTime`. The `applyOvertime` function in `CtroomDataService` already handles scheduling shifts. Just need the UI layer.

**Add to PlannerView.tsx:**
```bash
npm install react-big-calendar date-fns
# or lighter option:
npm install @fullcalendar/react @fullcalendar/timegrid @fullcalendar/interaction
```

**Calendar features to build:**
- Day view with 30-min time blocks (default to today)
- Drag tasks from the list onto the calendar to schedule them (sets `dueTime`)
- Click a time block to create a new task
- Color-code by mission/project (already have `mission.color`)
- Show systems/habits as recurring blocks (they already have `frequency` + `duration`)
- "Overtime" button that calls the existing `applyOvertime` handler

---

## The Vault — Finance Dashboard

**Status:** Best-working section. 2,249 live transactions in Supabase. Teller wired.

**Why Teller and not Plaid:** Plaid requires OAuth for Wells Fargo and hasn't granted production access. Teller handles WF directly. This is the right call — stick with Teller.

**Vault improvement priorities:**
1. Wire `teller-connect-react` into the connect button (it's installed but unimported per the last handoff)
2. Add Claude API transaction enrichment: for each raw Teller transaction, POST to `/api/vault/categorize` which calls Claude with: `"Merchant: {name}, Amount: {amount}. Return JSON: { cleanName, category, emoji, isLikelyRecurring }"`
3. Add recurring detection algorithm (see below)
4. Add charts: net-worth-over-time (line), spend-by-category (donut), monthly cashflow (bar) — use `recharts` which is already installed
5. Add interactive calendar view (click date → see bills, click merchant → payment history)

**Recurring detection algorithm (implement in `/api/vault/detect-recurring`):**
```typescript
// Step 1: Group transactions by normalized merchant name
// "KROGER #1842" + "KROGER #2201" → "Kroger"
const normalize = (name: string) =>
  name.replace(/#\d+/g, '').replace(/\b(LLC|INC|CO)\b/gi, '').trim().toLowerCase()

// Step 2: For each group with 3+ occurrences, calculate intervals between dates
// If intervals are consistent (±3 days), flag as recurring
// 28-31 days = monthly, 13-15 days = bi-weekly, 6-8 = weekly

// Step 3: Confidence score
// amount_variance < 5% → +30 confidence
// interval_variance < 3 days → +40 confidence
// 3+ occurrences → +30 confidence
// Subscriptions hit 95-99%, grocery stores hit 70-85%

// Step 4: Predict next date
// last_payment_date + avg_interval = predicted_next
```

**Bank accounts to connect:**
- Wells Fargo (checking + debt accounts)
- Capital One (credit card)
- Fidelity (investments — $50 S&P 500 position)
- Uber Debit (side hustle income tracking)

**Teller integration pattern:**
```typescript
// When transaction hits with merchant matching known debt servicer:
// "NELNET" | "NAVIENT" | "MOHELA" | "STUDENT LOAN"
// → prompt user: "Was this a loan payment? Which account?"
// → on confirm → update loan balance in a local `debts` table

// Side hustle detection:
// Transactions from Uber Debit card → auto-tag as 'hustle_income'
// Show separately in a "Side Hustle" tracker
```

**Financial goals (store in new `financial_goals` table):**
```sql
CREATE TABLE public.financial_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,               -- "Coach Bag", "MacBook", "Emergency Fund"
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  account_name text,                -- "Ally - Coach bucket"
  color text,
  emoji text,
  priority int,
  created_at timestamptz DEFAULT now()
);
```

---

## Dependencies — What to Fix

### Replace Immediately
```bash
# Remove googleapis (~50MB) — replace all usages with direct fetch
npm uninstall googleapis
# In app/api/chat/route.ts, change Google Search to:
# fetch(`https://www.googleapis.com/customsearch/v1?key=${KEY}&cx=${CX}&q=${query}`)
```

### Safe to Remove (confirmed unused per WINDSURF_HANDOFF.md)
```bash
npm uninstall @huggingface/inference
npm uninstall html2canvas          # replace with proper CSV export
npm uninstall react-rnd            # unused drag-resize (unless dreamboard uses it)
npm uninstall styled-components    # unused
npm uninstall @supabase/auth-helpers-nextjs  # deprecated, replaced by @supabase/ssr
npm uninstall @radix-ui/react-toast          # replaced by sonner
```

### Keep But Verify Usage
```bash
# Run: npx depcheck
# Then verify with: git grep "from 'axios'" -- check if actually used
# teller-connect-react — KEEP, wire it up to the connect button
# recharts — KEEP, use it for Vault charts
# @tanstack/react-query — KEEP, use it when you add real-time data fetching
# embla-carousel-react — verify usage, remove if not found
```

### Add
```bash
npm install ai @ai-sdk/anthropic   # Vercel AI SDK for Milo
npm install tldraw                  # Dreamboard canvas
npm install react-big-calendar      # Day organizer calendar view
```

---

## Environment Variables Reference

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # must match the kingslive project, NOT any other project

# AI (Milo)
ANTHROPIC_API_KEY=                 # primary for Milo
OPENAI_API_KEY=                    # fallback
GROQ_API_KEY=                      # groq-llama route
GEMINI_API_KEY=                    # gemini route

# Search
GOOGLE_API_KEY=                    # Custom Search — use direct fetch, not googleapis package
GOOGLE_CX=                         # Custom Search Engine ID

# Finance
TELLER_APPLICATION_ID=             # Teller Connect (bank linking)
TELLER_PRIVATE_KEY=                # Teller webhook verification
NEXT_PUBLIC_TELLER_APPLICATION_ID= # client-side for teller-connect-react

# Content / GitHub
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_TOKEN=
GITHUB_TOKEN=                      # lists repos in Milo's github tool

# Email (Brevo — verify if actually used)
BREVO_API_KEY=

# ⚠️ Do NOT commit .env.local — it is gitignored
```

---

## Known Issues Checklist

| Issue | Priority | Status |
|---|---|---|
| RLS OFF on `missions` + `systems` tables | 🔴 Critical | Not fixed |
| Vercel deploy serving wrong app ("Kings Ultra") | 🔴 Critical | Not fixed |
| `.next/` committed to git | 🔴 High | Not fixed |
| `googleapis` ~50MB dependency | 🟠 High | Not fixed |
| Dreamboard has no persistence | 🟠 High | Not fixed |
| Milo is non-streaming (slow responses) | 🟠 High | Not fixed |
| Milo cannot write to database (no tools) | 🟠 High | Not fixed |
| Milo never receives vault/finance context | 🟡 Medium | Not fixed |
| Milo unaware of ideas/systems/dreamboard | 🟡 Medium | Not fixed |
| Mission tracker has no history/drafts | 🟡 Medium | Not fixed |
| No time-block calendar UI in Planner | 🟡 Medium | Not fixed |
| `teller-connect-react` installed but unimported | 🟡 Medium | Not fixed |
| Dead code: `aiResponse.message` on client | 🟢 Low | Not fixed |
| Two toast systems (sonner + radix toast) | 🟢 Low | Not fixed |
| `@supabase/auth-helpers-nextjs` deprecated | 🟢 Low | Not fixed |
| `package.json` name still "my-v0-project" | 🟢 Low | Not fixed |
| No test framework (no Jest/Vitest/Playwright) | 🟢 Low | Not fixed |

---

## File Naming Conventions

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- API routes: `app/api/[feature]/route.ts`
- Views: `app/ctroom/components/views/[Name]View.tsx`
- Services: `app/ctroom/services/[name]Service.ts`
- Supabase migrations: `supabase/migrations/[timestamp]_[description].sql`

## Code Conventions (from existing codebase)

- `'use client'` at top of all interactive components
- `mounted` state flag before any localStorage reads (hydration safety)
- Optimistic updates: update local state immediately, then call service
- All Supabase queries through service layer, not direct in components
- `cn()` from `@/lib/utils` for all className merging
- Tailwind only — no inline styles, no styled-components
- shadcn/ui components from `@/components/ui/`

---

## Full Software Architecture Check — Run These First

When Claude Code starts a new session, run these commands to understand the current state:

```bash
# 1. See the full project structure
find . -type f -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .next | sort

# 2. Check what's actually imported (vs installed)
npx depcheck

# 3. Check for TypeScript errors
npx tsc --noEmit

# 4. Check bundle size
ANALYZE=true npm run build
# (first add "analyze": "ANALYZE=true next build" to package.json scripts)

# 5. Find all TODO/FIXME/HACK comments
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" . | grep -v node_modules

# 6. Find any hardcoded secrets/keys in source
grep -r "sk-\|Bearer \|apikey" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .env

# 7. Check all Supabase table accesses
grep -r "\.from('" --include="*.ts" --include="*.tsx" . | grep -v node_modules

# 8. Check what env vars are actually used in code
grep -r "process\.env\." --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".env"
```

---

## The Vision — What "Done" Looks Like

**Ctroom** is King's personal command center. When he opens it:
- Milo greets him, knows what's happening today (tasks, deadlines, finances, project status)
- He can say "Milo, add a task to finish the Vault chart by Friday, high priority, KingsLive mission" — and it appears in the planner
- He can say "what's my financial situation?" and Milo pulls from the Vault
- The dreamboard shows his actual goals and vision, persists across sessions
- The planner shows a time-blocked day view of his schedule
- Every project has a history, notes, drafts, and links
- The Vault shows clean categorized transactions, upcoming bills, debt payoff progress, and investment tracking

**This is not a portfolio project. It's his actual HQ.**

---

*Last updated: May 2026. Updated by: Claude (Anthropic) based on full architecture review and planning session with King Sharif.*
*Previous session context: WINDSURF_HANDOFF.md*
