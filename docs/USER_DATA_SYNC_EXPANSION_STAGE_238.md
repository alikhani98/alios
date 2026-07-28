# Stage 238 - User Data Sync Expansion

## Summary

Stage 238 expands the Supabase-backed sync foundation from low-risk preferences into the first repository-owned AliOS records:

- Tasks
- Projects
- Goals

The implementation keeps AliOS local-first:

- local repositories remain the source of truth for runtime usage
- offline/local access remains available
- sync failures do not block local work
- destructive overwrite is still avoided

## What changed

### 1. Sync metadata for first sync-eligible records

Optional sync metadata is now supported on:

- `Task`
- `Project`
- `Goal`

The metadata captures:

- owning backend user id
- last successful sync time
- last synced device id
- conflict flags for safe follow-up handling

This was added additively so older local records and older backups remain valid.

### 2. Supabase sync expanded beyond preferences

The existing Supabase sync provider now:

- still syncs supported local preferences
- also syncs Tasks, Projects, and Goals when Google sign-in and Supabase are configured
- exchanges local and remote record snapshots
- uploads local-only records
- hydrates remote-only records into local storage
- prefers the newer side when only one side changed since the last sync
- marks conflicts instead of silently overwriting when both sides diverged

### 3. Local merge path stays inside current architecture

Repository-owned records were not moved behind a new service or a direct Dexie bypass.

For local merge application, the sync provider uses the existing backup storage boundary to:

- read the current local snapshot
- merge sync-eligible entities
- write the merged snapshot back safely

This preserves current repository/storage ownership while avoiding invasive repository-contract changes in this stage.

### 4. Real sync triggers for synced entities

Task, Project, and Goal write operations now emit a narrow internal sync-trigger event after successful local writes.

That lets the sync provider react to:

- create
- update
- delete

without changing product workflows or feature behavior.

### 5. Settings sync surface now shows the real scope

The Settings `Account & Sync` surface now reflects the new stage honestly by showing:

- synced categories
- current sync health/status
- last sync timing

The current visible scope is:

- Preferences
- Tasks
- Projects
- Goals

The UI copy also explicitly preserves what remains local in this stage.

## Intentionally preserved

Stage 238 does **not** sync:

- Finance
- Personal Manual
- Decision Log
- local logs
- recovery mode data
- other device-local technical state

Stage 238 also does **not** add:

- destructive conflict resolution
- automatic overwrite
- schema/index migration for Dexie
- repository behavior changes for feature workflows
- backup format changes

## Conflict handling boundary

This stage adds only safe conflict preparation:

- conflict detection metadata
- local conflict flagging
- non-destructive sync failure reporting

It does **not** add:

- conflict-resolution UI
- remote merge tooling
- user choice workflow for side-by-side resolution

That follow-up remains a separate stage.

## Files changed

### Added

- `docs/USER_DATA_SYNC_EXPANSION_STAGE_238.md`
- `src/core/sync/recordChangeEvents.ts`
- `src/shared/types/sync.ts`

### Modified

- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `src/app/providers.tsx`
- `src/core/account/runtimeBoundary.ts`
- `src/core/sync/LocalOnlySyncProvider.ts`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts`
- `src/core/sync/index.ts`
- `src/core/sync/supabaseClient.ts`
- `src/core/sync/supabaseSyncConfig.ts`
- `src/core/sync/types.ts`
- `src/db/dexie/repositories/DexieGoalsRepository.ts`
- `src/db/dexie/repositories/DexieProjectsRepository.ts`
- `src/db/dexie/repositories/DexieTasksRepository.ts`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `src/shared/types/goal.ts`
- `src/shared/types/index.ts`
- `src/shared/types/project.ts`
- `src/shared/types/task.ts`

## Validation

Validated in this stage:

- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

## Known limitations

1. Supabase record sync assumes the configured backend exposes the expected record table contract.
2. Conflict handling is metadata-only in this stage and still needs a user-facing resolution flow.
3. User-data sync currently covers only Tasks, Projects, and Goals.

## Recommended next stage

Recommended Stage 239:

- explicit conflict review UX and sync health actions

That is the safest next step before expanding sync into more sensitive or content-heavy modules.
