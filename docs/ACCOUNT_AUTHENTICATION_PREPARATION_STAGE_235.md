# Stage 235 - Google Account & Sync Foundation

## Summary

Stage 235 prepares the first practical bridge between the consolidated account runtime foundation from Stage 234 and a future Google account and device-sync integration.

The goal of this stage is not to enable authentication or sync. The goal is to make the runtime and Settings surface ready for future Google sign-in and multi-device sync work without inventing fake runtime behavior, changing data ownership, or implying that AliOS already has off-device connectivity.

## What changed

### 1. Google-ready account identity and session states

The Settings `Account & Sync` surface now understands three preparation states:

- `Local only`
- `Signed out`
- `Signed in` placeholder

The runtime now also carries explicit provider-aware session lifecycle metadata so future Google account work has a stable contract for:

- account provider identity
- signed-out session state
- signed-in placeholder state
- future session timestamps

They do not activate:

- a real user session
- Google OAuth
- remote identity restoration
- network calls
- sync capability
- data transfer

### 2. Sync preparation metadata

The runtime now carries minimal sync-preparation metadata only:

- local device identity
- sync lifecycle status
- last sync timestamp
- last sync outcome

This metadata remains local and derived.

It does not enable:

- upload
- merge
- conflict resolution
- background sync

### 3. Settings preparation for future account actions

The existing Settings surface was refined so it can safely host future Google account actions:

- `Sign in`
- `Sign out`
- `Manage account`

These actions remain clearly non-functional placeholders in the current release.

The UI now also shows the prepared provider, device identity, and sync timing foundation so future laptop/mobile account surfaces can grow from a stable shared layout.

### 4. Local-first runtime rules remain unchanged

This stage keeps the current runtime honest:

- local-only remains the default shipped state
- no fake user is injected into the app
- no real session is created
- repositories remain unchanged
- no ownership or persistence behavior changes

## Files changed

- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/core/account/types.ts`
- `src/core/account/runtimeBoundary.ts`
- `src/core/account/__tests__/types.test.ts`
- `src/core/account/__tests__/runtimeBoundary.test.ts`
- `src/core/sync/types.ts`
- `src/core/sync/syncMetadata.ts`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## Testing coverage added

Focused Settings coverage now proves:

- the default runtime still renders as local-only
- a Google signed-out preparation state renders correctly
- a Google signed-in placeholder state renders correctly
- local device and sync metadata render without implying real sync

## Explicit non-goals

This stage does not implement:

- Supabase
- Firebase
- OAuth
- Google login
- email login
- a real authentication provider
- real account creation
- remote session activation
- cloud sync
- cloud database
- data upload
- schema changes
- repository changes
- storage migrations

## Why this stage exists

Stage 234 finished the account runtime foundation.

Stage 235 makes that foundation more useful by connecting it to the first future Google-account and multi-device-sync concepts in a very small and controlled way. This reduces future integration churn while keeping the current product behavior identical for users.

## Recommended next stage

The next safe step should introduce only the minimum real Google provider-integration seam that is required to connect an approved authentication provider to the existing runtime foundation, while preserving local-first defaults until explicit sign-in and sync consent are actually implemented.
