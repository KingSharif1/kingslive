# ADR-002: Teller for bank linking (not Plaid)

**Status:** Accepted  
**Date:** 2026-06-01

## Context

Wells Fargo and similar institutions are painful on Plaid in production. KingsLive already has ~2,300 transactions synced via Teller.

## Decision

Stay on **Teller Connect** + `/api/ctroom/vault/enroll` + `/api/ctroom/vault/sync`. Do not invest in Plaid for this repo.

## Consequences

- mTLS cert management stays required for production sync.
- Transaction dedupe relies on `teller_transaction_id` unique index.
