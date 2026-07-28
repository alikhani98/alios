# Stage 233 - Account Runtime Boundary Preparation

## Summary

Stage 233 prepares a future runtime boundary for account and sync implementation without activating any real account, session, or remote behavior.

The work stays contract-only and preserves AliOS as a fully local-first product.

## New abstractions

- `AccountRuntimeState`
  - a composed runtime snapshot for future account-aware application wiring
- `SyncCapability`
  - a small contract describing whether future sync is available, enabled, or still local-only
- `AccountRuntimeBoundary`
  - a future-facing runtime interface for reading the current composed account/sync state
- `LocalOnlyAccountRuntimeBoundary`
  - the default inactive boundary used for the current local-only product shape

## Local-only default behavior

The new runtime boundary explicitly keeps:

- no active account;
- no authenticated user session;
- no enabled sync capability;
- no remote provider activity;
- no data transfer off-device.

Existing repositories remain the source of truth and no repository behavior changes in this stage.

## Future integration points

- Future runtime account UI can consume `AccountRuntimeState` instead of assembling auth/account/sync pieces ad hoc.
- Future account-aware providers can implement `AccountRuntimeBoundary` without changing the current repository layer.
- Future sync capability wiring can evolve from the explicit local-only default rather than from implicit null/undefined behavior.

## Explicit non-goals

- No authentication
- No Supabase
- No OAuth
- No remote API integration
- No real user sessions
- No cloud sync
- No data upload
- No migration
- No schema change
- No repository behavior change
