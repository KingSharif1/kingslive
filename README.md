<div align="center">

# kingsharif.com

**The personal site of King Sharif** — portfolio, blog, and private HQ.
Built like a place, not a page.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Sanity](https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white)](https://www.sanity.io/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

### [✦ Step inside →](https://kingsharif.com)

</div>

---

> *"Build things that are personal, smart, and actually solve problems."*

I'm **King Sharif** — a full-stack developer in Fort Worth, TX, building in public and documenting the whole thing.

## The tour

| Room | What's inside |
|------|---------------|
| [`/`](https://kingsharif.com) | **Portfolio** — dark and editorial. The work, the proof, the contact form. |
| [`/blog`](https://kingsharif.com/blog) | **Cerebration** — the blog as a library. Every post is a cloth-bound volume on a wooden shelf; opening one feels like opening an old book worth reading. |
| `/ctroom` | **CTROOM** — the private HQ. Vision board, tasks, notes, chat. Login-gated on purpose. |

Currently: shipping **HireIQ** (the job-search workspace), teaching a Roomba to be dumb on purpose, and writing it all down.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) · React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind · shadcn/ui · Framer Motion |
| Content | Sanity v4 (blog + studio at `/studio`) |
| Auth & data | Supabase |
| Deploy | Vercel |

---

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Needs Supabase + Sanity keys at minimum. The portfolio renders without them; the blog and CTROOM won't.

---

## The shape of it

```
app/
├── page.tsx          # Portfolio
├── blog/             # Cerebration — the library
├── studio/           # Sanity Studio
├── ctroom/           # Private HQ (auth-gated)
components/           # UI, one concern per folder
lib/                  # Shared helpers + Sanity queries
```

---

## Status

Active personal project. It's public for transparency — the code is mine, not a template, and not open for contributions.

<div align="center">

**Built by King Sharif** · [kingsharif.com](https://kingsharif.com)

</div>
