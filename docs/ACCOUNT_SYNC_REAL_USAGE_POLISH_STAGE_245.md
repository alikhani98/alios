# Stage 245 - Account & Sync Real Usage Polish

## Summary

Stage 245 refines the visible `Account & Sync` experience so the current account, sync, device, and first-sync states feel calmer and easier to trust in day-to-day use. The work stays intentionally narrow: no authentication architecture change, no backend change, no repository or schema change, and no sync-engine behavior change.

## What Changed

- Refined the connected-device presentation so signed-in and signed-out account states can still show the current device clearly instead of falling back to an empty device section before the first successful sync.
- Added a dedicated first-sync guidance panel for authenticated-or-prepared states that have not completed a successful sync yet.
- Replaced more implementation-flavored wording with user-facing copy for:
  - local-only account status
  - Google sign-in labeling
  - future account actions
  - sync consent framing
  - future-state explanations
- Kept the current `Account & Sync` structure intact while improving how users understand:
  - what syncs now
  - what stays local
  - what happens before first sync
  - which actions are available now versus later

## Why These Changes Were Needed

- The previous device section could read as incomplete before first sync because it hid the current device when no connected-device handoff existed yet.
- Several labels still sounded like architecture placeholders instead of product copy, which made the Settings experience feel less ready for normal personal use.
- First-sync guidance was spread across existing sections, but the most important trust questions deserved a clearer single place:
  - what leaves the device
  - what stays local
  - what the user should do next

## Behavior Intentionally Preserved

- No authentication flow changes
- No backend or sync-engine changes
- No repository, storage, schema, or migration changes
- No local-first ownership changes
- No new sync categories
- No automatic sign-in, sync, upload, merge, or conflict resolution behavior

## Files Changed

- `src/features/settings/components/SyncStatusCard.tsx`
- `src/features/settings/__tests__/syncStatusCard.test.tsx`
- `src/shared/i18n/messages.en.ts`
- `docs/ACCOUNT_SYNC_REAL_USAGE_POLISH_STAGE_245.md`
- `PROJECT_STATE.md`
- `CHANGELOG.md`

## Accessibility Notes

- The first-sync guidance uses existing semantic surfaces and readable text hierarchy instead of introducing new interaction complexity.
- Disabled future actions remain explicitly labeled and described instead of looking broken or silently unavailable.
- Existing keyboard and screen-reader patterns for the Settings surface remain intact.

## Responsive Notes

- The new first-sync guidance uses the existing responsive panel/grid vocabulary and should stack safely from mobile through desktop widths.
- The connected-device section now presents useful information even before multi-device metadata expands.

## Known Limitations

- This stage does not include real browser QA or live device verification.
- The device list still reflects only the metadata already available through the current sync foundation.
- Future account and sync actions remain intentionally disabled until a separately approved implementation stage enables them.

## Recommended Next Stage

Validate the current `Account & Sync` experience in real browser and real multi-device usage, then tighten any confirmed responsive or trust-copy gaps before expanding sync scope again.
