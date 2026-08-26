# CHANGELOG.md

## 2026-08-26 — CTROOM portfolio editor + accurate project docs + merge prep

What: CTROOM Portfolio view (CRUD, GitHub picker, website, cover upload, Featured/Deployed). Supabase migration + static fallback. Descriptions from HireIQ/1942 docs. Homepage loads DB when available.
Files: `app/ctroom/components/views/PortfolioProjectsView.tsx`, `modals/PortfolioProjectFormModal.tsx`, `services/portfolioProjectsService.ts`, `supabase/migrations/20260826_create_portfolio_projects.sql`, `docs/PORTFOLIO.md`, nav + homepage wiring
Why: Edit portfolio from CTROOM; represent real GitHub work correctly; ship to production

## 2026-08-26 — Replace portfolio with King's real GitHub projects

What: Featured HireIQ, DfwNemt, RideNEMT; archive Roomba, Nami, AI Receptionist, KudsiWebsite, 1942, AM African Market. Dropped KingsLive/Sweet Emporium/old NEMT from portfolio list. Updated Sanity relatedProjectId options + cover art.
Files: `lib/portfolio-projects.ts`, `sanity/schemaTypes/postType.ts`, `components/ProjectsSection.tsx`, `public/*-cover.png`
Why: User circled the repos they actually ship
Next: Add live URLs when public; create missing private-repo README blurbs as needed

## 2026-08-26 — Portfolio project UX polish

What: Real `<details>` archive dropdown; tighter professional blurbs; KingsLive ↔ `updating-portfolio` blog link; Roomba repo URL stub (`KingSharif1/roomba-dashboard`)
Files: `lib/portfolio-projects.ts`, `components/ProjectsSection.tsx`
Why: Match “top 3 + dropdown”, blog↔project linking, and straight-to-the-point copy
Next: Create the `roomba-dashboard` GitHub repo; set Sanity `relatedProjectId` on new posts

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
