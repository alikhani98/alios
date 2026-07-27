# AliOS First Login Local Record Association Contract - Stage 214D

Date: 2026-07-27

Status: `STAGE_214D_LOCAL_RECORD_ASSOCIATION_CONTRACT_COMPLETE`

## 1. Stage Summary

Stage 214D defines how future authenticated onboarding may associate existing local AliOS data with a user account without enabling Supabase, login UI, sync, schema changes, or runtime migration behavior.

This stage is contract-only. AliOS remains local-first and unchanged at runtime.

## 2. Base and Branch

- Base source: Stage 214C local branch state
- Base commit: `1472aa4`
- Branch: `codex/stage-214d-local-record-association-contract`

## 3. First Login Flow

### Scenario

A user already has local AliOS data and then creates or signs into a future account.

### Ownership before login

Before login, repository-backed data is treated as belonging to the current local user on the current device.

- no account is required
- records stay fully usable
- records are not sync candidates yet

### Association after login

After authentication:

- identity may become available for local record association
- existing local records may become account-linked
- association is a future onboarding step, not an automatic side effect of login

### Claim behavior

The contract explicitly requires:

- no automatic claim
- explicit confirmation before claim
- explicit claim required rather than silent adoption
- explicit skip remains conceptually allowable for a future flow, but the default contract requires user confirmation before claim occurs

### Duplicate prevention

The default duplicate strategy is:

- block silent duplicates
- require manual review before sync

This keeps first-login association from silently inventing merged data or writing over future remote records.

## 4. Migration Rules

The migration contract explicitly requires:

- no data deletion
- no overwrite
- no silent merge
- backup format remains compatible

The contract does not authorize record-shape mutation or repository record rewriting.

## 5. Sync Preparation

### When records become sync candidates

Records become future sync candidates only after:

1. a user is authenticated
2. the relevant local records are explicitly associated
3. explicit sync setup is later completed

Authentication alone is not enough.

### Ownership metadata attachment

The contract requires future ownership metadata to attach through:

- sidecar sync metadata only

That means association metadata must not mutate the existing repository record shape in this contract track.

### Unsynced associated local records

Associated records remain local until explicit sync activation is completed.

They may be account-linked in concept without being uploaded or merged remotely.

## 6. Why These Changes Were Needed

- Stage 214C established that identity may become available before sync is enabled, but it did not define how existing local records should safely enter that account boundary.
- Without an explicit first-login association contract, a future provider stage could silently claim, overwrite, merge, or duplicate user data.
- This contract preserves AliOS's local-first trust model by making claim behavior explicit, non-destructive, and confirmation-based.

## 7. Files Changed

### New files

- `src/core/auth/localRecordAssociationContract.ts`
- `src/core/auth/__tests__/localRecordAssociationContract.test.ts`
- `docs/LOCAL_RECORD_ASSOCIATION_CONTRACT_STAGE_214D.md`

### Updated files

- `src/core/auth/index.ts`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## 8. Intentional Non-Changes

- no Supabase integration
- no login UI
- no sync enablement
- no database schema change
- no storage-format change
- no backup-format change
- no repository mutation
- no dependency change
- no runtime behavior change

## 9. Recommended Next Stage

Stage 214E should define the future sync metadata sidecar contract:

- where record-association metadata lives
- how association state is tracked without touching record payloads
- how duplicate-review state is represented before any real provider is activated
