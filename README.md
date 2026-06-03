# King Sharif — Personal Site & Ctroom

Personal portfolio and productivity dashboard built with Next.js 15, Supabase, and multiple AI integrations.

---

## What's in here

Two distinct things live in this repo:

**Portfolio** — the public-facing site at the root domain. Minimal dark design, blog powered by Sanity CMS, particle background, contact form.

**Ctroom** — a private personal dashboard at `/ctroom`. Think of it as a command room for daily life: task management, project tracking, AI chat, finance tracking, idea capture, and a daily planner. Auth-gated (Supabase).

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Auth & DB | Supabase (Postgres + Row Level Security) |
| CMS | Sanity v4 (blog posts) |
| AI | Google Gemini 2.0 Flash, OpenAI GPT-4o, Groq |
| Finance sync | Teller API (bank account linking) |
| Charts | Recharts |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Ctroom Modules

| Module | Description |
|---|---|
| Dashboard | Daily overview — tasks due, active projects, quick stats |
| Chat | Multi-model AI chat (GPT-4o, Gemini, Groq Llama) with tool support |
| Missions | Project tracker with GitHub integration, domain monitoring, deployment status |
| Planner | Day/week view, time-blocking, habit systems |
| Tasks | Action items with priority, category, and mission linkage |
| Ideas | Quick capture with tagging and AI expansion |
| Vault | Personal finance — bank sync via Teller, transactions, budgets, debt tracking, savings goals, recurring subscriptions, AI nudges |
| Dreamboard | Vision board / goal visualization |
| Blog | Read and write posts (Sanity-backed) |

---

## Vault — Finance Dashboard

The Vault connects to real bank accounts via Teller and runs a Gemini AI layer on top of your transactions to surface actionable nudges:

- Links checking, savings, credit, and loan accounts
- Auto-categorizes transactions with rule-based + AI override
- Tracks debts with balance projection and payoff timeline
- Tracks savings goals with SVG progress rings
- Detects recurring subscriptions automatically
- Budget categories with monthly limits and spending pace
- **AI Nudges** — when Gemini detects a student loan payment in your transactions, it suggests updating your debt balance. Same for savings deposits → goal contributions.

---

## Local Development

```bash
# Install
npm install

# Environment variables (see .env.example)
cp .env.example .env.local

# Run
npm run dev
```

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
GEMINI_API_KEY=
TELLER_APPLICATION_ID=
TELLER_SIGNING_SECRET=
```

---

## Project Structure

```
app/
  page.tsx              # Portfolio home
  blog/                 # Blog routes (Sanity)
  ctroom/
    page.tsx            # Dashboard entry (auth-gated)
    components/
      CtroomDashboard   # Root layout + nav
      views/            # One file per module (VaultView, ChatView, etc.)
    types/index.ts      # All shared TypeScript types
  api/
    ctroom/             # API routes (teller, vault, github, ai)
  privacy/              # Privacy policy (for Plaid/Teller apps)
  terms/                # Terms of service
components/             # Portfolio components (Header, Footer, etc.)
lib/                    # Supabase client, utilities
```

---

## Status

Active personal project. Not open for contributions — just making it public for transparency and portfolio purposes.

Built by [King Sharif](https://github.com/KingSharif1).
