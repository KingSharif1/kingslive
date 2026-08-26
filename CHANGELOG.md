# CHANGELOG.md

## 2026-08-26 — Task PORT-3b: Real website cover screenshots
What: Captured live hero screenshots for all portfolio projects (HireIQ, RideNEMT, Roomba, DfwNemt/nemtbiling, Nami, AI Receptionist/LineDesk login, Kudusi, 1942, AM African Market). Stored as optimized JPEGs in `public/*-cover.jpg`. Kudusi required Cloudflare bypass via real browser.
Files: `public/*-cover.jpg`, `public/1942-forgotten.jpg`, `lib/portfolio-projects.ts`, form default image path
Why: User asked for real website images instead of placeholders
Next: If Supabase already seeded old image paths, re-seed or edit covers in CTROOM

## 2026-08-26 — Task PORT-3: Timeline, dots, private GitHub, URLs
What: Restored mouse-follow dot grid for light+dark (removed shell blur that hid it). Corrected live URLs (nemtbiling.com, kudusi.org, nami/vapi/roomba.kingsharif.com); renamed Kudsi→Kudusi. Public site only shows GitHub when `repoPublic`. Projects UI: top-3 light highlight cards; in-progress by timeline; Load all → chronological timeline. Public repos fetch commit count + latest commit via `/api/github/repo-stats`.
Files: `app/globals.css`, `app/page.tsx`, `lib/portfolio-projects.ts`, `components/ProjectsSection.tsx`, `app/api/github/repo-stats/route.ts`, portfolio form/service/migration, TASKS/STATUS
Why: User asked for missing dots, private-repo GitHub hide, correct URLs/names, timeline UX, public commit activity
Next: If Supabase portfolio table already seeded, re-seed or edit rows in CTROOM so URLs/repoPublic stick

## 2026-08-26 — Task PORT-2: Live URLs + fuller skills
What: Verified production URLs from HireIQ docs + live hosts; expanded Skills to 22 tools used across projects (Framer, Vite, shadcn, Sanity, Claude, AI SDK, Teller, etc.).
Files: `lib/portfolio-projects.ts`, `components/SkillsSection.tsx`
Why: Many projects had websites missing; skills list was too thin vs real stack
Next: User can supply DfwNemt / Kudsi / Nami / AI Receptionist URLs (not found in public docs)

## 2026-08-26 — Task UI-1b: Restore curves + skill logos/motion
What: Rounded project/skill/button corners again; Skills section uses SVG logos + framer-motion stagger/hover.
Files: `components/ProjectsSection.tsx`, `components/SkillsSection.tsx`
Why: Sharp corners broke the existing rounded portfolio language; skills needed logos + motion
Next: —

## 2026-08-26 — Task UI-1: Portfolio design consistency
What: Stripped fluff copy from projects/skills; removed CTROOM from public footer; restored archive as simple show-all control (not a boxed `<details>`); aligned CTROOM GitHub/Portfolio chrome with HQ styling.
Files: `components/ProjectsSection.tsx`, `components/Footer.tsx`, `components/SkillsSection.tsx`, `app/ctroom/components/views/GitHubView.tsx`, `PortfolioProjectsView.tsx`
Why: New sections looked unlike the rest of the site; public portfolio should not advertise CTROOM
Next: Keep public marketing copy minimal when editing projects

## 2026-08-26 — Task GH-1: CTROOM GitHub hub
What: Dedicated GitHub view — connection status (env PAT vs Settings), repo picker, merge open PRs, Vercel Deploy Hook redeploy. Admin-gated merge/deploy APIs.
Files: `app/ctroom/components/views/GitHubView.tsx`, `app/api/ctroom/github/{status,merge,deploy}/route.ts`, Sidebar/MobileHeader/CtroomDashboard/types, `docs/GITHUB.md`, `.env.example`
Why: User asked to see if GitHub is connected and to select a project then merge + deploy from CTROOM
Decisions: PAT (not OAuth App) for v1; deploy via Vercel Deploy Hooks rather than full Vercel API OAuth
Next: Optional GitHub OAuth App; wire portfolio/mission repos into the same hub

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
