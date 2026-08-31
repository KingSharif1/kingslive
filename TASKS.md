## Task BLOG-4 — Notes room polish + webpack/load fixes + deploy
Status: DONE
Scope: blog pages, next.config, CtroomDashboard lazy views, Studio loading
Result: Server-rendered notes list; likes via API (no Supabase in blog JS); 3:2 contained covers; petals homepage-only; CTROOM views lazy.
Files changed: see CHANGELOG 2026-08-31 BLOG-4

## Task PORT-7b — repo_public columns + Studio quote hydration
Status: DONE
Scope: Supabase `portfolio_projects`, Studio mount, quote style
Result: Columns added on kinglive cms; HireIQ/KingsLive/1942 marked public. Studio client-only; quote style is a span.
Files changed: see CHANGELOG 2026-08-31

## Task PORT-7 — CTROOM project save + frontend visibility
Status: DONE
Scope: portfolio service/API, form, homepage, `portfolio_projects` seed
Result: Saves go through admin API (service role) so RLS no longer blocks. 11 seed rows in kinglive cms. `published` = show on frontend. Homepage no longer overlays static seed.
Files changed: see CHANGELOG 2026-08-30 PORT-7

## Task AUTH-2 — Login scanline overflow + same-tab magic-link handoff
Status: DONE
Scope: `LoginScreen.tsx`, `globals.css`, `app/auth/callback/route.ts`, `app/auth/complete/page.tsx`, `lib/ctroom-auth-channel.ts`
Result: Scanline clipped so it cannot grow the document (Windows blue scrollbar flash). Magic-link click still opens whatever tab the email client chooses; `/auth/complete` broadcasts so the waiting CTROOM tab signs in.
Files changed: see CHANGELOG 2026-08-30 AUTH-2

## Task PORT-6 — Numbered project rows, generic skills, faster first paint
Status: DONE
Scope: `components/ProjectsSection.tsx`, `components/SkillsSection.tsx`, `app/page.tsx`, petals, `app/ctroom/loading.tsx`
Result: Full-width numbered project rows (no HighlightCards); skill hints are Product UI / Data / Models / Editors; added Three.js, AWS, Cursor, Windsurf, Antigravity; homepage no longer waits on `mounted`; fewer petals; CTROOM route loading shell
Files changed: see CHANGELOG 2026-08-30 PORT-6

## Task BLOG-3 — Blog is a different room from the portfolio
Status: DONE
Scope: `app/blog/**`, `components/BlogNav.tsx`, `app/globals.css`
Result: `/blog` is paper/ink + bleed type + shelf volumes; posts use BlogNav, full-bleed cover, reading column. Homepage still uses numbered blog teasers. Not portfolio glass/Header.
Files changed: see CHANGELOG 2026-08-30 BLOG-3

## Task PORT-5 — Flowers, unique skills, dead weight
Status: DONE
Scope: ParticleBackground, globals.css, SkillsSection, unused UI/mocks
Result: Sakura petals restored on public routes only; mouse-follow ring + logo follower removed; skills are unique (Stripe, Strapi, xAI, GitHub, Neon, React Native, Groq); deleted mocks + unused carousel/pagination/mode-toggle
Files changed: see CHANGELOG 2026-08-30

## Task PORT-4 — Portfolio layout, copy, atmosphere
Status: DONE
Scope: `app/page.tsx`, `app/blog/**`, `components/ProjectsSection.tsx`, `components/SkillsSection.tsx`, `lib/portfolio-projects.ts`, ambient bg, chrome
Result: Restored glass page shell; numbered project rows (top 3 featured, rest newest-first on load-all); longer copy; extra projects (KingsLive, Sweet Emporium); Simple Icons; rotating role; commit counts without messages; blog matches portfolio chrome
Files changed: see CHANGELOG 2026-08-27
Notes: Public GitHub only lists HireIQ, kingslive, 1942 as public — other repos stay private (no GitHub link)

## Task BLOG-1 — Make blog work end-to-end
Status: DONE
Scope: `lib/sanity.ts`, `lib/sanity-queries.ts`, `app/studio/**`, `app/blog/**`, `sanity/schemaTypes/postType.ts`
Result: Unified Sanity project `n31jvc6a`; restored Studio; publish/excerpt/relatedProject fields; blog↔project filters
Files changed: see CHANGELOG 2026-08-26

## Task AUTH-1 — CTROOM magic link delivery
Status: DONE
Scope: `app/api/ctroom/auth/magic-link/**`, `app/ctroom/services/authService.ts`
Result: Brevo-backed magic links bypass broken `/otp` email

## Task PORT-1 — Featured projects + expand
Status: DONE
Scope: `lib/portfolio-projects.ts`, `components/ProjectsSection.tsx`
Result: Top 3 default; show-all for archive; Roomba Dashboard In Progress; project↔blog links

## Task DOCS-1 — Agent handoff docs
Status: DONE
Scope: `ARCHITECTURE.md`, `STATUS.md`, `TASKS.md`, `DECISIONS.md`, `CHANGELOG.md`, `docs/BLOG.md`, `.env.example`
Result: Session-start docs restored

## Task PORT-3 — Timeline + dots + private GitHub hide
Status: DONE
Scope: `lib/portfolio-projects.ts`, `components/ProjectsSection.tsx`, `app/globals.css`, `app/page.tsx`, `app/api/github/repo-stats/route.ts`, portfolio form/service/migration
Result: Restored interactive bg dots (light+dark); fixed URLs (DfwNemt/Kudusi/Nami/AI Receptionist/Roomba); hide GitHub unless `repoPublic`; top-3 light highlights + load-all chronological timeline; public repos show commit count + latest commit via API
Files changed: see CHANGELOG
Notes: Message about timeline UX was cut off mid-sentence — shipped highlights + full timeline expand

## Task BLOG-2 — Backfill Sanity metadata
Status: PENDING
Scope: Sanity Studio content only (no code)
Result:
Files changed:
Notes: For each post, set publishedAt, excerpt, published=true, relatedProjectId where relevant

## Task GH-1 — CTROOM GitHub hub (connect, merge, deploy)
Status: DONE
Scope: `app/ctroom/components/views/GitHubView.tsx`, `app/api/ctroom/github/**`, sidebar/types/dashboard, docs
Result: New CTROOM GitHub view with connection status, repo select, PR merge, Vercel deploy hooks. Settings PAT / GITHUB_TOKEN still the connect path (no OAuth App).
Files changed: GitHubView.tsx, merge/deploy/status routes, Sidebar, MobileHeader, CtroomDashboard, types, docs/GITHUB.md, .env.example, TASKS/STATUS/CHANGELOG
Notes: Show connection status; select repo; merge open PRs; trigger Vercel deploy hooks

## Task UI-1 — Portfolio design consistency (no fluff / no public CTROOM)
Status: DONE
Scope: `components/ProjectsSection.tsx`, `components/Footer.tsx`, `components/SkillsSection.tsx`, `app/ctroom/components/views/GitHubView.tsx`, `PortfolioProjectsView.tsx`
Result: Removed marketing subtitles and public CTROOM footer link; projects archive matches existing list + button pattern; CTROOM GitHub/Portfolio views use HQ styling
Files changed: ProjectsSection, Footer, SkillsSection, GitHubView, PortfolioProjectsView, TASKS/CHANGELOG
Notes: Public site stays portfolio-only; CTROOM stays private

## Task PORT-2 — Live URLs from docs + expand skills
Status: DONE
Scope: `lib/portfolio-projects.ts`, `components/SkillsSection.tsx`
Result: Added verified live URLs (HireIQ kingsharif.com, RideNEMT app, AM African Market). Expanded skills to 22 from real stacks. Could not verify DfwNemt, Kudsi, Nami, AI Receptionist URLs from public docs.
Files changed: portfolio-projects.ts, SkillsSection.tsx
Notes: Private repos need GITHUB_TOKEN or user-supplied URLs

## Task CTROOM-VISION — Full HQ product
Status: PENDING (deferred)
Scope: ctroom/*
Notes: Long-running. Do not start until blog/portfolio are stable.
