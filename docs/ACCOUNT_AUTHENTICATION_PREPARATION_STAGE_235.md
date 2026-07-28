# Stage 235 - Account Authentication Integration Preparation

## Summary

Stage 235 prepares the first practical bridge between the consolidated account runtime foundation from Stage 234 and a future real authentication integration.

The goal of this stage is not to enable authentication. The goal is to make the runtime and Settings surface ready for future authentication work without inventing fake runtime behavior, changing data ownership, or implying that AliOS already has account connectivity.

## What changed

### 1. Runtime-facing account presentation states

The Settings `Account & Sync` surface now understands three preparation states:

- `Local only`
- `Signed out`
- `Signed in` placeholder

These are presentation and preparation states only.

They do not activate:

- a real user session
- remote identity restoration
- network calls
- sync capability
- data transfer

### 2. Settings preparation for future account actions

The existing Settings surface was refined so it can safely host future account actions:

- `Sign in`
- `Sign out`
- `Manage account`

These actions remain clearly non-functional placeholders in the current release.

The UI now makes that boundary more explicit so future entry points can be introduced without redesigning the surface again.

### 3. Local-first runtime rules remain unchanged

This stage keeps the current runtime honest:

- local-only remains the default shipped state
- no fake user is injected into the app
- no real session is created
- repositories remain unchanged
- no ownership or persistence behavior changes

## Files changed

- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## Testing coverage added

Focused Settings coverage now proves:

- the default runtime still renders as local-only
- a signed-out future account-preparation state renders correctly
- a signed-in placeholder state renders correctly

## Explicit non-goals

This stage does not implement:

- Supabase
- OAuth
- Google login
- email login
- a real authentication provider
- real account creation
- remote session activation
- cloud sync
- data upload
- schema changes
- repository changes
- storage migrations

## Why this stage exists

Stage 234 finished the account runtime foundation.

Stage 235 makes that foundation more useful by connecting it to the first future authentication concepts in a very small and controlled way. This reduces future integration churn while keeping the current product behavior identical for users.

## Recommended next stage

The next safe step should introduce only the minimum real provider-integration seam that is required to connect an approved authentication provider to the existing runtime foundation, while preserving local-first defaults until explicit sign-in and consent are actually implemented.
