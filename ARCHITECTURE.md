# ARCHITECTURE.md — KingsLive

> Last updated: 2026-08-26

## System (one line)

Public portfolio + Sanity blog on kingsharif.com; private CTROOM HQ (auth, Milo, Vault) on `/ctroom`.

## Surfaces

| Surface | Route | Source of truth |
|---------|-------|-----------------|
| Portfolio | `/` | Static React + `lib/portfolio-projects.ts` |
| Blog | `/blog`, `/blog/[slug]` | Sanity project `n31jvc6a` / dataset `production` |
| Studio | `/studio` | Sanity Studio (NextStudio) |
| CTROOM | `/ctroom` | Supabase (`kinglive cms`) + client state in `CtroomDashboard` |
| GitHub hub | `/ctroom` → GitHub | PAT (`GITHUB_TOKEN` / Settings) + optional Vercel Deploy Hooks |
| Vault | `/vault` + CTROOM vault view | Supabase `vault_transactions` + Teller |

## Blog data flow

```
Sanity Studio (/studio)
  → documents type "post"
  → CDN read via lib/sanity.ts (projectId from sanity/env.ts)
  → lib/sanity-queries.ts transforms to BlogPost
  → app/blog/* + homepage Latest from the Blog
```

Project ↔ post linking:
- Sanity field `relatedProjectId` (e.g. `hireiq`, `roomba-dashboard`)
- Portfolio `PortfolioProject.id` + optional `blogSlug`
- Blog filter: `/blog?project=<id>` · Project row: “Posts about this”

## Auth (CTROOM)

```
LoginScreen → POST /api/ctroom/auth/verify (admin_users)
           → POST /api/ctroom/auth/magic-link
                → supabase.auth.admin.generateLink
                → Brevo SMTP email
           → /auth/callback exchanges code → sets ctroom_last_active
```

Do **not** rely on Supabase built-in Auth email (`/otp`) — it was failing with “Error sending magic link email”.

## Key folders

```
app/blog/           Public blog UI
app/studio/         Sanity Studio mount
app/ctroom/         Private HQ
lib/sanity*.ts      CMS client + queries
lib/portfolio-projects.ts
components/         Portfolio chrome (Header, Footer, Projects, Skills)
docs/               ADRs + feature notes
```

## Decisions log

See `DECISIONS.md` and `docs/adr/`.
