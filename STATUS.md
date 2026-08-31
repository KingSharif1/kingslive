# STATUS.md — KingsLive

> Last updated: 2026-08-31

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Portfolio | Updated | 11 rows; `repo_public` + `timeline_date` columns live |
| Blog | Updated | Server-rendered journal; contained 3:2 covers; King·Notes → `/blog` |
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

Shipped BLOG-4 to master (commit + production deploy).

## Next

See first PENDING items in `TASKS.md`.
