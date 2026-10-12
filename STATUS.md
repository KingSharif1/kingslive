# STATUS.md — KingsLive

> Last updated: 2026-10-12

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Portfolio | Updated | PORT-8: server-rendered homepage. Mobile Lighthouse 94, LCP 3.0s (was 84 / 4.4s on production) |
| Blog | Updated | Engagement (KL-13) is server routes keyed on the Sanity post id. Apply `supabase/migrations/20261008_blog_engagement.sql` on kingslive before comments go live. |
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

Nothing in progress. KL-13 schema still has to be run on the kingslive Supabase project before comments go live.

## Next

See first PENDING items in `TASKS.md`.
