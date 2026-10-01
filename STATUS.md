# STATUS.md — KingsLive

> Last updated: 2026-09-20

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Portfolio | Updated | SSR project rows; Sheet hamburger below `md`; package name `kingslive` |
| Blog | Updated | Pad sheet + Studio Preview. Table insert is `noteTable` (not reserved `table`) |
| Studio | Restored | `/studio` + route loading shell; client-only mount |
| CTROOM login | Fixed | Magic links via Brevo; original tab signs in after click |
| GitHub hub | New | CTROOM → GitHub: status, merge PRs, Vercel deploy hooks |
| Vault | Partial | Live txs; enrichment/charts still roadmap |
| Milo | Partial | Non-streaming, limited tools |
| Docs | Added | + `docs/GITHUB.md` |

## Flags / blockers

- Vercel may still need `BREVO_API_KEY` + correct `NEXT_PUBLIC_SANITY_PROJECT_ID=n31jvc6a`
- Supabase Auth Redirect URLs must include `https://kingsharif.com/auth/callback`
- `GITHUB_TOKEN` (or Settings PAT) required for private repos + merge
- Optional `VERCEL_DEPLOY_HOOKS` JSON for one-click production redeploy

## Working on

KL-10 / KL-01 / KL-02 (package name, mobile nav, SSR projects).

## Next

Remaining ARK tickets KL-03…KL-12. First PENDING in `TASKS.md` is still BLOG-2 (Sanity metadata).
