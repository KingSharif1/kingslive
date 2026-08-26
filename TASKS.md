# TASKS.md — shared agent queue

> Claim one task, finish it, mark DONE, stop unless told otherwise.

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

## Task CTROOM-VISION — Full HQ product
Status: PENDING (deferred)
Scope: ctroom/*
Notes: Long-running. Do not start until blog/portfolio are stable.
