# AliOS Account & Sync Settings Surface Contract - Stage 216

Date: 2026-07-28

Status: `STAGE_216_ACCOUNT_SYNC_SETTINGS_SURFACE_CONTRACT_COMPLETE`

## 1. Stage Summary

Stage 216 defines the future Settings surface for optional account and optional sync features without implementing authentication, Supabase, remote sync, schema changes, repository changes, migrations, or runtime UI behavior.

This stage builds directly on Stage 215. Stage 215 defined the future user journey and consent model; Stage 216 turns that journey into a concrete Settings information architecture and state contract.

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- compatible with the existing backup/export trust model

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `6e334e93213464f3f76b777293a0e163b6400c46`
- Branch: `codex/stage-216-account-sync-settings-surface-contract`

## 3. Settings Information Architecture

### 3.1 Placement in Settings

Future account surfaces should live inside Settings as a dedicated top-level section:

- `Account & Sync`

Recommended placement order:

1. Safety/support summary
2. Core preferences
3. `Account & Sync`
4. Backup / Restore
5. Export / Recovery / Local logs / other advanced local operations
6. App information
7. Danger zone

Rationale:

- account and sync are future optional user controls, not app boot requirements
- the section should be visible before destructive/advanced maintenance surfaces
- it must remain clearly separate from existing appearance, language, and other routine preferences

### 3.2 Internal section structure

Inside `Account & Sync`, the future Settings surface should be organized in this order:

1. Current account state summary
2. Sync state summary
3. Primary action area
4. Data scope and ownership explanation
5. Device-local exceptions
6. Conflict / attention panel when needed
7. Secondary account actions

This keeps the reading path:

- what state am I in
- what can I do next
- what happens to my data
- what still stays local

### 3.3 Relationship with existing preferences

The `Account & Sync` section must sit beside, not inside, the existing preferences model.

It must not blur the distinction between:

- appearance/language/density and similar user preferences
- account identity
- sync activation
- backup/export safety operations

Required separation:

- routine preferences stay in Preferences
- account state stays in Account & Sync
- backup/export remains in Backup / Restore and Export Center

## 4. Future User States

### 4.1 Local-only user

Meaning:

- no account connected
- no sync configured
- all current data remains local on this device

Required visible cues:

- clear “Local only” status
- calm explanation that AliOS already works fully without an account
- action affordances for future `Create account` and `Sign in`

Must communicate:

- no data is being uploaded
- backup/export remains the current portability and recovery path

### 4.2 Authenticated user without sync

Meaning:

- account identity exists
- sync is not yet enabled
- local records may still be unassociated or only locally associated

Required visible cues:

- signed-in identity summary
- clear “Sync not enabled” or equivalent state
- action affordance for future `Enable sync`
- short explanation that sign-in alone does not upload data

This state must make the separation obvious:

- signed in ≠ syncing

### 4.3 Sync-enabled user

Meaning:

- authenticated
- explicit sync opt-in completed
- future provider is allowed to sync the approved account-owned scope

Required visible cues:

- signed-in identity
- active sync status
- last sync summary area in future implementation
- clear actions for `Disable sync`, `Sign out`, and `Manage devices`

Required trust cues:

- local copy remains available
- backup/export still remains valid and recommended for user-controlled recovery

### 4.4 Sync paused state

Meaning:

- account exists
- sync had been enabled or prepared
- sync is intentionally paused or blocked pending user action

Required visible cues:

- “Sync paused” as a distinct state, not an error disguised as silence
- clear reason when known
- one obvious recovery action

Examples of future paused reasons:

- user paused sync
- consent is incomplete
- conflict review is required
- account needs re-verification

## 5. Future Actions

### 5.1 Create account

Future Settings entry should allow account creation from the `Account & Sync` section.

Contract requirements:

- treated as optional
- must not replace local-only onboarding
- must not imply that current local data is unsafe until an account exists

### 5.2 Sign in

Future Settings entry should allow sign-in from the same section.

Contract requirements:

- sign-in remains a separate action from enabling sync
- success state must return the user to Settings with authenticated-but-not-yet-synced clarity

### 5.3 Enable sync

Future `Enable sync` action must remain separate from sign-in.

Before it can complete, the surface must explain:

- what kinds of records may sync
- which preferences may sync
- which states remain device-local
- that local data remains preserved
- that backup/export remains available

### 5.4 Disable sync

Future `Disable sync` action must be available without forcing sign-out.

Required meaning:

- stop future remote synchronization
- keep local records intact
- keep the account identity available unless the user separately signs out

The Settings surface should describe this as a sync control, not as destructive account removal.

### 5.5 Sign out

Future `Sign out` action must remain separate from:

- `Disable sync`
- local data clearing
- backup restore

Required meaning:

- end account session
- preserve local data
- preserve device-local preferences

### 5.6 Manage devices

Future `Manage devices` belongs in `Account & Sync`, but as a secondary action.

It should not appear before the user even understands:

- whether sync exists
- whether their current device is local-only or account-associated

Contract meaning:

- inspect connected account devices in the future
- optionally disconnect remote devices later
- never imply that local-only device presence is a remote account event

## 6. Safety UX Requirements

### 6.1 Explicit consent before sync

The Settings surface must require explicit consent before any future sync activation.

The consent moment must identify:

- data categories that may sync
- local copy preservation
- future conflict handling expectation
- backup/export compatibility

### 6.2 Explain local vs cloud ownership

The Settings surface must explain:

- local-first remains the default
- account sync is optional
- some preferences and maintenance state remain device-local

The surface must not market cloud state as if it replaces local ownership.

### 6.3 Explain conflict handling

When conflicts or duplicate-review states exist, the Settings surface must present:

- a distinct attention state
- simple explanation
- next action

Plain-language principle:

- AliOS pauses before making a silent merge decision

### 6.4 Prevent silent uploads

The Settings surface must never hide the transition from:

- local-only
- authenticated but local-only
- sync-enabled

Every future transition to upload-capable state must be explicit and reversible.

### 6.5 Preserve export/import trust

The Settings surface must continue to reinforce:

- backup/export is the user-controlled recovery path
- account sync is optional convenience, not the only protection
- import/restore must not be reframed as a remote merge tool

## 7. Device-Local State That Must Remain Device-Local

The Settings surface must explicitly treat these as device-scoped exceptions:

- recovery mode
- local error log
- local AI endpoint
- temporary helper/UI state

The account section should not promise that these follow the user between devices.

Recommended future phrasing concept:

- “Some technical and device-specific settings stay only on this device.”

## 8. State-by-State Surface Contract

### Local-only

Show:

- local-only status label
- brief explanation of no-account-required model
- `Create account`
- `Sign in`
- optional device-transfer reminder pointing back to backup/export

Hide:

- `Disable sync`
- `Manage devices`
- sync activity detail

### Authenticated, sync not enabled

Show:

- user identity summary
- local-only data status reminder
- `Enable sync`
- `Sign out`
- association/scope explanation

Hide:

- sync-active indicators
- device-management controls unless future implementation needs them before sync

### Sync enabled

Show:

- user identity summary
- active sync status
- future last-sync metadata area
- `Disable sync`
- `Sign out`
- `Manage devices`

Keep visible:

- reminder that local backup/export still matters

### Sync paused

Show:

- paused status
- clear reason
- recovery action
- `Sign out`
- optional `Disable sync`

Avoid:

- vague generic failure copy
- hiding the paused state behind a neutral signed-in label

## 9. Relationship to Existing Settings Surfaces

The future `Account & Sync` section must not absorb or replace:

- Backup / Restore
- Export Center
- Recovery Mode
- Local Error Log
- Local AI endpoint configuration

Instead, it should reference them when needed:

- backup/export for trust and portability
- recovery/local logs for device-local support
- local AI endpoint as explicitly unrelated to account identity

## 10. Things That Must Never Happen Silently

Inside the future Settings surface, these remain prohibited:

- no silent upload after sign-in
- no automatic sync activation
- no automatic claim of local records
- no overwrite of local records
- no silent merge of local and remote data
- no logout-driven local data deletion
- no device-local state presented as cloud-owned
- no backup/import reframed as hidden sync

## 11. Recommended Next Stage

Recommended next stage: Stage 217 - Account & Sync Consent and Copy Contract

That stage should remain planning-only and define:

- the exact wording for consent disclosures
- the copy for local-only, signed-in, paused, and conflict-needed states
- destructive versus non-destructive account actions
- backup/export reassurance text alongside future sync actions
