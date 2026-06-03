# ADR-003: Vault advisor — read tools first, gated writes

**Status:** Accepted  
**Date:** 2026-06-01

## Context

The Vault advisor must feel like Rocket Money + Jarvis: accurate numbers and safe mutations.

## Decision

1. **Vercel AI SDK** (`streamText`, Gemini 2.0 Flash) with server-built system prompt from live Supabase data.
2. **Read tools** execute immediately: `getNetWorth`, `getMonthlySpend`, `getRecentTransactions`, `projectDebtPayoff`, `simulateBudget`.
3. **Write tools** return `preview: true` only; UI confirms via `POST { confirmAction }` before any insert/update.

## Consequences

- Slower to add goals from chat, but no surprise DB changes.
- Milo (`/api/chat`) reuses this pattern in a later phase.
