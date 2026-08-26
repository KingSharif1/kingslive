# DECISIONS.md

## 2026-08-26 — GitHub in CTROOM = PAT + Deploy Hooks (not OAuth)
- **Context:** Need connection status, merge PRs, and deploy from CTROOM without a full GitHub App.
- **Options:** GitHub OAuth App / GitHub App / Personal Access Token + Vercel Deploy Hooks.
- **Choice:** PAT via `GITHUB_TOKEN` or Settings → Integrations; merge via GitHub REST; deploy via Deploy Hook URL (localStorage or `VERCEL_DEPLOY_HOOKS` JSON).
- **Tradeoff:** No “Sign in with GitHub” button; token scopes must include write for merge. Deploy Hook is per-project, not auto-discovered.
- **Revisit if:** Multi-user CTROOM or want OAuth UX / Vercel API project listing.

## 2026-08-26 — Blog CMS = Sanity project `n31jvc6a`
- **Context:** `lib/sanity.ts` fell back to placeholder `py58y528` (no dataset). Real posts live on `n31jvc6a`.
- **Options:** Keep dual IDs / migrate / unify on `n31jvc6a`.
- **Choice:** Single source — `sanity/env.ts` → `lib/sanity.ts`.
- **Tradeoff:** Must set `NEXT_PUBLIC_SANITY_PROJECT_ID` on Vercel to match.
- **Revisit if:** Content moves to another Sanity project.

## 2026-08-26 — CTROOM magic links via Brevo
- **Context:** Supabase `/otp` returned “Error sending magic link email”.
- **Choice:** `generateLink` + Brevo SMTP (same stack as contact form).
- **Tradeoff:** Depends on `BREVO_API_KEY` and verified sender `no-reply@kingsharif.live`.
- **Revisit if:** Custom SMTP is configured correctly inside Supabase Auth.

## 2026-08-26 — Project ↔ blog linking via string IDs
- **Context:** Need Roomba / HireIQ posts tied to portfolio rows without a second CMS.
- **Choice:** Sanity `relatedProjectId` string enum matching `PortfolioProject.id`.
- **Tradeoff:** Manual sync of IDs in schema list + `lib/portfolio-projects.ts`.
- **Revisit if:** Projects move into Sanity as documents.

## Earlier ADRs
See `docs/adr/` (admin model, Teller, advisor tools, recurring detection).
