# AliOS Preference Boundary Consolidation - Stage 213B

Date: 2026-07-27

Status: `STAGE_213B_PREFERENCE_BOUNDARY_CONSOLIDATION_COMPLETE`

## 1. Stage Summary

Stage 213B consolidates the AliOS preference boundary so future account-sync work can distinguish user-owned preferences from device-local and intentionally-unsynced metadata.

This stage does not add authentication, remote sync, Supabase, UI changes, route changes, storage-format changes, or dependency changes. Existing `localStorage` keys continue to work unchanged.

## 2. Base and Branch

- Base source: Stage 213A local branch state
- Base commit: `4b3c6e4`
- Branch: `codex/stage-213b-preference-boundary-consolidation`

## 3. Preference Categories

### Account-synced preferences

These are user-owned preferences that could reasonably follow the same person across devices in a future opt-in sync architecture:

- language
- appearance
- accent color
- display name
- view density
- calendar display
- Home dashboard layout
- Home collapsed sections
- Finance collapsed sections
- weekly task budget
- morning warmup enabled

### Device-local preferences

These remain tied to one browser or device environment:

- recovery mode
- local error log
- local AI Ollama base URL
- morning warmup dismissed-for-today state
- wellness helper-card temporary state

### Intentionally-unsynced metadata

These are operational records that should not be treated as cross-device user intent:

- backup status metadata
- legacy backup timestamp compatibility key

## 4. Implementation

### New shared preference boundary helpers

- `src/shared/preferences/storage.ts`
  - shared safe `localStorage` access
  - shared preference change notification
  - shared read/write/remove helpers

- `src/shared/preferences/registry.ts`
  - canonical preference inventory
  - explicit sync classification for each known preference key

### Consolidated existing readers/writers

Updated preference access to use the shared helper layer while keeping the same keys and fallback behavior:

- `src/shared/preferences/accentColor.ts`
- `src/shared/preferences/viewDensityMode.ts`
- `src/shared/preferences/backupStatus.ts`
- `src/shared/i18n/I18nProvider.tsx`
- `src/shared/date/DateDisplayProvider.tsx`
- `src/shared/recovery/recoveryMode.ts`
- `src/features/home/hooks/useHomeDashboardLayout.ts`
- `src/features/home/homeCollapsedSections.ts`
- `src/features/settings/components/WeeklyTaskBudgetSection.tsx`
- `src/features/settings/hooks/useBackupRestore.ts`

### Reduced hardcoded preference coupling

Direct page checks for `alios.viewDensityMode` now read through the shared view-density helper instead of hardcoded `localStorage` access:

- Home
- Today
- Weekly Review
- Finance

## 5. Why These Changes Were Needed

- Stage 213A confirmed that repository-backed entity data is cleaner than the current preference layer.
- Preference reads and writes were repeated across modules with slightly different safe-storage behavior.
- Future account sync needs a canonical answer to "which preferences should sync?" before any provider work can begin.
- A shared helper plus registry reduces migration risk while preserving current behavior.

## 6. Intentional Non-Changes

- no authentication
- no account model
- no remote sync provider
- no Supabase integration
- no UI redesign
- no route change
- no schema or migration change
- no localStorage key rename
- no backup-format change
- no dependency change

## 7. Remaining Risks

- Some device-local helper state still lives outside the main shared preference modules and may need a later pass if AliOS expands device-specific preferences further.
- The current stage classifies preferences but does not yet introduce an account-level sync adapter or conflict-resolution model.
- `lastRestoredAt` remains a small local operational timestamp and is intentionally outside the main registry for now because it is backup workflow metadata rather than a reusable product preference.

## 8. Recommended Next Stage

Stage 213C should define the future sync profile contract:

- which account-synced preferences belong in a user preference profile
- which device-local preferences must remain device-scoped
- how preference export/import and optional remote sync should interact without breaking local-first behavior
