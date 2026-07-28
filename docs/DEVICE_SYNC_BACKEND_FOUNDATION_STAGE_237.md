# Stage 237 - Device Sync Backend Foundation

## Summary

Stage 237 adds the first real Supabase-backed sync foundation for AliOS while preserving the app's local-first behavior and keeping all user records on-device.

This stage is intentionally narrow:

- Google sign-in remains the account entry point
- Supabase becomes the backend identity and low-risk preference sync boundary
- only appearance, language, and interface preferences are eligible for sync
- tasks, finance, goals, personal manual entries, decisions, and every repository-owned record remain local

## Implemented foundation

### 1. Supabase connection boundary

- Added `src/core/sync/supabaseSyncConfig.ts`
- Added a lightweight Supabase auth client adapter in `src/core/sync/supabaseClient.ts`
- Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment support

The runtime keeps backend configuration isolated from feature code and avoids exposing secrets in the repository.

### 2. Google account to backend identity bridge

- Extended the Google auth runtime with an in-memory ID token accessor
- Added `SupabasePreferenceSyncProvider` to exchange the Google identity token for a Supabase-authenticated backend session

The raw Google credential is not persisted to localStorage, backups, or repository storage.

### 3. First real sync scope

This stage syncs only the following local preference keys:

- `alios.language`
- `alios.appearance`
- `alios.preferences.accentColor`
- `alios.viewDensityMode`
- `alios.calendarDisplay`
- `alios.home.dashboardLayout`
- `alios.home.collapsedSections`
- `alios.finance.collapsedSections`

The merge rule is local-first:

- existing local values win
- missing local values can be hydrated from the remote preference snapshot
- the merged preference snapshot is written back to Supabase user metadata

### 4. Device sync metadata

The sync provider now tracks:

- backend user id
- device id
- device label
- last sync attempt
- last successful sync
- last sync outcome

This metadata stays local to the browser runtime except for the explicit user-metadata payload attached to the authenticated Supabase account.

### 5. Settings surface updates

The existing `Account & Sync` Settings surface now reflects the real Stage 237 state more honestly:

- the card explains that low-risk preference sync exists
- sync timing text reflects real last-sync metadata
- current-state detail prefers the active sync detail when sync is connected
- the page continues to make it clear that records remain local

## Non-goals preserved

Stage 237 does **not** implement:

- task sync
- finance sync
- goal sync
- manual sync
- decision sync
- repository changes
- schema changes
- backup/export changes
- migration changes
- conflict resolution UI
- automatic cloud ownership of records

## Files changed

### Added

- `docs/DEVICE_SYNC_BACKEND_FOUNDATION_STAGE_237.md`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/core/sync/supabaseClient.ts`
- `src/core/sync/supabaseSyncConfig.ts`
- `src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts`

### Updated

- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `src/app/providers.tsx`
- `src/core/account/runtimeBoundary.ts`
- `src/core/auth/GoogleAuthProvider.ts`
- `src/core/auth/googleAuthRuntime.ts`
- `src/core/sync/index.ts`
- `src/core/sync/types.ts`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `src/vite-env.d.ts`

## Validation

Stage 237 requires:

- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

## Risks

1. Supabase auth configuration must be valid in the deployment environment or the sync provider will remain local-only.
2. This stage intentionally syncs only a narrow preference set; users may still expect full record sync after seeing account connectivity.
3. The current bridge relies on an authenticated Google device session and explicit Supabase environment configuration.

## Recommended next stage

The next safe stage should add an explicit sync-status action layer and user-controlled enable/pause behavior before any repository-owned data becomes sync-eligible.
