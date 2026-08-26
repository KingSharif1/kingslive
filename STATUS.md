# STATUS.md — KingsLive

> Last updated: 2026-08-26

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Portfolio | Updated | Top-3 highlights + full timeline; private GitHub hidden; dots restored |
| Blog | Fixed | Sanity `n31jvc6a`; Studio restored |
| Studio | Restored | `/studio` |
| CTROOM login | Fixed | Magic links via Brevo |
| GitHub hub | New | CTROOM → GitHub: status, merge PRs, Vercel deploy hooks |
| Vault | Partial | Live txs; enrichment/charts still roadmap |
| Milo | Partial | Non-streaming, limited tools |
| Docs | Added | + `docs/GITHUB.md` |

## Flags / blockers

- Vercel may still need `BREVO_API_KEY` + correct `NEXT_PUBLIC_SANITY_PROJECT_ID=n31jvc6a`
- Supabase Auth Redirect URLs must include `https://kingsharif.com/auth/callback`
- `GITHUB_TOKEN` (or Settings PAT) required for private repos + merge
- Optional `VERCEL_DEPLOY_HOOKS` JSON for one-click production redeploy
- Run `portfolio_projects` migration (incl. `repo_public`, `timeline_date`) in kinglive cms SQL Editor; re-seed if old rows override static URLs

## Working on

PORT-3 portfolio timeline / dots / URLs (this session).

## Next

See first PENDING items in `TASKS.md`.
