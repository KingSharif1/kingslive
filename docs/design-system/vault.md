# Vault design system

## Information architecture

| Tab | Purpose | Sub-views |
|-----|---------|-----------|
| **Home** | At-a-glance: net worth, health, upcoming, recent activity | — |
| **Money** | What happened — transaction log, recurring detection, calendar | List · Recurring · Calendar |
| **Plan** | Where you're going — budgets, goals, debt, investments | Budget · Goals · Debt · Investments |
| **Ask** | Streaming AI advisor | — |

Rule: **never add a 5th top tab**. New surfaces become a sub-view under Plan or Money.

## Tokens (Tailwind)

| Token | Value | Usage |
|-------|--------|--------|
| `vault.surface` | `rgba(255,255,255,0.03)` | Card backgrounds |
| `vault.border` | `rgba(255,255,255,0.07)` | Card borders |
| `vault.accent` | `#00ff88` | Primary actions, positive money, active tab |
| `vault.muted` | `rgba(255,255,255,0.35)` | Labels, hints |

Money colors: emerald = positive / income, red-400 = expense / debt, white = net worth.

## Primitives

| Component | Path | Purpose |
|-----------|------|---------|
| `VaultHero` | `app/ctroom/components/vault/VaultCard.tsx` | Single calm hero — net worth + delta + 4 stats. Top of Home. |
| `VaultSubNav<T>` | same | Pill sub-navigation under a primary tab |
| `VaultCard` | same | Standard glass surface (`p-4 md:p-5 rounded-2xl`) |
| `VaultStat` | same | Single metric tile (label, value, sub) |
| `VaultEmptyState` | same | Icon + headline + CTA |
| `BudgetRulePanel` | inside `VaultView.tsx` | 50/30/20 monthly plan strip (Budget sub-view) |
| `VaultAdvisorChat` | `app/ctroom/components/vault/VaultAdvisorChat.tsx` | Streaming advisor (Ask tab) |
| `InvestmentsPanel` | `app/ctroom/components/vault/InvestmentsPanel.tsx` | DB-backed positions (Plan → Investments) |

## Layout rules

1. **One hero per tab.** No KPI strip in the header, no duplicate stat row below the hero.
2. **Time range lives inside the tab that uses it** (Home, Money → List). Never in the global header.
3. **Sync state goes inline in the header as text** ("synced 9:42 AM"), not a chip or modal.
4. **Don't repeat the brand mark.** 28px wallet + "Vault" once, top-left.
5. **Cards are quiet.** `vault.surface` + `vault.border`. Bordered accents only for emphasis (nudges, side-hustle callouts).

## Patterns

- **Money:** `font-mono`, emerald positive, red negative.
- **Tabs:** Primary tabs use bottom-border accent. Sub-tabs use solid pill on `vault.accent`.
- **Nudges:** Use `vault.accent` 6% tinted background + 25% border. Always include Apply / Dismiss.
- **Modals:** Centered `max-w-sm` to `max-w-lg`, slate-900 background, escape-on-backdrop-click.

## Accessibility

- Primary tabs: `role="tablist"`, arrow-key navigation, focus rings on `vault.accent`/60.
- Sub-tabs: `role="tab"`, `aria-selected`, keyboard accessible.
- Tap targets ≥ 40px on mobile.
- All money values use `font-mono` so visual scanning aligns by decimal.

## Export

Transactions tab → **Export CSV** (client-side from filtered list).

## What's intentionally _not_ here

- A KPI strip in the header (duplicates the hero)
- A "Personal Finance" tagline (you're already in Vault)
- A standalone "Investments" or "Recurring" top tab (now sub-views)
- A "Cash Flow" tab (it's the calendar view of Money)
- A combined Plan tab that re-renders Budgets + Goals together (now separated as sub-views)
