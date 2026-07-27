# AliOS Sync Profile Contract Design - Stage 213C

Date: 2026-07-27

Status: `STAGE_213C_SYNC_PROFILE_CONTRACT_COMPLETE`

## 1. Stage Summary

Stage 213C defines the future account and sync model for AliOS without implementing authentication, Supabase, or live cloud synchronization.

This stage turns the Stage 213A syncable-entity catalog and the Stage 213B preference registry into a future sync profile contract. AliOS remains local-first, single-user in runtime behavior, and fully functional with no account.

## 2. Base and Branch

- Base source: Stage 213B local branch state
- Base commit: `4c40b4f`
- Branch: `codex/stage-213c-sync-profile-contract`

## 3. User Profile Model

Future account identity is defined as a contract only:

- `userId`
- `email`
- `displayName`
- `createdAt`
- `updatedAt`
- `profileVersion`
- `metadata`
  - `locale`
  - `timezone`
  - `preferredIdentityProvider`

This contract is intentionally small and provider-agnostic. It does not choose a runtime backend or auth vendor in this stage.

## 4. Sync Ownership Model

### Account-owned records

Repository-backed records are treated as future account-owned sync data:

- daily check-ins
- tasks
- projects
- journal entries
- knowledge items
- repository-owned settings records
- inbox items
- finance transactions
- finance obligations
- decision log entries
- manual entries
- goals
- life areas
- routines
- weekly plans

### Account preferences

Preferences currently classified as `account-synced` remain future profile-owned preferences:

- language
- theme / appearance
- accent
- display name
- view density
- calendar display
- dashboard layout
- collapsed-section layout preferences
- weekly task budget
- persistent user-owned routine-nudge preferences

### Device-owned data

These remain explicitly device-scoped:

- recovery mode
- local error log
- local AI endpoint
- temporary helper-card state
- dismissed-for-today ephemeral preferences

### Intentionally-unsynced operational metadata

These stay outside the future sync profile:

- backup status metadata
- legacy local backup reminder timestamp

## 5. Sync Rules

### What gets synced

- repository-backed account-owned records
- account-owned preferences from the preference registry

### What stays local

- device-local preferences
- intentionally-unsynced operational metadata
- all runtime behavior until explicit account setup exists

### Conflict strategy proposal

Default proposed strategy:

- account records: `last-write-wins`
- future complex exceptions may opt into `field-merge` or `manual-review`

This stage does not implement conflict resolution. It only records the default contract.

### Offline-first behavior

- local writes remain authoritative at write time
- remote sync must require explicit account setup
- queued upload is allowed in the future model
- background mutation remains forbidden
- AliOS keeps a local copy even when future sync exists

### Export / import compatibility

- backup remains local-first
- backup version stays unchanged in this stage
- repository-backed records remain the backup source of truth
- local preferences may remain outside backup unless a later approved stage changes that behavior explicitly

## 6. Implementation

### New code contracts

- `src/core/sync/profileContract.ts`
  - future sync user profile model
  - ownership model
  - default sync rules
  - preference-category ownership mapping

- `src/core/sync/__tests__/profileContract.test.ts`
  - verifies that all syncable entities are included as account-owned data
  - verifies that every preference registry category is mapped to an ownership class

### Updated exports

- `src/core/sync/index.ts`
  - re-exports the Stage 213C sync profile contract

## 7. Why These Changes Were Needed

- Stage 213A identified which repository-backed entities could sync safely later.
- Stage 213B clarified which preferences should sync, stay device-local, or remain intentionally unsynced.
- A future account stage needs one explicit contract tying identity, record ownership, preference ownership, offline behavior, and backup compatibility together before any provider implementation begins.

## 8. Intentional Non-Changes

- no authentication flow
- no Supabase integration
- no remote API
- no network requests
- no session model
- no UI change
- no route change
- no schema change
- no localStorage key change
- no dependency change

## 9. Risks

- `last-write-wins` is a safe default contract but may be too blunt for some future record classes with rich concurrent edits.
- Repository-owned `settings` records are treated as account-owned record data in the current contract; a later implementation stage may still need to narrow that scope field by field.
- Device-local helper state may grow over time, so the preference registry must stay current as the product evolves.

## 10. Recommended Next Stage

Stage 213D should define the future remote adapter boundary:

- sync session contract
- upload / download checkpoint model
- remote record envelope mapping
- local queue semantics
- failure and retry policy

That stage should still remain contract-first and runtime-inert until account and provider work are explicitly approved.
