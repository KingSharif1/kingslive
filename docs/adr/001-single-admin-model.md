# ADR-001: Single-admin Ctroom model

**Status:** Accepted  
**Date:** 2026-06-01

## Context

KingsLive Ctroom is a personal HQ for one operator, not a multi-tenant SaaS. Data must never leak to other authenticated Supabase users or anonymous GraphQL clients.

## Decision

- Use `public.is_admin()` (SECURITY DEFINER) for planner tables without `user_id` (`tasks`, `ideas`, `chat_messages`, `missions`, `systems`).
- Revoke direct `SELECT` on `admin_users` from `anon` and `authenticated`; verify via service role in `/api/ctroom/auth/verify` only.
- Vault tables keep `auth.uid() = user_id` policies.

## Consequences

- Easier mental model: one human, one dataset.
- Adding collaborators later requires new ADR (true multi-tenant or shared workspace).
