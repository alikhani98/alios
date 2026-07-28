# AliOS Account & Sync State Flow Mapping - Stage 218

Date: 2026-07-28

Status: `STAGE_218_ACCOUNT_SYNC_STATE_FLOW_COMPLETE`

## 1. Stage Summary

Stage 218 defines the future Account & Sync state-flow contract for AliOS.

This stage maps the user-facing states, transitions, safety guards, and UX expectations that must govern any future account or sync implementation. It remains planning-only and does not activate authentication, remote sync, Supabase, schema changes, storage changes, repository changes, migrations, runtime UI, or any change to current local-first behavior.

This stage builds directly on:

- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 214C - Session Lifecycle Contract
- Stage 214D - First Login Local Record Association Contract

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward existing local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `439af7eb8e5a43ac766b35cbf79ef0dfc5d22f1b`
- Branch: `codex/stage-218-account-sync-state-flow`

## 3. State Model

Stage 218 defines the user-facing product states that future Account & Sync work must use.

### 3.1 Local-only user

Meaning:

- no account is connected
- no sync is configured
- all current records remain local on this device

Characteristics:

- fully usable product state
- default future starting state
- backup/export remains the user-controlled transfer and recovery path

### 3.2 Account created or signed in, sync disabled

Meaning:

- authenticated identity exists
- sync is still off
- local data is still local unless explicit association and later sync setup occur

Characteristics:

- authenticated state is not equivalent to upload-capable state
- this is the required intermediate state after successful account creation or sign-in

### 3.3 Sync enabled

Meaning:

- authenticated identity exists
- explicit sync consent has been completed
- future remote sync may operate on the approved scope

Characteristics:

- local data remains available
- backup/export remains valid
- sync only covers approved records and supported preferences

### 3.4 Sync paused

Meaning:

- sync was enabled or prepared
- sync is not currently progressing
- user attention, re-confirmation, or recovery is required

Examples:

- user manually paused sync
- network or provider flow requires re-verification
- conflict review is required
- consent or device association is incomplete

### 3.5 Offline state

Meaning:

- the device is offline or temporarily unable to reach a future provider
- local use continues
- remote sync actions must wait

Characteristics:

- this is not a data-loss state
- offline should layer onto other states without erasing local usability

### 3.6 Conflict detected

Meaning:

- future sync encountered overlapping or competing account/local data
- AliOS stopped before making a silent merge decision

Characteristics:

- requires explicit user review
- must not auto-resolve destructively

### 3.7 Signed out state

Meaning:

- account session has ended
- local records remain on this device
- device-local preferences remain device-local

Characteristics:

- functionally returns the product to a local-only state
- must not imply data deletion

### 3.8 New device state

Meaning:

- a signed-in or newly-authenticated context exists on a device with existing local AliOS data that is not yet associated with the account

Characteristics:

- requires explicit review and association choice
- must not silently claim or upload device-local records

## 4. State Transition Contract

This section defines the allowed future transitions and the required guardrails around them.

### 4.1 Local-only -> Create account

Trigger:

- user chooses `Create account`

Required transition result:

- move from local-only toward authenticated identity flow
- do not change repository records
- do not upload any local data

Required user understanding:

- creating an account is optional
- local data remains on this device unless later consent is given

### 4.2 Create account -> Authenticated

Trigger:

- future auth provider completes account creation or sign-in successfully

Required transition result:

- authenticated identity becomes available
- state becomes `account created or signed in, sync disabled`

Must not happen automatically:

- sync activation
- local-record claim
- merge
- upload

### 4.3 Authenticated -> Enable sync

Trigger:

- user explicitly chooses `Enable sync`

Required prerequisite checks:

1. authenticated identity exists
2. sync scope is disclosed
3. device-local exceptions are disclosed
4. local copy preservation is disclosed
5. backup/export relationship is disclosed
6. user confirms consent

Result:

- state may proceed to `sync enabled`
- if local record association is still unresolved, the flow must stop for association review first

### 4.4 Sync enabled -> Pause sync

Trigger:

- user explicitly pauses sync
- or future runtime moves to a paused state because user action is needed

Required result:

- sync stops progressing remotely
- local data remains usable
- account identity may remain connected

Must not happen:

- local data deletion
- silent sign-out
- destructive reset of associated records

### 4.5 Pause sync -> Resume sync

Trigger:

- user chooses a recovery or resume action

Required checks:

- cause of pause is visible
- user knows whether review, sign-in refresh, or network recovery is needed

Result:

- may return to `sync enabled`
- or remain paused until all blocking conditions are resolved

### 4.6 Sync enabled -> Conflict handling

Trigger:

- future sync discovers overlapping or competing data requiring user review

Required result:

- state moves to `conflict detected`
- active sync work pauses
- no automatic merge winner is chosen

Required user understanding:

- AliOS stopped before changing data silently
- review is needed before sync continues

### 4.7 Logout flow

Trigger:

- user chooses `Sign out`

Required result:

- end authenticated session
- stop remote sync activity
- preserve local data
- preserve device-local preferences
- state returns to `signed out`, which behaves like local-only from the product perspective

Must not happen:

- local record deletion
- backup removal
- rewriting current local repository data

### 4.8 New device association flow

Trigger:

- authenticated identity becomes available on a device with existing local data that is not yet associated

Required intermediate step:

- enter `new device state`

Required user choices:

- keep using locally for now
- review and associate this device's local data with the account

Must not happen automatically:

- claiming records
- uploading records
- merging records
- overwriting any future remote data

## 5. Safety Rules

These rules apply to every future transition.

### 5.1 No silent upload

Authentication alone must never permit background upload.

Future upload-capable state requires:

- authenticated identity
- explicit sync consent
- any needed local-record association review

### 5.2 No silent merge

If local and remote data overlap, AliOS must stop and present a review state.

It must not:

- auto-combine records
- auto-select local over remote
- auto-select remote over local

### 5.3 No destructive conflict resolution

Conflict handling must never default to deletion, overwrite, or irreversible collapse of records.

Any future destructive choice must be:

- explicit
- clearly labeled
- separate from neutral continuation actions

### 5.4 User always owns the decision

The user must explicitly approve:

- sign-in or account creation
- local record association
- sync enablement
- conflict resolution choices
- sign-out
- pause/resume sync actions that affect remote behavior

### 5.5 Local data remains available

At every state in this contract:

- current local records remain usable unless the user later performs a separate destructive local action
- backup/export remains part of the safety model

## 6. UX Contract by State

This section maps each state to what the user should see and what they can do.

### 6.1 Local-only user

User sees:

- local-only status summary
- explanation that AliOS already works without an account
- backup/export reassurance

Available actions:

- `Create account`
- `Sign in`
- use current backup/export flows

Warnings:

- none urgent by default

Empty-state meaning:

- no account is connected yet

Error-state meaning:

- auth setup failed to start or was dismissed; product remains local-only

### 6.2 Account created or signed in, sync disabled

User sees:

- identity summary
- explicit `sync off` or equivalent message
- reminder that sign-in did not upload local data

Available actions:

- `Enable sync`
- `Sign out`
- future review of account association state

Warnings:

- if local data is unassociated, show the need for review before sync

Empty-state meaning:

- signed in, but no sync has been configured

Error-state meaning:

- account exists but sync setup could not continue

### 6.3 Sync enabled

User sees:

- active sync state
- account summary
- reminder that local copy remains available
- backup/export reassurance

Available actions:

- `Pause sync` or `Disable sync`
- `Sign out`
- `Manage devices`

Warnings:

- any provider or connection issue must surface as paused/attention state, not silent failure

Empty-state meaning:

- sync is on, even if there is currently nothing new to sync

Error-state meaning:

- future sync failure should fall to paused or attention state without implying local loss

### 6.4 Sync paused

User sees:

- paused status
- specific reason when known
- one clear next step

Available actions:

- `Resume sync`
- `Review issue`
- `Sign out`
- optional `Disable sync`

Warnings:

- paused state should be explicit, never hidden behind a neutral signed-in label

Empty-state meaning:

- sync is configured but waiting on user resolution

Error-state meaning:

- paused may be the safe wrapper around connection, consent, or conflict interruption

### 6.5 Offline state

User sees:

- offline message
- reassurance that local use continues

Available actions:

- continue local use
- retry later when online

Warnings:

- do not describe temporary offline state as sync failure if no data risk exists

Empty-state meaning:

- no remote work can continue until connectivity returns

Error-state meaning:

- if offline blocks a future provider action, the UI should distinguish `offline` from `conflict` and `expired session`

### 6.6 Conflict detected

User sees:

- conflict-review state
- explanation that AliOS stopped before merging automatically
- clear review action

Available actions:

- `Review conflict`
- `Resolve later` only if sync safely stays paused
- `Sign out` without deleting local data

Warnings:

- must clearly warn that no merge has been completed yet

Empty-state meaning:

- no conflicts remain after review

Error-state meaning:

- if review data cannot load, sync remains paused and local data remains usable

### 6.7 Signed out state

User sees:

- local-only style state summary
- reassurance that local data still exists

Available actions:

- `Sign in`
- `Create account`

Warnings:

- sign-out message must not imply account removal equals data deletion

Empty-state meaning:

- signed out returns product status to local-only operation

Error-state meaning:

- if sign-out fails remotely, AliOS should still avoid changing local records silently

### 6.8 New device state

User sees:

- explanation that this device already contains local AliOS data
- explanation that records are not yet associated with the account
- explicit choice surface

Available actions:

- `Keep using locally for now`
- `Review and associate this device`

Warnings:

- must warn that AliOS will not claim or upload these records automatically

Empty-state meaning:

- no local records were found, so ordinary signed-in flow may continue

Error-state meaning:

- if association review cannot complete, keep data local and unclaimed

## 7. Relationship to Prior Stages

### 7.1 Stage 215 - Account & Sync Experience Planning

Stage 215 defined the future user journey and the rule that authentication, association, and sync are separate approvals.

Stage 218 translates that journey into discrete state and transition rules.

### 7.2 Stage 216 - Settings Surface Contract

Stage 216 defined where Account & Sync lives in Settings and what the future section must show.

Stage 218 defines how the states inside that surface evolve over time and what transitions are allowed.

### 7.3 Stage 217 - Consent Copy Contract

Stage 217 defined the exact wording for reassurance, consent, warnings, and recovery.

Stage 218 defines when those messages must appear and what product states they belong to.

## 8. Implementation Notes for Future Stages

Any future implementation stage must preserve this order:

1. account authentication
2. signed-in but still local-only state
3. local record association review when needed
4. explicit sync consent
5. sync-enabled state
6. paused/conflict/offline recovery handling

Future implementation must not collapse:

- signed in
- associated
- sync enabled
- sync paused
- conflict review required

into a single generic `connected` state.

## 9. Recommended Next Stage

Recommended next stage: Stage 219 - Account & Sync Settings Screen-State Specification

That stage should remain planning-only and define:

- exact Settings section layouts for each approved state
- action grouping and button priority
- paused/conflict/offline attention panels
- state-specific empty and error surfaces
- how Stage 217 copy appears within each Stage 218 state
