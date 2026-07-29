# Stage 248 - Account & Sync Actually Usable

## Summary

Stage 248 makes the existing Account & Sync foundation practical for real owner use without changing repository ownership, schema behavior, backup compatibility, or local-first safety rules.

## What Is Actually Usable Now

1. Google account connection
   - AliOS can sign in with a real Google account on the current device.
   - The Settings surface shows the connected account state and supports sign-out.

2. Explicit sync enable step
   - Sign-in alone no longer starts record upload or remote exchange.
   - The owner must explicitly choose `Enable sync` on the current device before sync begins.

3. Real first-device flow
   - Device 1 can sign in, enable sync, and upload the approved synced records.

4. Real second-device flow
   - Device 2 can sign in with the same account, enable sync, and download the existing synced records.

5. Approved synced data in this stage
   - Preferences
   - Finance transactions and obligations
   - Personal Manual entries
   - Existing synced planning records remain supported by the current provider boundary

## Implementation Notes

- Added a local explicit-sync opt-in gate inside the current Supabase sync provider.
- Kept automatic sync retries limited to sessions that have already enabled sync.
- Expanded the synced record boundary to include `manualEntries` through the same backup-storage merge path already used for other synced records.
- Updated the Settings sync presentation so Personal Manual appears as a real synced category instead of readiness-only metadata once sync is enabled.

## Preserved Behavior

- No repository ownership changed.
- No storage format or schema changed.
- No migrations changed.
- No backup/export format changed.
- No local data is deleted silently.
- No conflict is resolved silently.
- Offline local usage remains available even when sync fails.

## Files Changed

- `src/core/sync/SupabasePreferenceSyncProvider.ts`
- `src/core/sync/types.ts`
- `src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `docs/ACCOUNT_SYNC_USABLE_STAGE_248.md`

## Validation

- `git diff --check`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `pnpm test:run`
- `pnpm build`

## Known Limitations

- This stage does not claim real browser/device verification.
- This stage does not add new synced modules beyond the currently approved scope.
- Complex merge editing is still out of scope; conflict handling remains explicit keep-local vs keep-synced review.

## Recommended Next Stage

Run a real connected-device QA pass for laptop and mobile with the same Google account, then fix only confirmed usability, consent, RTL/LTR, theme, and responsive issues.
