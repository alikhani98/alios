# Stage 243 - Sync Data Security & Privacy Layer

## Summary

Stage 243 adds a practical privacy layer on top of the existing AliOS account and sync foundation so users can understand what syncs, what stays local, and how the current stage handles sensitive data.

The implementation stays intentionally small:

- no new authentication flow
- no new backend
- no repository replacement
- no schema redesign
- no custom encryption system

## What changed

- Extended sync category status metadata so each user-visible category now carries:
  - enabled status
  - privacy level
  - visibility model
- Added minimal trusted-device metadata support through the existing sync status model:
  - current device identifier
  - sync ownership via existing owner metadata
  - last trusted device summary
- Expanded the Settings `Account & Sync` surface with a dedicated `Sync privacy` section that explains:
  - what syncs now
  - what stays local
  - the explicit no-silent-upload rules
- Added category-level privacy and visibility badges so the current sync state is easier to scan.
- Added focused rendering coverage for privacy state presentation, disabled categories, and local-only behavior.

## Sync privacy model

### Preferences

- Sync enabled: yes
- Privacy level: standard
- User visibility: synced when connected

### Tasks

- Sync enabled: yes
- Privacy level: standard
- User visibility: synced when connected

### Projects

- Sync enabled: yes
- Privacy level: standard
- User visibility: synced when connected

### Goals

- Sync enabled: yes
- Privacy level: standard
- User visibility: synced when connected

### Finance

- Sync enabled: yes
- Privacy level: sensitive
- User visibility: synced when connected

### Personal Manual

- Sync enabled: no content sync
- Privacy level: private
- User visibility: metadata-only readiness in this stage

## Safety rules preserved

- No silent data upload
- No unexpected category activation
- No change to local-first ownership
- Local data remains available when sync is paused, offline, or fails
- No repository ownership changes
- No schema changes
- No migration behavior changes

## Trusted device metadata

This stage adds only minimal trusted-device support:

- current sync device identifier
- last trusted device label
- last trusted device sync timestamp

This is intentionally operational metadata only. It does not introduce a device-management system, account security dashboard, or enterprise device-trust model.

## Files changed

- `src/core/sync/types.ts`
- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `docs/SYNC_DATA_SECURITY_PRIVACY_STAGE_243.md`
- `PROJECT_STATE.md`
- `CHANGELOG.md`

## Validation

Required validation for this stage:

- `git diff --check`
- TypeScript validation
- `pnpm test:run`
- `pnpm build`

## Known limitations

- This stage explains privacy and category scope more clearly, but it does not add encryption or a dedicated security control center.
- Trusted-device metadata is minimal and informational only.
- Personal Manual content remains local-only.

## Recommended next stage

Validate the privacy layer in real multi-device usage and then expand the same explicit privacy model into the next approved sync-sensitive surface only after the user-facing scope remains understandable in Settings.
