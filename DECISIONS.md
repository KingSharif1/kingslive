# DECISIONS.md

## 2026-08-31 — Webpack chunks: async, not all
- **Context:** `/blog` threw `Cannot read properties of undefined (reading 'call')` after likes lazy-import Supabase.
- **Options:** Remove custom splitChunks / keep `chunks: 'all'` / restrict to async.
- **Choice:** Drop custom `splitChunks` cache groups. Next.js default splitting is used. Do not combine `modularizeImports` + `optimizePackageImports` on lucide-react. Typecheck `target` is ES2017.
- **Tradeoff:** Slightly less aggressive vendor splitting on first paint; dynamic imports stay valid webpack modules.
- **Revisit if:** Bundle analyzer shows a bloated initial vendor again.

## 2026-08-30 — Blog UI ≠ portfolio UI
- **Context:** Matching `/blog` to the homepage (glass + numbered rows) made writing feel generic.
- **Options:** Same chrome everywhere / a separate notes room (paper, bleed, shelf).
- **Choice:** Separate room. Data still Sanity; homepage teasers stay numbered rows.
- **Tradeoff:** Two visual systems to maintain. Worth it so articles feel like reading, not a project list.
- **Revisit if:** You want a single design language after the notes room settles.

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
- **Tradeoff:** Depends on `BREVO_API_KEY` and verified sender `no-reply@kingsharif.com`. If Brevo IP allowlisting is on, local/Vercel IPs must be authorised or magic-link sends return 401.

## 2026-08-30 — Portfolio writes via admin API, not anon client
- **Context:** CTROOM save used a new `createClient()` with no cookie session, so upserts ran as anon and RLS returned 42501. Homepage `mergeWithStaticSeed` overwrote DB fields and re-added hidden projects.
- **Choice:** `/api/ctroom/portfolio` + service role after `verifyAdminAuth`. Public site reads `published = true` only.
- **Tradeoff:** Edits need a live session token. `repo_public` / `timeline_date` still need an ALTER on the live table.
- **Revisit if:** The SQL Editor ALTERs land and we want those flags in the schema cache.

- **Context:** Clicking the email link always opens a new browsing context; we cannot force the original tab.
- **Choice:** `/auth/complete` + BroadcastChannel + session poll on the waiting login screen.
- **Tradeoff:** Extra tab still exists; we ask the user to close it. Cross-browser (Outlook → different browser) cannot hand off — use “Enter CTROOM here”.
- **Revisit if:** Custom SMTP is configured correctly inside Supabase Auth.

## 2026-08-26 — Project ↔ blog linking via string IDs
- **Context:** Need Roomba / HireIQ posts tied to portfolio rows without a second CMS.
- **Choice:** Sanity `relatedProjectId` string enum matching `PortfolioProject.id`.
- **Tradeoff:** Manual sync of IDs in schema list + `lib/portfolio-projects.ts`.
- **Revisit if:** Projects move into Sanity as documents.

## Earlier ADRs
See `docs/adr/` (admin model, Teller, advisor tools, recurring detection).
