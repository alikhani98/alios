# Stage 241 - Conflict Resolution UI

## Summary

Stage 241 adds the first practical user-facing conflict review workflow to the `Account & Sync` Settings surface. The implementation stays inside the existing local-first account and sync foundation: no new authentication flow, no backend change, no repository change, no schema change, and no storage-ownership change.

## Implemented UI Changes

### 1. Conflict review surface

- Added a dedicated `Conflict review` panel inside `Settings > Account & Sync`.
- The panel now clearly distinguishes:
  - no-conflicts state
  - conflict-detected state
- When conflicts exist, the surface shows:
  - conflict count
  - grouped affected entity types
  - a visible `Review conflicts` entry point

### 2. Conflict detail cards

- Each conflict card now shows:
  - record title
  - entity type
  - conflict timestamp
  - local device version metadata
  - synced version metadata
  - last-sync timing where available
- The UI stays intentionally simple and review-first.

### 3. Manual resolution actions

- Added two explicit actions for each conflict:
  - `Keep local version`
  - `Keep synced version`
- Each action requires explicit user confirmation before resolution continues.
- No automatic merge editor or silent resolution path was added.

## Runtime and Architecture Notes

- The sync boundary was extended additively with conflict-review methods so the Settings UI can request:
  - current conflict snapshot
  - conflict list
  - explicit conflict resolution
- This keeps the feature aligned with the existing provider seam instead of bypassing repository/storage boundaries.
- Repository behavior, sync-engine architecture, schema ownership, and local data ownership rules remain unchanged.

## Safety Rules Preserved

- No silent overwrite
- No silent merge
- No silent deletion
- User confirmation is required for each resolution choice
- Failed resolution keeps the current local-first workflow intact

## Files Changed

- `src/core/account/runtimeBoundary.ts`
- `src/core/sync/types.ts`
- `src/core/sync/LocalOnlySyncProvider.ts`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## Automated Validation

Commands run:

- `git diff --check`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `pnpm test:run`
- `pnpm build`

## Real-World Validation Status

This stage does **not** claim real browser, mobile-device, or live multi-device sync QA.

The implementation was validated through source-level review plus automated checks only. A follow-up browser/device pass should verify:

- connected sync conflict discovery
- resolution confirmation flow
- RTL/LTR layout behavior
- narrow-width readability
- keyboard and focus behavior

## Recommended Next Stage

Validate the new conflict review workflow in a real browser with representative connected sync data, then expand the same explicit review-first model to broader sync recovery and richer multi-device error handling.
