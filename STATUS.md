# STATUS.md — KingsLive

> Last updated: 2026-08-26

## Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Portfolio | Working | Top 3 featured + show-all archive |
| Blog | Fixed (this cycle) | Sanity ID unified; Studio restored; excerpts/publish filters |
| Studio | Restored | `/studio` was deleted; route back |
| CTROOM login | Fixed (this cycle) | Magic links via Brevo, not GoTrue SMTP |
| Vault | Partial | Live txs; enrichment/charts still roadmap |
| Milo | Partial | Non-streaming, limited tools |
| Docs | Added | ARCHITECTURE / STATUS / TASKS / DECISIONS / CHANGELOG / docs/BLOG.md |

## Flags / blockers

- Vercel may still need `BREVO_API_KEY` + correct `NEXT_PUBLIC_SANITY_PROJECT_ID=n31jvc6a`
- Supabase Auth Redirect URLs must include `https://kingsharif.com/auth/callback`
- Existing Sanity posts should set `publishedAt` + `excerpt` in Studio for cleaner cards
- CTROOM deep product vision is deferred — blog/portfolio first

## Working on

Blog reliability + docs + project↔blog linking.

## Next

See first PENDING items in `TASKS.md`.
