# AliOS Sync Foundation Preparation - Stage 213A

Date: 2026-07-27

Status: `STAGE_213A_SYNC_FOUNDATION_PREPARATION_COMPLETE`

## 1. Stage Summary

Stage 213A prepares the data architecture for a future optional account and cloud-sync track without changing current AliOS behavior. AliOS remains local-first, single-user, static-hosting compatible, and fully usable with no account, no backend, and no remote data copy.

This stage is intentionally preparation-only. It documents the current persistence architecture, identifies the main coupling risks, and adds a minimal sync-ready contract around repository-backed entities.

## 2. Base and Branch

- Base source: latest `origin/main`, including merged Stage 212
- Base commit: `48a5dc2`
- Branch: `codex/stage-213a-sync-foundation-preparation`

## 3. Current Storage Architecture Findings

### Repository-backed persisted entities

AliOS already keeps its primary user data behind the approved repository and storage-adapter boundary:

- `dailyCheckins`
- `tasks`
- `projects`
- `journalEntries`
- `knowledgeItems`
- `settings`
- `inboxItems`
- `financeTransactions`
- `financeObligations`
- `decisionLogEntries`
- `manualEntries`
- `goals`
- `lifeAreas`
- `routines`
- `weeklyPlans`

These records are persisted in Dexie / IndexedDB, exported through backup version 1, and accessed in feature hooks via `useStorageAdapter()`.

### Browser-storage preferences and local runtime state

AliOS also stores a second class of data outside Dexie:

- appearance
- accent color
- language
- display name
- recovery mode
- backup reminder metadata
- view density mode
- weekly task budget
- dashboard layout
- Home collapsed sections
- routine-nudge preferences
- local AI endpoint preference
- local error log
- calendar display preference
- wellness / badminton helper state

Most of these are intentionally local-only browser preferences rather than shareable domain records. They should not be treated as syncable entity data by default.

## 4. Current Domain Model Inventory

Primary persisted domain records confirmed from `src/shared/types`, Dexie schema, repositories, and backup types:

- Tasks
- Daily Check-ins
- Projects
- Goals
- Life Areas
- Weekly Plans
- Finance Transactions
- Finance Obligations
- Decision Log Entries
- Personal Manual Entries
- Journal Entries
- Knowledge Items
- Inbox Items
- Routines
- Repository-owned Settings records

Related local-only preference/runtime models confirmed from shared preferences and feature helpers:

- Appearance preference
- Accent preference
- Language preference
- View density mode
- Weekly task budget
- Recovery mode
- Backup status metadata
- Dashboard layout and collapsed-section preferences
- Local error summaries
- Calendar display preference
- Wellness helper state

## 5. Confirmed Coupling Problems

### A. Repository-backed feature data is mostly in good shape

The main feature hooks already use `useStorageAdapter()` and repository contracts instead of importing Dexie directly. Confirmed examples:

- `src/features/today/hooks/useTodayData.ts`
- `src/features/finance/hooks/useFinance.ts`
- `src/features/goals/hooks/useGoals.ts`
- `src/features/manual/hooks/useManualEntries.ts`
- `src/features/decisions/hooks/useDecisionLog.ts`
- `src/features/weeklyReview/hooks/useWeeklyReview.ts`
- `src/features/home/hooks/useHomeDashboard.ts`

This is the strongest existing foundation for a future optional sync adapter.

### B. Browser-storage preferences are still fragmented

Confirmed direct `localStorage` usage still exists across shared and feature code, including:

- `src/shared/i18n/I18nProvider.tsx`
- `src/shared/date/DateDisplayProvider.tsx`
- `src/shared/preferences/backupStatus.ts`
- `src/shared/error/localErrorLog.ts`
- `src/shared/recovery/recoveryMode.ts`
- `src/features/home/homeCollapsedSections.ts`
- `src/features/home/hooks/useHomeDashboardLayout.ts`
- `src/features/settings/components/WeeklyTaskBudgetSection.tsx`
- `src/features/settings/hooks/useBackupRestore.ts`
- `src/features/today/pages/TodayPage.tsx`
- `src/features/weeklyReview/pages/WeeklyReviewPage.tsx`
- `src/features/finance/pages/FinancePage.tsx`
- `src/features/home/pages/HomePage.tsx`

This does not break local-first behavior today, but it means future cross-device preference sync would be harder than syncing repository-backed entities.

### C. Some preference keys remain hardcoded in feature pages

Confirmed examples:

- `alios.viewDensityMode` is read directly in multiple pages instead of always going through `shared/preferences/viewDensityMode.ts`

This is safe today but increases migration risk if preference ownership or serialization rules later change.

### D. Sync boundary existed, but entity scope was implicit

`src/core/sync` already contained:

- a local-only provider
- a future-consent guard
- simple sync status/result types

What it did not yet contain was an explicit catalog of which repository-owned entity groups are eligible for future sync. Stage 213A adds that missing map.

## 6. Implementation Added in This Stage

### New code contracts

- `src/core/sync/syncableEntities.ts`
  - Defines the repository-backed entity catalog for future optional sync work
  - Maps each syncable entity to its repository owner, Dexie table, and backup field

- `src/core/sync/syncMetadata.ts`
  - Defines minimal pure types for a future sync cursor and sync record envelope
  - Keeps the contract generic and provider-agnostic

- `src/core/sync/__tests__/syncableEntities.test.ts`
  - Guards the new catalog against duplicate entity/table/backup-field definitions

### Updated exports

- `src/core/sync/index.ts`
  - Re-exports the new Stage 213A sync-foundation contracts

## 7. Why These Changes Were Needed

- Future cloud sync must start from repository-backed domain entities, not from scattered feature assumptions.
- AliOS already has two different persistence classes: shareable domain records in Dexie and local browser preferences in `localStorage`.
- Without an explicit entity catalog, a future sync adapter could accidentally drift from Dexie tables, backup coverage, or repository ownership.
- A pure metadata contract is a safe preparation step because it clarifies future boundaries without changing current runtime behavior.

## 8. Intentional Non-Changes

- No authentication
- No account model
- No Supabase integration
- No network requests
- No remote copy of user data
- No UI change
- No route change
- No localStorage format change
- No schema or migration change
- No backup format change
- No repository behavior change
- No business logic change
- No dependency change

## 9. Migration Risks and Follow-Up Concerns

- Cross-device sync for repository-backed records is structurally easier than sync for browser-only preferences.
- View-density, dashboard layout, and similar local preferences are still stored through mixed access patterns and would need consolidation before they could sync safely.
- Recovery-mode flags, backup reminder metadata, and local error logs probably should remain device-local even in a future account-based architecture.
- Settings currently mixes repository-owned settings records and `localStorage` preferences; future sync work must keep those scopes separate.

## 10. Recommended Next Stage

Stage 213B should introduce a preference-boundary preparation pass:

- inventory every remaining `localStorage` key in one canonical registry
- route hardcoded preference reads through shared preference helpers
- classify each preference as device-local, account-local, or intentionally unsynced

That would make a future optional sync adapter safer without prematurely changing runtime behavior.
