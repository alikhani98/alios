# Stage 239 - Sync Conflict Resolution & Reliability

## Summary

Stage 239 strengthens the existing AliOS sync foundation so cross-device use is safer when the same account is active on multiple devices. The implementation remains local-first and keeps sync behavior bounded to reliability, conflict detection, retry, and operational visibility.

## What Changed

### 1. Conflict and staleness detection

- Sync metadata now supports richer conflict-reason vocabulary for:
  - diverged multi-device changes
  - outdated local records
  - outdated remote records
- The Supabase sync provider now tracks when a local record was stale relative to remote data and when remote data was stale relative to the current local record.
- Diverged edits still stop automatic overwrite and remain flagged as review-needed instead of being merged silently.

### 2. Reliability status improvements

- Sync errors now preserve the last successful sync timestamp instead of dropping that context after a failed retry.
- Sync error states now distinguish:
  - record conflict issues
  - connectivity-style failures
  - provider/runtime failures
- The account runtime boundary now exposes a direct sync retry seam for the Settings surface without changing feature repositories or storage ownership.

### 3. Retry and health UI in Settings

- The `Account & Sync` Settings surface now shows:
  - sync health summary
  - local-only / healthy / syncing / issue-present states
  - retry sync action for authenticated connected states
- Retry remains explicit and user-triggered.
- No fake session, fake sync enablement, or hidden upload path was added.

### 4. Minimal local diagnostics

- Sync attempts now record bounded local diagnostics for:
  - attempt start
  - success
  - failure reason
  - conflict count
  - stale-local count
  - stale-remote count
- Diagnostics stay local-only and do not include user-authored record content.

## Files Changed

- `src/shared/types/sync.ts`
- `src/core/sync/types.ts`
- `src/core/sync/syncMetadata.ts`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts`
- `src/core/account/runtimeBoundary.ts`
- `src/core/account/__tests__/runtimeBoundary.test.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## Preserved Behavior

- No authentication flow changes
- No Supabase schema change
- No repository contract change
- No feature-level business logic change
- No storage migration
- No backup format change
- No local data deletion on sync failure
- No silent overwrite of newer local data
- No silent overwrite of newer remote data
- Offline local usage remains available

## Validation

Commands run:

- `git diff --check`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `pnpm test:run`
- `pnpm build`

Results:

- TypeScript: passed
- Tests: passed
- Build: passed

Build note:

- The existing Vite warning about `/alios/service-worker-registration.js` without `type="module"` remains unchanged from previous stages.

## Known Limitations

- There is still no dedicated manual conflict-resolution UI.
- Conflict review remains surfaced as status and metadata, not a record-by-record workflow.
- Diagnostics are local operational metadata only and are not yet rendered in Settings.
- Real browser/device validation was not performed in this stage.

## Recommended Next Stage

Stage 240 should add an explicit conflict review workflow and record-level resolution UX before AliOS expands sync into more sensitive or content-heavy modules.
