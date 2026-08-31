# CHANGELOG.md

## 2026-08-31 — Task BLOG-4: Notes polish, webpack crash, faster CTROOM
What: Blog copy is a journal. King · Notes → `/blog`; Home → `/`. Covers are a contained 3:2 photo (~280px). Likes go through `/api/blog/likes`. Notes list fetches `/api/blog/notes` so the page JS does not import Sanity/Supabase. Waiting API calls show pulse placeholders (blog shelf, homepage posts/projects, GitHub commit meta). Petals are homepage-only. CTROOM views lazy-load.
Files: `app/blog/page.tsx`, `BlogLikeButton.tsx`, `app/api/blog/likes/route.ts`, `app/api/blog/notes/route.ts`, `globals.css`, `next.config.js`, `lazyViews.tsx`, `app/page.tsx`, `ProjectsSection.tsx`
Why: `/blog` crashed on `import('@/lib/supabase-lazy')`; images were oversized; first compile pulled 1500+ modules; empty gaps while APIs ran
Decisions: Server APIs for likes/notes. Canvas webpack externals are server-only. No dual lucide transforms.
Next: Production deploy

## 2026-08-31 — Studio SSR crash, theme hydration, image warnings
What: Studio config no longer loads on the server (jsdom `default-stylesheet.css` ENOENT). Theme toggle dropped styled-jsx so class hashes match. Next `images.qualities` includes 85; favicon `sizes` set; homepage reuses the shared Supabase client.
Files: `StudioClient.tsx`, `StudioApp.tsx`, `ThemeTransition.tsx`, `globals.css`, `next.config.js`, `Header.tsx`, `BlogNav.tsx`, `portfolioProjectsService.ts`
Why: `/` and `/studio` were 500s; theme button hydrated with different `jsx-*` hashes
Next: Restart `npm run dev` after `next.config.js` change


## 2026-08-31 — portfolio_projects columns + Studio quote HTML
What: Added `repo_public` and `timeline_date` on kinglive cms; set public GitHub on HireIQ, KingsLive, 1942 plus timeline dates. Studio mounts client-only; Quote style renders as a span so Sanity UI cannot nest `<div>` in `<p>`. Recurring scan maps `yearly` → `annual`.
Files: `sanity/schemaTypes/blockContentType.ts`, `app/studio/[[...tool]]/*`, `lib/vault/recurringScan.ts`
Why: Those columns were missing so GitHub-public could not persist. Studio logged a hydration warning from invalid quote markup.
Decisions: DDL via Supabase MCP on `fcdzbnuyzdzqkuizvexk`. Studio `ssr: false` avoids hydrating Sanity PTE.
Next: Public GitHub checkbox in CTROOM should now stick after save


## 2026-08-30 — Task PORT-7: Project settings actually persist
What: CTROOM project save used a session-less anon client, so RLS rejected writes and the UI was editing a static fallback. Writes now go through `/api/ctroom/portfolio` with the admin session. Seeded 11 rows into `portfolio_projects`. `published` / Hide from site controls the public homepage. Stopped merging static seed over DB values.
Files: `app/api/ctroom/portfolio/route.ts`, `portfolioProjectsService.ts`, `PortfolioProjectFormModal.tsx`, `PortfolioProjectsView.tsx`, `lib/portfolio-projects.ts`, `components/ProjectsSection.tsx`, `app/page.tsx`, `lib/vault/recurringScan.ts`
Why: Save looked like it worked on fake rows; homepage ignored DB edits
Decisions: Service-role API for admin CRUD (same pattern as bootstrap). Recurring scan maps unknown `bill_type` to `subscription`/`bill`/`loan` so Vault sync does not 23514.
Next: Run the two `ALTER TABLE` lines in `20260826_create_portfolio_projects.sql` if GitHub-public / timeline date should persist (`repo_public` column is still missing on the live table)

## 2026-08-30 — Task AUTH-2: Login slide + magic-link tab handoff
What: Contained the CRT scanline so `top: 100%` cannot add document height (that was the random slide + blue scrollbar). After `/auth/callback`, land on `/auth/complete` which tells the original CTROOM tab to sign in via BroadcastChannel + session poll.
Files: `app/globals.css`, `app/ctroom/components/LoginScreen.tsx`, `app/auth/callback/route.ts`, `app/auth/complete/page.tsx`, `lib/ctroom-auth-channel.ts`
Why: Email clients cannot target an existing tab. The waiting tab can still become the live session.
Decisions: `window.close()` on the extra tab is best-effort (browsers block it unless script-opened). Fallback copy + “Enter CTROOM here”.
Next: Confirm `no-reply@kingsharif.com` in production env if Vercel still lacks `BREVO_API_KEY`


## 2026-08-30 — Task PORT-6: Rows back, generic skills, faster paint
What: Projects are numbered 12-col rows again (bigger type + cover). Skills use short hints only (Product UI, Data, Models, Editors) plus Three.js, Neon, Strapi, AWS, Cursor, Windsurf, Antigravity. Homepage renders immediately instead of a blank `mounted` gate. Fewer petals. CTROOM `loading.tsx` for first paint.
Files: `components/ProjectsSection.tsx`, `components/SkillsSection.tsx`, `app/page.tsx`, `components/ParticleBackground.tsx`, `app/ctroom/loading.tsx`
Why: Compact HighlightCards and project-name blurbs felt like a step backward; first paint was blocked until hydrate
Decisions: Milo token streaming is still later — this pass is layout + perceived load, not a chat rewrite
Next: Stream Milo responses when we pick that task

## 2026-08-30 — Task BLOG-3: Notes room (not portfolio)
What: Blog list/posts left the glass shell. Paper + ink, bleed “notes”, bookshelf volumes, petal selection, BlogNav (“King · Notes”). Posts: bleed cover, serif title, `blog-read` column; likes/comments/share kept.
Files: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `components/BlogNav.tsx`, `app/globals.css`
Why: Matching the homepage made the blog generic; refs (Alim / checklist.design / Ahmed / Omer) are a reading room, not a project list
Decisions: Homepage “Latest from the Blog” stays numbered rows. `/blog` is its own world.
Next: Sanity metadata backfill (BLOG-2)

## 2026-08-30 — Task PORT-5: Petals back, no mouse ring, unique skills
What: Restored falling-petal canvas on `/`, `/blog`, legal pages (off on CTROOM/studio). Removed mouse spotlight circle and logo follower. Skills list is unique with Stripe, Strapi, Neon, xAI, GitHub, React Native, Groq. Dropped unused mocks + carousel/pagination/mode-toggle; embla/html2canvas already gone from package.json.
Files: `components/ParticleBackground.tsx`, `ParticleBackgroundWrapper.tsx`, `SkillsSection.tsx`, `app/globals.css`, `app/layout.tsx`, `components/usePortfolioTheme.ts`
Why: User wanted flowers, no follow-circle, no duplicate skill marks, a cleaner/faster public site
Next: Do not delete CTROOM/Vault/Studio — those are product, not junk

## 2026-08-27 — Task PORT-4: Portfolio glass, rows, skills, blog chrome
What: Restored frosted `bg-background/30` + main backdrop; projects as numbered 12-col rows (top 3 featured, Load all newest→oldest); longer descriptions; added KingsLive + My Sweet Emporium; Simple Icons + short skill labels; rotating title; repo stats show commit count + created/updated only; drifting light orbs + logo follow; blog list/post use the same header/shell/row language.
Files: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `components/ProjectsSection.tsx`, `components/SkillsSection.tsx`, `components/ParticleBackground.tsx`, `components/AmbientAtmosphere.tsx`, `components/RotatingRole.tsx`, `lib/portfolio-projects.ts`, `lib/portfolio-chrome.ts`, `app/api/github/repo-stats/route.ts`, `public/kingslive-cover.jpg`, `public/sweet-emporium-cover.jpg`
Why: New production drifted from the old list layout and glass page; skills copy/logos and blog UI didn’t match
Decisions: Kept 3D raymarch mascot out — too heavy; used logo lerp + soft lights. Public GitHub only has HireIQ/kingslive/1942.
Next: Re-seed `portfolio_projects` in CTROOM if you want DB rows to match seed (homepage already overlays seed copy)

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
