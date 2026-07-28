# Stage 232 - Account & Sync Interaction Polish

## Summary

Stage 232 polishes the visible `Account & Sync` Settings experience introduced in Stages 230 and 231 without activating authentication, sync, or any remote behavior.

The work stays UI-only and keeps AliOS fully local-first.

## What changed

- Refined the `Account & Sync` card hierarchy so the active `Local-only` state leads the reading path.
- Improved spacing and grouping between:
  - the current active state;
  - future informational sync states;
  - consent and safety explanations;
  - future account action placeholders.
- Added expandable explanation sections for:
  - consent requirements;
  - offline behavior;
  - conflict review expectations.
- Made future disabled actions clearer with a dedicated planned-only status and a stronger explanatory hint.
- Improved scanability of sync states by separating the active current state from future informational states.

## Accessibility and interaction polish

- Reused the shared `CollapsibleSection` primitive for keyboard-accessible expandable content.
- Preserved semantic grouping and labels for snapshot and action areas.
- Kept disabled future actions explicitly described through shared explanatory text.
- Preserved RTL/LTR-safe spacing and icon alignment through existing shared primitives and directional spacing utilities.

## Non-goals

- No authentication
- No Supabase
- No remote sync
- No API calls
- No sessions
- No schema changes
- No repository changes
- No storage changes

## Future connection points

- The refined state presentation is ready for future safe runtime wiring to approved account/sync contracts.
- The collapsible consent, offline, and conflict sections provide stable surfaces for future behavior-specific copy without requiring another structural redesign.
