# AliOS Account & Sync Settings Screen-State Specification - Stage 219

Date: 2026-07-28

Status: `STAGE_219_ACCOUNT_SYNC_SETTINGS_SCREEN_STATE_COMPLETE`

## 1. Stage Summary

Stage 219 defines the future Settings screen-state specification for the `Account & Sync` section in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, UI components, runtime account screens, schema changes, repository changes, storage changes, route changes, or any change to current local-first behavior.

This stage builds directly on:

- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward existing local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `7312a75470659cb2869311ac689cb5cd057011f0`
- Branch: `codex/stage-219-account-sync-settings-screen-state`

## 3. Screen Purpose

The future `Account & Sync` section in Settings should become the canonical place where a user understands:

- whether AliOS is local-only or account-connected
- whether sync exists and whether it is enabled
- what data stays local
- what actions are safe and available next
- how Account & Sync relates to backup, export, recovery, and device-local support features

This section must not behave like onboarding, marketing, or a replacement for current local-first safety tools.

## 4. Shared Screen Structure

Across all future states, the `Account & Sync` screen should keep one stable reading order:

1. Account state summary
2. Sync state summary
3. Primary action area
4. Ownership and scope explanation
5. Device-local exceptions
6. Attention panel when needed
7. Secondary account actions
8. References to Backup / Restore, Export, or Recovery when relevant

This stability matters because the user should not have to relearn where trust, status, and actions live when the state changes.

## 5. Shared Section Inventory

These are the future reusable sections that may appear in different states.

### 5.1 Account summary panel

Purpose:

- show whether the user is local-only, signed in, or signed out
- show identity only when an account exists

### 5.2 Sync summary panel

Purpose:

- show whether sync is off, enabled, paused, offline, or needs review

### 5.3 Primary action area

Purpose:

- show the single most relevant next action for the current state

Examples:

- `Create account`
- `Sign in`
- `Enable sync`
- `Resume sync`
- `Review conflict`

### 5.4 Ownership and scope panel

Purpose:

- explain what data may sync
- explain what remains local
- reinforce that backup/export still matters

### 5.5 Device-local exceptions panel

Purpose:

- explicitly call out items that do not become part of the synced account

Examples:

- recovery mode
- local error log
- local AI endpoint settings
- temporary device-specific UI state

### 5.6 Attention panel

Purpose:

- show paused, conflict, offline, or expired-session issues without hiding them in generic status text

### 5.7 Secondary actions area

Purpose:

- hold lower-priority actions that should not visually compete with the primary action

Examples:

- `Sign out`
- `Disable sync`
- `Manage devices`

### 5.8 Linked safety references

Purpose:

- remind the user that Backup / Restore, Export, and Recovery remain separate trusted tools

## 6. Screen-State Specifications

This section defines the future Settings surface state by state.

### 6.1 Local-only

Meaning:

- no account connected
- no sync configured
- current data remains local on this device

Visible sections:

1. Account summary panel
2. Sync summary panel
3. Primary action area
4. Ownership and scope panel
5. Device-local exceptions panel
6. Linked safety references

Primary messages:

- `Local only`
- AliOS already works on this device without an account
- nothing is being uploaded

Available user actions:

- `Create account`
- `Sign in`
- navigate to Backup / Restore
- navigate to Export Center

Safety messaging:

- account is optional
- local data stays on this device unless future sync is explicitly enabled
- backup/export remains the current transfer and recovery path

Empty-state meaning:

- no account is connected yet

Error-state meaning:

- if future account setup fails to launch or is dismissed, remain in local-only with no data change

### 6.2 Account available

Meaning:

- future product copy may reference account capability before the user signs in
- this is still effectively local-only, but with clearer explanation that account features exist

Visible sections:

1. Account summary panel
2. Primary action area
3. Ownership and scope panel
4. Device-local exceptions panel
5. Linked safety references

Primary messages:

- `Account optional`
- AliOS can stay local-only, or you can add an account later

Available user actions:

- `Create account`
- `Sign in`

Safety messaging:

- do not imply setup urgency
- do not imply account creation protects data automatically

Empty-state meaning:

- account capability exists, but no account is active

Error-state meaning:

- account services unavailable later should not weaken local-only use

### 6.3 Signed-in sync-off

Meaning:

- account is connected
- sync is still off
- local data remains local unless later consent is completed

Visible sections:

1. Account summary panel with identity
2. Sync summary panel
3. Primary action area
4. Ownership and scope panel
5. Device-local exceptions panel
6. Secondary actions area
7. Linked safety references

Primary messages:

- `Signed in, sync off`
- sign-in did not upload your data

Available user actions:

- `Enable sync`
- `Sign out`
- if needed, future `Review device data`

Safety messaging:

- sign-in is separate from sync
- local records remain available on this device
- backup/export still remains valid

Empty-state meaning:

- authenticated, but sync has not been configured

Error-state meaning:

- if sync setup cannot begin, stay signed-in sync-off without data change

### 6.4 Sync enabled

Meaning:

- account is connected
- explicit sync consent is complete
- future provider may sync approved scope

Visible sections:

1. Account summary panel with identity
2. Sync summary panel
3. Primary action area
4. Ownership and scope panel
5. Device-local exceptions panel
6. Secondary actions area
7. Linked safety references

Primary messages:

- `Sync on`
- approved records and supported preferences may sync
- local copy remains available on this device

Available user actions:

- `Pause sync` or `Disable sync`
- `Manage devices`
- `Sign out`

Safety messaging:

- sync does not replace backup
- device-local technical state remains local

Empty-state meaning:

- sync is active even if there is currently nothing new to sync

Error-state meaning:

- if provider activity fails, the surface should move to paused or attention state instead of implying data loss

### 6.5 Sync paused

Meaning:

- sync is configured but temporarily not progressing
- user review or a recovery action is needed

Visible sections:

1. Account summary panel with identity
2. Sync summary panel
3. Primary action area
4. Attention panel
5. Ownership and scope panel
6. Device-local exceptions panel
7. Secondary actions area
8. Linked safety references

Primary messages:

- `Sync paused`
- clear reason, when known

Available user actions:

- `Resume sync`
- `Review issue`
- `Disable sync`
- `Sign out`

Safety messaging:

- paused does not delete or overwrite local data
- no hidden retry should silently change conflict outcomes

Empty-state meaning:

- sync is waiting on user action or environment recovery

Error-state meaning:

- paused is the safe user-visible wrapper around incomplete consent, account re-verification, or unresolved sync interruptions

### 6.6 Offline

Meaning:

- local use continues
- future provider actions are waiting for connectivity

Visible sections:

1. Account summary panel if signed in
2. Sync summary panel
3. Attention panel
4. Ownership and scope panel
5. Device-local exceptions panel
6. Secondary actions area when relevant
7. Linked safety references

Primary messages:

- `Offline`
- AliOS can keep working locally on this device

Available user actions:

- continue local use
- retry later
- optionally `Sign out`

Safety messaging:

- offline is not a loss state
- local data remains available

Empty-state meaning:

- no remote work can continue until connectivity returns

Error-state meaning:

- offline should remain visually distinct from conflict or expired-session states

### 6.7 Conflict detected

Meaning:

- overlapping data requires explicit review before sync continues

Visible sections:

1. Account summary panel with identity
2. Sync summary panel
3. Attention panel
4. Primary action area
5. Ownership and scope panel
6. Device-local exceptions panel
7. Secondary actions area
8. Linked safety references

Primary messages:

- `Sync needs review`
- AliOS stopped before making a silent merge decision

Available user actions:

- `Review conflict`
- `Resolve later` only if sync remains safely paused
- `Sign out`

Safety messaging:

- nothing has been merged or overwritten silently
- user review is required before sync resumes

Empty-state meaning:

- no conflict is currently unresolved

Error-state meaning:

- if review data cannot load, keep sync paused and local data intact

### 6.8 Signed out

Meaning:

- account session ended
- local data remains on this device

Visible sections:

1. Account summary panel
2. Sync summary panel
3. Primary action area
4. Ownership and scope panel
5. Device-local exceptions panel
6. Linked safety references

Primary messages:

- `Signed out`
- local AliOS data on this device is unchanged

Available user actions:

- `Sign in`
- `Create account`

Safety messaging:

- sign-out does not delete local data
- local-only use continues

Empty-state meaning:

- signed out returns the product to local-first use

Error-state meaning:

- if remote sign-out cannot complete cleanly, local records still must not change

## 7. Loading, Error, and Empty-State Rules

### 7.1 Loading

Future loading states must be calm and specific.

Allowed meanings:

- checking account status
- loading sync status
- loading conflict review details

Loading must not:

- imply that account is required for app use
- block unrelated local Settings surfaces longer than necessary

### 7.2 Error states

Future error states should map to the real product state rather than collapse everything into one generic error.

Preferred distinctions:

- unable to start account action
- sync paused
- offline
- session expired
- conflict review unavailable

Every error state must preserve:

- local usability
- backup/export trust
- explicit explanation that local data is still available when true

### 7.3 Empty states

For Account & Sync, `empty` usually means:

- no account connected
- no sync configured yet
- no conflict or no current issue to review

Empty states must remain informative, not promotional.

## 8. Relationship to Existing Settings Surfaces

The future `Account & Sync` section must stay clearly separate from existing AliOS Settings surfaces.

### 8.1 Preferences

Account & Sync must not absorb:

- language
- theme
- accent
- density or ordinary view preferences

Those remain preferences even when some of them may later sync as account preferences.

### 8.2 Backup / Restore

Backup / Restore remains:

- the manual recovery path
- the explicit device-transfer path until sync is approved and enabled

Account & Sync must not present Backup / Restore as a sync tool or hidden merge tool.

### 8.3 Export

Readable exports remain:

- user-controlled outputs
- separate from account sync

Account & Sync may reference export for trust and portability, but must not blur their meanings.

### 8.4 Recovery Mode and local support surfaces

Recovery Mode, Local Error Log, and other local technical support surfaces remain device-scoped.

Account & Sync may reference them when a user needs local support, but must not claim they are part of the synced account experience.

## 9. Safety Messaging Contract

Across every future screen state, the Settings surface must preserve these meanings:

1. no account is required to use AliOS
2. sign-in does not upload local data by itself
3. sync requires explicit consent
4. local data remains available on this device
5. backup/export still matters after sync exists
6. conflicts stop sync instead of triggering silent merges
7. sign-out does not equal local-data deletion

## 10. Recommended Next Stage

Recommended next stage: Stage 220 - Account & Sync Action Panel and Copy Placement Specification

That stage should remain planning-only and define:

- exact future panel copy placement inside each state
- primary versus secondary button hierarchy
- warning-panel composition
- how Stage 217 copy fragments are attached to Stage 219 screen sections without duplication or ambiguity
