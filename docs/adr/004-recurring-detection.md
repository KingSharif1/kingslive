# ADR-004: Recurring detection algorithm + subscription lifecycle

**Status:** Accepted (shipped 2026-06-02)
**Date:** 2026-06-01

## Context

The original recurring detector flagged any merchant with 2+ similar transactions, which produced false positives for groceries, gas, and fast food (WALMART, 7 ELEVEN, MCDONALD'S). It also never re-evaluated a saved subscription, so cancelled services sat in the list as "active" forever, and `next_billing_date` drifted right after every sync because it defaulted to `now + interval` instead of `last_charge + interval`.

Real Vault has 2,352 transactions across ~80 unique merchants. The detector needs to be confident enough that the user doesn't have to babysit it, but humble enough to ask when it isn't sure.

## Decision

Treat subscriptions as a **lifecycle** (`active → pending_review → cancelled`) backed by a periodic server-side scan over real transactions, with three independent inputs:

1. A **global merchant dictionary** (`merchant_dictionary`) that classifies known brands and a denylist of high-frequency one-off merchants.
2. Per-user **overrides** (`user_overrides`) capturing every Confirm / Dismiss / Recategorize decision from the review queue.
3. Statistical gates on interval stability and amount stability.

The scan runs inline after every Teller sync and on demand from the "Re-scan" button.

## Algorithm

1. **Window** — last 180 days of `type='expense'` transactions per user.
2. **Normalize** — `lowercase`, strip `#1234`, strip `LLC|INC|CO|CORP|LTD|THE`, strip 3+ digit runs and punctuation, collapse whitespace.
3. **Group** — at least 3 charges per normalized merchant.
4. **Dictionary lookup** — longest-substring match against `merchant_dictionary` so "apple music" beats "apple".
5. **Denylist gate** — drop dictionary entries with `bill_type='denylist'` unless the user has a `confirmed` override.
6. **Statistics** — compute `median(interval)`, `stdev(interval)`, `median(amount)`, `stdev(amount)`, `amount_cv = stdev / median`.
7. **Tiny-amount guard** — if `median(amount) < $5`, treat `amount_cv = stdev / 2` so $1 Google fees aren't rejected by relative-variance math.
8. **Frequency classifier** — bucket median interval into `weekly (6–8) | biweekly (12–16) | monthly (25–35) | quarterly (85–95) | yearly (350–380)`. If observation disagrees with the dictionary default (e.g. sparse data makes Microsoft 365 look weekly), trust the dictionary.
9. **Score (0–100)**
   - `+20` for ≥3 charges (`+10` more at ≥6, `+5` more at ≥12)
   - `+30 / +22 / +12 / -10` based on interval stdev (`≤1d`, `≤2d`, `≤4d`, otherwise)
   - `+25 / +18 / +8 / -15` based on amount CV (`≤0.02`, `≤0.05`, `≤0.15`, otherwise)
   - `+12` if dict matches as `subscription`, `+10` if `bill`/`loan`
   - locked to ≥95 when the user explicitly `confirmed`
10. **Confidence bucket** — `high ≥ 80`, `medium ≥ 55`, `low < 55`.
11. **Hard reject** — drop the row only if it has no dictionary backing AND fails the statistical gates entirely.
12. **Lifecycle**
    - `cancelled` when `daysSinceLastCharge ≥ 2.5 × nominalInterval`
    - `pending_review` when one charge is overdue, OR confidence is low, OR confidence is medium and the merchant is unknown to the dictionary
    - `active` otherwise
13. **Next date** — `lastChargeDate + nominalInterval`.
14. **Stale sweep** — any pre-existing `auto_detected` sub whose merchant pattern no longer appears in the current scan is auto-cancelled with a note.

## Schema

```sql
-- Lifecycle columns on subscriptions (shipped in 20260601200000_subscription_lifecycle.sql)
ALTER TABLE subscriptions
  ADD COLUMN last_charge_date date,
  ADD COLUMN last_charge_amount numeric,
  ADD COLUMN charge_count int DEFAULT 0,
  ADD COLUMN avg_interval_days numeric,
  ADD COLUMN confidence int DEFAULT 0,
  ADD COLUMN status text DEFAULT 'active'
    CHECK (status IN ('active','cancelled','paused','pending_review')),
  ADD COLUMN bill_type text DEFAULT 'subscription'
    CHECK (bill_type IN ('subscription','bill','loan','income','denylist')),
  ADD COLUMN first_seen_date date,
  ADD COLUMN cancelled_at timestamptz;

-- New tables (shipped in 20260602000000_recurring_engine.sql)
CREATE TABLE merchant_dictionary (
  id uuid PRIMARY KEY,
  pattern text UNIQUE,                -- normalized lowercase pattern
  display_name text,
  category text,
  emoji text,
  bill_type text,                     -- subscription | bill | denylist | income | loan
  default_frequency text,             -- weekly | biweekly | monthly | quarterly | yearly | null
  notes text,
  created_at timestamptz
);

CREATE TABLE user_overrides (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_pattern text,
  decision text,                      -- confirmed | dismissed | category
  category text,
  bill_type text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE (user_id, merchant_pattern)
);

-- Indexes powering the scan
CREATE UNIQUE INDEX subscriptions_user_pattern_uidx
  ON subscriptions (user_id, merchant_pattern) WHERE merchant_pattern IS NOT NULL;
CREATE INDEX idx_vault_transactions_user_date
  ON vault_transactions (user_id, date DESC);
CREATE INDEX idx_vault_transactions_user_merchant
  ON vault_transactions (user_id, merchant) WHERE merchant IS NOT NULL;
```

RLS: `merchant_dictionary` is read-anyone/write-admin. `user_overrides` is owner-only.

## API surface

| Route | Purpose |
|---|---|
| `POST /api/ctroom/vault/recurring-refresh` | Full re-scan + upsert. Called inline at the end of `/api/ctroom/vault/sync` and from the UI "Re-scan" button. |
| `POST /api/ctroom/vault/detect-recurring` | Alias for `recurring-refresh`. Kept around so older clients/buttons don't break. |
| `POST /api/ctroom/vault/recurring-review` | HITL endpoint. Body: `{ pattern, decision: 'confirmed'\|'dismissed'\|'category', category?, billType?, notes? }`. Upserts `user_overrides`, applies the immediate consequence to the subscription row, then re-runs the scan. |

The scan logic itself is centralized in `lib/vault/recurringScan.ts` so the three routes are thin wrappers and the sync route can import the same function.

## UI

A `<RecurringReviewQueue>` (in `app/ctroom/components/vault/RecurringReviewQueue.tsx`) sits at the top of the Money → Recurring tab and shows every subscription with `status='pending_review'`. Each row exposes Confirm / Dismiss / Recategorize actions, the confidence score, the engine's reason (`"Missed 1 expected charge"`, `"Unknown merchant — confirm to keep"`), and last-charge metadata.

Active subscriptions and bills render below, grouped by category. Cancelled subs are hidden by default (an "All recurring" filter can re-show them).

## Options Considered

### Option A: Manual subscription list only
Simple, accurate by definition. Defeats the point of having 2,350 real transactions and forces the user to maintain duplicates of charges the bank already saw.

### Option B: Naive grouping (original implementation)
Already deployed. Produced obvious garbage (WALMART, 7 ELEVEN, MCDONALD'S) and never marked anything cancelled. Replaced.

### Option C (chosen): Dictionary + denylist + statistical gates + lifecycle + HITL
Catches `WINDSURF`, `SECURITY CREDIT`, `STATE FARM` correctly. Ignores groceries/gas/Square. Auto-cancels `CODEIUM`, `ACORNS`. Borderline merchants land in a review queue instead of polluting the active list. Cost is a hand-curated dictionary (~78 entries seeded; user overrides can extend it).

### Option D: ML / LLM classifier
Overkill for personal finance. We'd pay per transaction to enrich something a denylist + variance test already nails. Worth revisiting if multi-user.

## Consequences

- **Easier:** Cancelled subs auto-disappear. Next-bill predictions stop drifting (`last_charge + interval`, not `now + interval`). Calendar view is meaningful. User can teach the system with a click.
- **Harder:** Dictionary is hand-maintained. Mitigation: every `dismissed` override teaches the engine for this user, and adding to the dictionary is one INSERT.
- **Revisit if:** transaction count exceeds ~50k per user, or multiple users share the system and the dictionary becomes a hot table.

## Action Items

1. [x] Migration `20260601200000_subscription_lifecycle.sql`
2. [x] Migration `20260602000000_recurring_engine.sql` (dictionary + overrides + indexes)
3. [x] Rewrite `lib/vault/recurringDetection.ts`
4. [x] Extract shared scanner into `lib/vault/recurringScan.ts`
5. [x] Rewrite `POST /api/ctroom/vault/detect-recurring`
6. [x] New `POST /api/ctroom/vault/recurring-refresh`
7. [x] New `POST /api/ctroom/vault/recurring-review` (HITL)
8. [x] Hook `recurringScan` into `/api/ctroom/vault/sync`
9. [x] `RecurringReviewQueue` component
10. [x] Remove client-side `detectRecurring` consumer in the All-recurring view
11. [ ] Calendar view: switch from `buildUpcoming` (still client-side) to server-driven `next_billing_date` (pending — `buildUpcoming` still works as a fallback)
12. [ ] Display polish: merchant normalization, category chips, pending badge on transactions list
