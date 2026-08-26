# CHANGELOG.md

## 2026-08-26 — Blog fix + docs + portfolio linking

What:
- Fixed blog reads by unifying Sanity project ID (`n31jvc6a`)
- Restored `/studio` Sanity Studio route
- Extended post schema: excerpt, published, relatedProjectId
- Auto-excerpt + publish filter (`published !== false`)
- Blog filters `?project=` / `?tag=`; posts can link to portfolio projects
- Portfolio: top 3 + show-all; Roomba Dashboard (In Progress); professional blurbs
- CTROOM login: Brevo magic-link API (prior commit on same branch)
- Added agent docs + `.env.example`

Files:
- `lib/sanity.ts`, `lib/sanity-queries.ts`, `lib/portfolio-projects.ts`
- `app/studio/[[...tool]]/page.tsx`
- `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`
- `sanity/schemaTypes/postType.ts`, `sanity.cli.ts`
- `components/ProjectsSection.tsx`, `app/globals.css`
- `ARCHITECTURE.md`, `STATUS.md`, `TASKS.md`, `DECISIONS.md`, `docs/BLOG.md`, `.env.example`

Why: Blog showed empty / Studio 404; CTROOM login blocked; handoff docs missing.

Decisions: See DECISIONS.md

Next: Backfill Sanity metadata (TASK BLOG-2); verify Vercel env for Sanity + Brevo

## 2026-08-26 — CTROOM login + portfolio refresh (earlier on branch)

What: Brevo magic links; HireIQ / KingsLive / 1942 featured; skills grid; footer polish
