# AliOS Account & Sync Interaction Flow Specification - Stage 220

Date: 2026-07-28

Status: `STAGE_220_ACCOUNT_SYNC_INTERACTION_FLOW_COMPLETE`

## 1. Stage Summary

Stage 220 defines the future interaction-flow contract for Account & Sync in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, database changes, schema changes, repository changes, storage changes, UI changes, or any runtime behavior change.

This stage builds directly on:

- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping
- Stage 219 - Account & Sync Settings Screen-State Specification

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward current local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `70b4e7aca10253020f75338ab78d3943d2a5b2ba`
- Branch: `codex/stage-220-account-sync-interaction-flow`

## 3. Interaction Flow Principles

Every future Account & Sync flow must preserve these product rules:

1. AliOS works before account setup.
2. Entering Account & Sync must never feel like mandatory onboarding.
3. Authentication is not consent to upload.
4. Sync is not allowed to begin before a second, explicit approval step.
5. Existing local data must never be silently claimed, merged, overwritten, or deleted.
6. Backup / Restore and Export remain separate trusted tools.
7. When AliOS is unsure, it must stop and ask instead of deciding silently.

## 4. First Account Entry Flow

### Purpose

This flow covers the first time a local-only user opens the future `Account & Sync` section in Settings.

### Entry condition

- current user state is `local-only`

### Expected flow

1. User opens Settings.
2. User opens `Account & Sync`.
3. AliOS shows local-only status first.
4. AliOS explains:
   - account is optional
   - current data is local on this device
   - backup/export remains available now
5. AliOS offers optional next actions:
   - `Create account`
   - `Sign in`
6. If the user takes no action, the product remains fully usable locally.

### Required user-visible state

- `Local only`
- calm, non-urgent account availability language

### Required safety confirmations

- no data is being uploaded
- no account is required to keep using AliOS

### Error and recovery path

If a future account-action entry fails to launch:

- stay in local-only state
- show a non-destructive retry path
- do not alter local records

## 5. Create Account Flow

### Purpose

This flow covers optional account creation from the local-only or signed-out state.

### Entry conditions

- `local-only`
- `signed-out`

### Expected flow

1. User chooses `Create account`.
2. AliOS transitions into future auth-provider handoff.
3. After provider success, AliOS returns to Settings in `signed-in sync-off`.
4. AliOS explicitly communicates:
   - account is connected
   - sync is still off
   - local data has not been uploaded
5. If local device records need association review later, that remains a separate next step.

### Must not happen automatically

- sync enablement
- local record association
- upload
- merge

### Required user-visible state

- `Signed in, sync off`

### Required safety confirmations

- sign-in did not upload your data
- local records remain available on this device

### Error and recovery path

If account creation fails or is interrupted:

- return to local-only or signed-out state
- show retry guidance
- do not partially activate sync

## 6. Enable Sync Flow

### Purpose

This flow covers the future opt-in from signed-in identity to upload-capable sync.

### Entry condition

- `signed-in sync-off`

### Expected flow

1. User chooses `Enable sync`.
2. AliOS opens a dedicated consent step.
3. AliOS explains:
   - what records may sync
   - what supported preferences may sync
   - what stays device-local
   - that the local copy remains available
   - that backup/export still matters
4. If local record association is unresolved, AliOS stops and routes through that review first.
5. User explicitly confirms sync enablement.
6. Only then may AliOS move to `sync enabled`.

### Required user-visible states

- pre-confirmation `signed-in sync-off`
- confirmation step with explicit scope disclosure
- post-confirmation `sync enabled`

### Required safety confirmations

- nothing uploads until confirmation
- account sign-in and sync are separate actions
- local data remains available

### Must not happen automatically

- upload after sign-in alone
- hidden association claim
- background start without review

### Error and recovery path

If sync setup is interrupted:

- return to `signed-in sync-off` or `sync paused`, depending on where interruption happened
- show that local data remains unchanged
- allow retry without rewriting local records

## 7. Disable Sync Flow

### Purpose

This flow covers turning off future remote synchronization without forcing sign-out or deleting local records.

### Entry condition

- `sync enabled`
- optionally `sync paused`

### Expected flow

1. User chooses `Disable sync`.
2. AliOS shows a confirmation explaining:
   - remote sync will stop
   - account identity may remain connected
   - local data stays on this device
3. User confirms.
4. AliOS returns to `signed-in sync-off`.

### Required user-visible state

- `Signed in, sync off`

### Required safety confirmations

- disabling sync does not delete local data
- disabling sync is separate from sign-out

### Must not happen

- local record deletion
- silent sign-out
- forced loss of account identity

### Error and recovery path

If disabling sync cannot complete:

- keep the current sync state visible
- show retry or safe-cancel option
- preserve local usability

## 8. Sign Out Flow

### Purpose

This flow ends the authenticated session without deleting local AliOS data.

### Entry conditions

- `signed-in sync-off`
- `sync enabled`
- `sync paused`
- `offline` while signed in
- `conflict detected`

### Expected flow

1. User chooses `Sign out`.
2. AliOS shows confirmation explaining:
   - account session will end
   - local data on this device remains
   - sync, if enabled, will stop
3. User confirms.
4. AliOS transitions to `signed-out`, which behaves like local-only from the product perspective.

### Required user-visible state

- `Signed out`
- local data unchanged on this device

### Required safety confirmations

- sign-out does not delete local records
- backup/export remains available

### Must not happen

- silent local-data clearing
- rewriting repository data
- treating sign-out as destructive cleanup

### Error and recovery path

If remote sign-out cannot finish:

- keep local records untouched
- show retry guidance
- avoid ambiguous mixed-state wording

## 9. Conflict Resolution Entry Flow

### Purpose

This flow covers the moment future sync stops because overlapping data needs explicit user review.

### Entry condition

- current sync activity detects conflict or competing data

### Expected flow

1. AliOS detects overlap.
2. AliOS stops sync progression.
3. AliOS moves to `conflict detected`.
4. Settings shows a visible attention state.
5. User is offered a clear `Review conflict` action.

### Required user-visible state

- `Sync needs review`

### Required safety confirmations

- AliOS stopped before merging automatically
- nothing was silently overwritten
- user review is required before sync continues

### Must not happen

- automatic winner selection
- silent merge
- destructive default resolution

### Error and recovery path

If future conflict details cannot load:

- keep sync paused
- preserve local data
- allow retry later
- avoid claiming the issue is resolved

## 10. New Device Flow

### Purpose

This flow covers the future case where an authenticated identity appears on a device that already has local AliOS data.

### Entry condition

- signed-in identity exists
- local records exist on the current device
- those records are not yet associated with the account

### Expected flow

1. AliOS detects existing local data on this device.
2. AliOS enters `new device state`.
3. AliOS explains:
   - these local records are not yet account-associated
   - no records have been claimed or uploaded
4. User chooses one of the safe next steps:
   - `Keep using locally for now`
   - `Review and associate this device`
5. If the user defers, the product stays usable locally and sync does not start.

### Required user-visible state

- device-association review state

### Required safety confirmations

- no automatic claim
- no automatic upload
- no silent merge

### Error and recovery path

If association review cannot continue:

- keep records local and unclaimed
- allow retry later
- do not move into sync-enabled state

## 11. User-Visible States Across Flows

The following future state labels must remain visibly distinct throughout all interaction flows:

- `Local only`
- `Account optional`
- `Signed in, sync off`
- `Sync on`
- `Sync paused`
- `Offline`
- `Sync needs review`
- `Signed out`
- new-device association review state

Future interaction flows must not collapse these into one generic `connected` or `syncing` label.

## 12. Safety Confirmations

These confirmations must appear at the relevant interaction steps:

### Before account actions

- account is optional
- AliOS already works locally

### Before sync enablement

- what may sync
- what stays local
- local copy remains available
- backup/export remains separate and valid
- nothing uploads until confirmation

### Before sign-out

- local data remains on this device
- sign-out ends the session, not the data

### Before disable sync

- sync will stop
- local data remains
- account identity may remain connected

### Before conflict resolution

- no silent merge has happened
- user decision is required

## 13. Error and Recovery Paths

Every future interaction flow must support a safe recovery path that preserves local-first behavior.

### General recovery rules

- failure must not silently advance the user into a different account/sync state
- failure must not rewrite or delete local records
- failure must not imply data upload happened if it did not
- retry must always be possible from a known visible state

### Preferred recovery outcomes

- failed account action -> return to local-only or signed-out
- interrupted sync setup -> return to signed-in sync-off or paused
- offline interruption -> remain offline-aware but locally usable
- conflict-review interruption -> remain paused and unresolved
- sign-out interruption -> preserve local data and show retry

## 14. Relationship to Existing Local-First Features

The future Account & Sync flows must remain clearly separate from:

### Backup / Restore

- backup remains the manual recovery and transfer path
- sync must not replace or hide backup meaning

### Export

- readable exports remain user-controlled outputs
- exports are not sync actions

### Recovery Mode

- Recovery Mode remains device-local support
- it is not part of account identity or cloud state

### Local Error Log

- local diagnostics remain local
- they must not be described as synced account data

## 15. Recommended Next Stage

Recommended next stage: Stage 221 - Account & Sync Confirmation and Warning Surface Specification

That stage should remain planning-only and define:

- exact confirmation-dialog structure
- destructive vs non-destructive action wording hierarchy
- warning-panel composition
- confirmation copy placement for sign-out, disable-sync, first sync, and new-device association
