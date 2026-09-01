# ARCHITECTURE.md — KingsLive

> Last updated: 2026-09-01

## System (one line)

Public portfolio + Sanity blog on kingsharif.com; private CTROOM HQ (auth, Milo, Vault) on `/ctroom`.

## Surfaces

| Surface | Route | Source of truth |
|---------|-------|-----------------|
| Portfolio | `/` | Supabase `portfolio_projects` (`published = true`), static seed only if table missing |
| Blog | `/blog`, `/blog/[slug]` | Sanity project `n31jvc6a` / dataset `production` |
| Studio | `/studio` | Sanity Studio (NextStudio) |
| CTROOM | `/ctroom` | Supabase (`kinglive cms`) + client state in `CtroomDashboard`; views via `lazyViews.tsx` |
| GitHub hub | `/ctroom` → GitHub | PAT (`GITHUB_TOKEN` / Settings) + optional Vercel Deploy Hooks |
| Vault | `/vault` + CTROOM vault view | Supabase `vault_transactions` + Teller |

## Blog data flow

```
Sanity Studio (/studio)
  → documents type "post"
  → CDN read via lib/sanity.ts (projectId from sanity/env.ts)
  → lib/sanity-queries.ts transforms to BlogPost
  → app/blog/* (notes UI) + homepage Latest from the Blog (portfolio rows)
```

`/blog` chrome: `blog-world` is a calm field. Reading column `.blog-read` is the legal pad (equal blue rules, type on a 1.75rem grid). Red double margin is a full-height background rule on `blog-world--note`. Body: Georgia. Titles: Young Serif. Do not reuse `PORTFOLIO_PAGE` / `Header` there.

Studio **Preview** tab uses Presentation + Next draft mode (`/api/draft-mode/enable`). Drafts need `SANITY_API_TOKEN`. Body fetch for a note goes through `/api/blog/note/[slug]` so the token never hits the browser.

Body blocks (Studio insert): Photos, Table (`noteTable` — never `_type: table`), FAQ, Callout, Code. Defined inline on `blockContent` in `blockContentType.ts`. Legacy Image / Image row still render.

Project ↔ post linking:
- Sanity field `relatedProjectId` (e.g. `hireiq`, `roomba-dashboard`)
- Portfolio `PortfolioProject.id` + optional `blogSlug`
- Blog filter: `/blog?project=<id>` · Project row: “Posts about this”

## Auth (CTROOM)

```
LoginScreen → POST /api/ctroom/auth/verify (admin_users)
           → POST /api/ctroom/auth/magic-link
                → supabase.auth.admin.generateLink
                → Brevo SMTP (sender no-reply@kingsharif.com)
           → /auth/callback verifies token_hash → sets cookies + ctroom_last_active
           → /auth/complete broadcasts to the waiting login tab → /ctroom
```

Email clients always open the link in a new browsing context. We cannot target the original tab from the `<a>`. `/auth/complete` tells the waiting `/ctroom` tab via BroadcastChannel (plus session poll); the extra tab can close.

Do **not** rely on Supabase built-in Auth email (`/otp`) — it was failing with “Error sending magic link email”.

## Key folders

```
app/blog/           Public blog UI
app/studio/         Sanity Studio mount
app/ctroom/         Private HQ
lib/sanity*.ts      CMS client + queries
lib/portfolio-projects.ts
components/         Portfolio chrome (Header, Footer, Projects, Skills)
                    Petals: ParticleBackground on public routes only (not /ctroom or /studio)
docs/               ADRs + feature notes
```

## Decisions log

See `DECISIONS.md` and `docs/adr/`.
