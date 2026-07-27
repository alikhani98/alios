# AliOS Authentication Provider Abstraction - Stage 214A

Date: 2026-07-27

Status: `STAGE_214A_AUTH_PROVIDER_ABSTRACTION_COMPLETE`

## 1. Stage Summary

Stage 214A prepares the authentication architecture for future optional account support without implementing a real provider, login UI, session persistence, or Supabase integration.

This stage creates a provider-agnostic auth boundary only. AliOS runtime behavior remains local-first and unauthenticated.

## 2. Base and Branch

- Base source: Stage 213C local branch state
- Base commit: `e93e2b7`
- Branch: `codex/stage-214a-auth-provider-abstraction`

## 3. Auth Architecture

### Auth contracts

New core auth contracts define:

- `AuthUser`
  - `userId`
  - `email`
  - `displayName`
  - `createdAt`
  - `updatedAt`
  - optional metadata

- `AuthSession`
  - status
  - current user
  - provider
  - optional expiry
  - optional detail message

- `AuthProvider`
  - `getCurrentUser()`
  - `getCurrentSession()`
  - `login()`
  - `logout()`
  - `refreshSession()`
  - `subscribe()`

### Local-only placeholder provider

`LocalOnlyAuthProvider` is the only shipped provider in this stage.

It:

- reports `unauthenticated`
- returns no current user
- rejects `login()`
- allows `logout()` as a no-op
- returns the same local-only session on `refreshSession()`
- supports a non-mutating auth-state subscription surface

This mirrors the existing `NoAIProvider` and `LocalOnlySyncProvider` pattern: the boundary exists before any live provider is introduced.

## 4. Why These Changes Were Needed

- Stage 213C defined the future sync and account ownership model, but the codebase still lacked a dedicated auth boundary.
- A provider-agnostic auth contract keeps future account providers outside feature code and outside storage, sync, and UI modules until explicitly approved.
- Creating the boundary now lowers the risk of later coupling auth directly into routes, pages, or persistence internals.

## 5. Intentional Non-Changes

- no Supabase integration
- no authentication provider activation
- no login UI
- no route guards
- no session persistence
- no token storage
- no schema change
- no localStorage key change
- no dependency change
- no runtime behavior change

## 6. Implementation

### New files

- `src/core/auth/types.ts`
- `src/core/auth/LocalOnlyAuthProvider.ts`
- `src/core/auth/index.ts`
- `src/core/auth/__tests__/LocalOnlyAuthProvider.test.ts`

### Documentation

- `docs/AUTH_PROVIDER_ABSTRACTION_STAGE_214A.md`

## 7. Risks

- The auth contract is intentionally minimal, so a later provider stage may still need to refine token lifecycle details, verification flows, or passwordless/OAuth-specific metadata.
- No runtime integration is present yet, which is correct for this stage but means future stages must still decide where provider injection belongs in app startup.
- Session persistence is intentionally undefined here; later work must avoid leaking auth concerns into the preference or backup layers.

## 8. Recommended Next Stage

Stage 214B should define auth-session storage and bootstrap rules as contracts only:

- where a future session may live
- how bootstrap should detect and hydrate it
- what must remain device-local
- how auth should coexist with sync activation without changing current local-first behavior
