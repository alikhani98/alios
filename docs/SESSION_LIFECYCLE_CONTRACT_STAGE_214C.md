# AliOS Session Lifecycle Contract - Stage 214C

Date: 2026-07-27

Status: `STAGE_214C_SESSION_LIFECYCLE_CONTRACT_COMPLETE`

## 1. Stage Summary

Stage 214C defines how future authenticated sessions must behave in AliOS without activating any real authentication provider, token storage, login UI, route protection, or Supabase integration.

This stage is contract-only. AliOS runtime behavior remains local-first and unchanged.

## 2. Base and Branch

- Base source: Stage 214B local branch state
- Base commit: `16bdcaf`
- Branch: `codex/stage-214c-session-lifecycle-contract`

## 3. Session Model

### Lifecycle phases

The session lifecycle contract now defines these future phases:

- `bootstrapping`
- `local-only`
- `authenticated-active`
- `authenticated-refreshing`
- `expired`
- `logged-out`
- `error`

These phases are descriptive rules for future providers and app-shell behavior. They do not change the current runtime session states.

### Authenticated state

When a future provider reports an authenticated session:

- user identity may become available to the runtime
- local data remains present
- sync still does not begin automatically
- explicit sync/account setup is still required before remote sync can enable

### Unauthenticated and logout state

When no account is active, or a user logs out:

- existing local records remain preserved
- the remote session may be removed by the provider
- device-local preferences remain device-local
- repository-backed user data is not deleted as part of the session contract

### Expiration and refresh

Session expiration and refresh are defined as auth-runtime concerns, not feature concerns.

- expiration transitions the contract into `expired`
- refresh transitions through `authenticated-refreshing`
- future providers may manage secure session refresh internally
- features must not own token refresh logic

## 4. Local-First Rules

### Before login

- local repository data remains fully usable
- no account is required for access to existing local records
- no feature may depend on an authenticated identity to render current local data

### After login

- identity may associate with existing local data
- association does not imply immediate migration, overwrite, or deletion
- sync remains disabled until explicit account/sync setup is complete

### Logout

- preserve local data
- remove remote session
- preserve device-local preferences

## 5. Sync Handoff Rules

### When sync is disabled

Sync stays disabled when the profile state is:

- `local-only`
- `error`

And it remains not yet enabled when the profile state is:

- `provisioning`
- `paused`

### When identity becomes available

- before login: identity is unavailable
- after authentication: identity is available for local association
- after explicit sync setup: identity is available for sync

### Sync enablement rule

Future sync requires both:

- an authenticated session
- explicit account/sync setup

Authentication alone must not start sync automatically.

## 6. Security Boundaries

The contract explicitly requires:

- tokens must not live in preferences
- tokens must not be included in backup exports
- session state must stay outside repository-backed application data
- auth metadata must not reuse existing feature storage keys

## 7. Files Changed

### New files

- `src/core/auth/sessionLifecycleContract.ts`
- `src/core/auth/__tests__/sessionLifecycleContract.test.ts`
- `docs/SESSION_LIFECYCLE_CONTRACT_STAGE_214C.md`

### Updated files

- `src/core/auth/index.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## 8. Why These Changes Were Needed

- Stage 214B created the runtime injection seam, but future providers still needed clear lifecycle rules.
- Without an explicit session contract, later auth work could accidentally leak token or session concerns into preferences, backups, or feature storage.
- The contract keeps session behavior aligned with the existing sync and local-first boundaries established in Stages 213A through 214B.

## 9. Intentional Non-Changes

- no Supabase integration
- no login UI
- no provider activation
- no token storage implementation
- no route guards
- no runtime behavior change
- no storage-format change
- no localStorage key change
- no schema change
- no dependency change

## 10. Recommended Next Stage

Stage 214D should define the future local account-linking and record-ownership handshake:

- how existing local records become associated with an authenticated identity
- what conflict-safe first-sync preparation looks like
- how logout should affect account-linked sync metadata without affecting local records
