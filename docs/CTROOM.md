# CTROOM — Personal HQ

CTROOM (`/ctroom`) is the private admin dashboard. Supabase auth + admin allowlist
(`/api/ctroom/auth/verify`). All views lazy-load via `components/views/lazyViews.tsx`.

## Views (9 in nav)
| Nav | View file | Data |
|---|---|---|
| Dashboard | DashboardView | missions, tasks |
| Dreamboard | DreamboardView + dreamboard/ | dreamboard_boards, dreamboard_items |
| Projects | MissionsView | missions |
| Portfolio | PortfolioProjectsView | portfolio_projects |
| GitHub | GitHubView | GitHub API (user token in Settings) |
| Planner | PlannerView | tasks, systems, missions |
| Milo | ChatView | chat_messages (persisted) via `/api/chat` |
| Vault | VaultView + vault/ (25 components) | vault_* tables |
| Blog | BlogView | Sanity via /api/blog/notes |

Ideas and Settings are reachable via dashboard actions / gear icon (not in nav).

## Data layer
- `services/ctroomDataService.ts` — missions, tasks, systems, ideas, messages, settings (Supabase)
- `services/vaultDataService.ts` — vault accounts/transactions/debts/goals/subscriptions
- `hooks/useVaultQueries.ts` — React Query cache for vault reads
- Chat messages persist to `chat_messages` (metadata JSONB holds model/thoughts/context)

## Backend
Supabase project `fcdzbnuyzdzqkuizvexk` ("kinglive cms"), 29 tables.
Key tables: tasks, missions, systems, ideas, chat_messages, dreamboard_boards,
dreamboard_items, portfolio_projects, vault_transactions (2.3k rows), vault_debts,
subscriptions, savings_goals, blog_comments, blog_post_analytics, user_settings.

## Night-shift 2026-10-12
- Chat history now persists (was stubbed to [] / null).
- Dreamboard gallery shows per-board item counts + last-edited; canvas got touch
  pan, auto-fit on mobile, bottom-sheet panels, scrollable toolbar.
- Vault "Today" tab opens with a Money Glance hero (safe-to-spend, due in 7 days,
  bills handled).
- Removed dead `TasksView.tsx` (unreferenced; Planner owns tasks).
- Full audit: `~/workspace/ctroom-night/audit-2026-10-12.md`
