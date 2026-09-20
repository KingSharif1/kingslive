<div align="center">

# kingsharif.com

### Personal site — portfolio, blog, private HQ

_Repo name: `kingslive` · Live brand: **King Sharif**_

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[**Live →**](https://kingsharif.com) &nbsp;·&nbsp; [**@KingSharif1**](https://github.com/KingSharif1)

</div>

---

## What this is

I'm **King Sharif** — full-stack developer in Fort Worth, TX.

Public side: dark editorial portfolio + Sanity blog (developer journey).  
Private side: CTROOM HQ (auth-gated) — vision board, tasks, notes, chat.

**Build things that are personal, smart, and actually solve problems.**

---

## Public surfaces

| Surface | Route |
|---------|-------|
| Portfolio | `/` |
| Blog | `/blog` |
| Contact | site form |

Login-gated routes are intentional (CTROOM).

Open polish work: [issue #12](https://github.com/KingSharif1/kingslive/issues/12) · [PR #13](https://github.com/KingSharif1/kingslive/pull/13)

---

## Stack

| Layer | |
|-------|--|
| Framework | Next.js 15 (App Router) · React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind · shadcn/ui · Framer Motion |
| Auth & DB | Supabase |
| CMS | Sanity v4 |
| Deploy | Vercel |

---

## Local

```bash
npm install
cp .env.example .env.local   # fill keys
npm run dev
```

Needs Supabase + Sanity at minimum.

---

## Layout

```
app/
├── page.tsx          # Portfolio
├── blog/             # Sanity blog
├── studio/           # Sanity Studio
├── ctroom/           # Private HQ (auth)
components/           # Portfolio UI
lib/                  # Shared + Sanity
docs/                 # ADRs + notes
```

## Agent docs

| Doc | Purpose |
|-----|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System map |
| [STATUS.md](./STATUS.md) | Working / blocked |
| [TASKS.md](./TASKS.md) | Task queue |
| [DECISIONS.md](./DECISIONS.md) | Why |
| [CHANGELOG.md](./CHANGELOG.md) | Recent |
| [docs/BLOG.md](./docs/BLOG.md) | Blog ops |

---

## Status

Active personal project. Public for portfolio transparency — not open for contributions.

<div align="center">

**Built by King Sharif** — [kingsharif.com](https://kingsharif.com)

</div>
