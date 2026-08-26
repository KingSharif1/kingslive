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

## Task CTROOM-VISION — Full HQ product
Status: PENDING (deferred)
Scope: ctroom/*
Notes: Long-running. Do not start until blog/portfolio are stable.
