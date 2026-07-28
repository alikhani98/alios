# Stage 230 - Account Settings UI Foundation

## Summary

Stage 230 adds the first visible `Account & Sync` surface inside Settings without enabling any account system, remote copy, session state, or sync behavior.

The implementation keeps AliOS fully local-first and uses the existing Settings composition, semantic tokens, shared surfaces, and button primitives instead of introducing a new styling path.

## Implemented UI states

- Added a first-class `Account & Sync` Settings section title in place of the narrower sync-only framing.
- Expanded the existing status card into a local-only foundation surface that explains:
  - no account is connected;
  - data remains on this device;
  - future sync is not enabled.
- Added non-functional placeholder actions for:
  - `Create account`
  - `Sign in`
  - `Enable sync`
- Kept those actions visibly disabled so the product does not imply account capability before a separately approved implementation stage exists.
- Preserved the existing local backup / transfer guidance and consent requirements for any future optional sync provider.

## Non-goals

- No authentication
- No Supabase
- No remote sync
- No API calls
- No session runtime
- No schema or repository changes
- No storage migration
- No fake account state

## Future connection points

- The visible Settings section now provides the stable place where future account and sync states can appear.
- The disabled placeholders map to the approved planning chain from Stages 215-229 without activating any unfinished runtime flow.
- Existing backup / restore remains the only real cross-device path in the current release.

## Why actions are disabled

The buttons are intentionally non-functional because AliOS still ships as a local-first product with no account provider enabled. Showing them as disabled preserves product honesty, avoids fake flows, and makes the future integration boundary explicit to users and developers.
