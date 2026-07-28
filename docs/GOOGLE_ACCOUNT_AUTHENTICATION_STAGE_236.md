# Stage 236 - Google Account Authentication

## Summary

Stage 236 activates real Google sign-in on top of the existing Account Runtime Foundation without enabling sync, cloud storage, or any repository-owned data transfer.

AliOS remains local-first:

- feature records still live only in existing local repositories
- backups and exports remain the user-owned safety path
- no application data is uploaded after sign-in
- sync stays disabled and unimplemented

## What Changed

### 1. Real Google auth runtime

Added a Google Identity Services-backed runtime in `src/core/auth/googleAuthRuntime.ts`.

This runtime now:

- loads the official Google Identity Services client script in the browser
- opens a real Google sign-in flow
- decodes the returned Google ID token locally
- derives a minimal local session snapshot
- exposes `signed out`, `authenticating`, and `authenticated` runtime states
- revokes and clears the local identity snapshot on sign-out

### 2. Provider adapters

Added:

- `src/core/auth/GoogleAuthProvider.ts`
- `src/core/account/GoogleAccountProvider.ts`

These adapters connect the real Google auth runtime to the existing AliOS:

- `AuthProvider` contract
- `AccountProvider` contract
- `AccountRuntimeBoundary`

No repository, schema, route, or feature logic was changed.

### 3. Default runtime selection

Updated `src/app/providers.tsx` so AliOS now:

- uses Google auth/account providers only when `VITE_GOOGLE_CLIENT_ID` is configured
- otherwise falls back to the shipped local-only runtime

This keeps the application safe on builds where Google auth is not configured.

### 4. Settings integration

Updated the existing `Account & Sync` Settings surface so it can now:

- show the real signed-out Google state
- offer a live `Sign in with Google` action
- show the connected Google identity when signed in
- offer a real `Sign out` action
- keep sync-related actions clearly disabled/planned

### 5. Session storage boundary

AliOS stores only a minimal local session snapshot for the connected Google identity on this device.

Important constraints:

- no raw AliOS feature data is attached to the account
- no backup payload is changed
- no repository storage format is changed
- no feature persistence is migrated
- no sync cursor or upload behavior is activated

## Required Configuration

To activate Google sign-in in a real build, set:

`VITE_GOOGLE_CLIENT_ID`

This value must be available at build time for the Vite app.

Without that variable:

- AliOS remains in local-only account mode
- no broken sign-in UI is activated
- the shipped fallback remains safe

## Files Added

- `docs/GOOGLE_ACCOUNT_AUTHENTICATION_STAGE_236.md`
- `src/core/account/GoogleAccountProvider.ts`
- `src/core/auth/GoogleAuthProvider.ts`
- `src/core/auth/googleAuthRuntime.ts`
- `src/core/auth/__tests__/GoogleAuthProvider.test.ts`

## Files Updated

- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `src/app/providers.tsx`
- `src/core/account/index.ts`
- `src/core/auth/index.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/pages/SettingsPage.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`

## Explicit Non-Goals

Stage 236 does not add:

- Supabase
- Firebase
- OAuth provider switching
- sync engine behavior
- remote data upload
- cloud database
- conflict resolution
- device-to-device data merge
- repository/schema/storage migration

## Validation

Completed:

- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

## Risks / Follow-up

1. Google sign-in depends on a valid configured `VITE_GOOGLE_CLIENT_ID`.
2. This stage authenticates identity only; it does not solve cross-device data sync yet.
3. The next approved stage should define explicit sync opt-in, consent confirmation, and device association before any remote record transfer is introduced.
