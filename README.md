<div align="center">

# 👑 KingsLive

### My personal site — portfolio up front, experiments in the back.

_Not a demo. Not a portfolio toy. Stuff I actually use._

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[**Live →**](https://kingslive.vercel.app) &nbsp;·&nbsp; [**@KingSharif1**](https://github.com/KingSharif1)

</div>

---

## 👋 What this is

I'm King Sharif — creative developer, UX engineer, and entrepreneur out of Fort Worth, TX.

This is my corner of the internet. The public side is a clean, dark portfolio with a Sanity-powered blog. Behind that, there's some private tooling I built for myself — auth-gated, not really meant for public walkthroughs.

Philosophy stays the same: **build things that are personal, smart, and actually solve your problems.**

---

## 🌐 What's public

| | |
|---|---|
| **Portfolio** | Minimal dark design, particle background, the work |
| **Blog** | Posts powered by Sanity CMS |
| **Contact** | Reach me from the site |

Everything else in the repo is mostly personal infrastructure. If you stumble on routes that need a login, that's intentional.

---

## 🧱 Stack

| Layer | What I'm using |
|---|---|
| **Framework** | Next.js 15 (App Router) · React 18 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 · shadcn/ui · Framer Motion |
| **Auth & DB** | Supabase |
| **CMS** | Sanity v4 |
| **Deploy** | Vercel |

---

## 🛠️ Run it locally

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

You'll need Supabase + Sanity configured at minimum. The rest depends on what you're trying to run.

---

## 🗺️ Layout (high level)

```
app/
├── page.tsx          # Portfolio
├── blog/             # Blog routes
├── studio/           # Sanity Studio
components/           # Portfolio UI
lib/                  # Shared utilities
```

---

## 📌 Status

Active personal project. Not open for contributions — repo is public for transparency and portfolio purposes.

<div align="center">

**Built by King Sharif** — [github.com/KingSharif1](https://github.com/KingSharif1)

_Build things that are personal, smart, and actually solve your problems._

</div>
