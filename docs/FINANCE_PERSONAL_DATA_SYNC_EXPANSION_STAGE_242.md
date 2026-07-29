# Stage 242 - Finance & Personal Data Sync Expansion

## Summary

Stage 242 expands the existing AliOS sync foundation into the important personal data that is already modeled safely in the current codebase, while preserving the app's local-first behavior.

This stage adds real sync coverage for Finance transactions and obligations, extends conflict handling compatibility to those Finance records, and adds Personal Manual metadata-only readiness reporting without syncing Personal Manual entry content.

## What changed

- Expanded the sync provider so Finance transactions and Finance obligations now participate in the existing synced-record flow.
- Added additive sync metadata support to Finance transactions, Finance obligations, and Manual entries so ownership and sync state can be tracked without changing existing local data behavior.
- Added Finance and Personal Manual write triggers so the sync boundary can react to repository-owned record changes without bypassing the current storage architecture.
- Extended the Settings `Account & Sync` surface so it now shows:
  - Finance as an active synced category
  - Personal Manual readiness as metadata-only preparation
  - richer category-level sync summaries
  - Finance conflict grouping support
- Expanded tests to cover Finance sync success, Finance sync failure safety, and Personal Manual readiness metadata.

## Scope clarification

The current Finance implementation stores:

- Transactions
- Obligations

There are not yet separate persisted `accounts`, `budgets`, or standalone `categories` entities in the current repository model.

Because this stage must stay minimal and production-oriented, the implementation syncs the Finance records that actually exist today:

- `financeTransactions`
- `financeObligations`

Budget understanding remains derived from synced Finance records instead of introducing a new persistence model in this stage.

## Personal Manual boundary

Stage 242 does **not** sync Personal Manual entry content.

It only adds readiness metadata for future sync planning:

- local entry count
- last modified timestamp
- readiness state

This keeps writing and reading behavior unchanged while making the current Settings surface more honest about what is and is not prepared for future sync.

## Safety rules preserved

- Local repositories remain the runtime source of truth.
- Offline usage remains available.
- No local data is deleted when sync fails.
- No silent overwrite path was added.
- Conflict review remains explicit and compatible with the existing conflict UI.
- No schema migrations, repository ownership changes, or route changes were introduced.

## Files changed

- `src/shared/types/finance.ts`
- `src/shared/types/manual.ts`
- `src/core/sync/types.ts`
- `src/core/sync/recordChangeEvents.ts`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts`
- `src/db/dexie/repositories/DexieFinanceRepository.ts`
- `src/db/dexie/repositories/DexieManualRepository.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `docs/FINANCE_PERSONAL_DATA_SYNC_EXPANSION_STAGE_242.md`

## Validation

Stage completion requires:

- `git diff --check`
- TypeScript validation
- `pnpm test:run`
- `pnpm build`

## Known limitations

- Finance sync in this stage covers transactions and obligations only because those are the persisted Finance record types that currently exist.
- Personal Manual remains local-only for entry content.
- This stage does not expand sync into Decision Log, recovery data, local logs, or other sensitive modules.

## Recommended next stage

Validate Stage 242 in a real multi-device flow and then expand the same explicit, local-first sync model into the next approved sensitive data surface only after browser/device verification confirms that Finance sync status, failure messaging, and conflict review remain understandable.
