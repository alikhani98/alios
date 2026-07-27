# AliOS Account & Sync Experience Planning - Stage 215

Date: 2026-07-27

Status: `STAGE_215_ACCOUNT_SYNC_EXPERIENCE_PLANNING_COMPLETE`

## 1. Stage Summary

Stage 215 defines the future user-facing experience for optional accounts and optional sync in AliOS without implementing authentication, remote sync, Supabase, schema changes, repository changes, or runtime UI behavior.

This stage translates the architecture groundwork from Stages 213A through 214D into explicit UX contracts. The goal is to protect the local-first trust model before any future account UI or sync provider is approved.

AliOS remains:

- local-first
- fully usable without an account
- export/import compatible
- explicit-consent only for any future upload or account-linking behavior

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `a722e24c2a3fab9fa0359cf1a500b610c9bbb998`
- Branch: `codex/stage-215-account-sync-experience-planning`

## 3. Current Foundation Audit

### Stage 213A - Sync Foundation

Confirmed groundwork:

- repository-backed entities are already cataloged as future sync candidates
- preference state is intentionally separate from repository-backed records
- cloud sync still has no runtime provider

UX implication:

- any future account/sync surface must explain that AliOS already works locally before an account exists
- account setup cannot be presented as required onboarding

### Stage 213B - Preference Boundary

Confirmed groundwork:

- preferences are classified as account-synced, device-local, or intentionally-unsynced

UX implication:

- future account UI must not imply that every preference follows the user everywhere
- device-local settings need their own explanation when sync exists

### Stage 213C - Sync Profile Contract

Confirmed groundwork:

- repository-backed records are future account-owned sync data
- account preferences are distinct from device-local preferences
- local writes remain authoritative at write time
- remote sync requires explicit account setup

UX implication:

- the account experience must clearly distinguish:
  - user data that may sync
  - settings that remain device-local
  - backup/export behavior that remains available regardless of account state

### Stage 214A - Auth Provider Abstraction

Confirmed groundwork:

- auth is provider-agnostic
- local-only runtime remains the shipped default

UX implication:

- future sign-in screens must be optional entry points into an already-usable product, not the front door for basic use

### Stage 214B - Auth Runtime Integration

Confirmed groundwork:

- the app now has an auth runtime seam
- no routes or features require authenticated state

UX implication:

- any future account entry point can remain contained to Settings and app-shell awareness first, instead of restructuring feature flows

### Stage 214C - Session Lifecycle Contract

Confirmed groundwork:

- authentication does not enable sync by itself
- logout preserves local data
- tokens must stay out of preferences and backups

UX implication:

- the future UX must separate:
  - signed in
  - sync configured
  - sync paused
  - local-only

These are not the same state and must never be collapsed into one vague “connected” message.

### Stage 214D - Local Record Association Contract

Confirmed groundwork:

- local records are not auto-claimed on first login
- explicit confirmation is required
- no silent merge, overwrite, or deletion is allowed
- ownership metadata must stay sidecar-only

UX implication:

- the first account association flow must behave like a deliberate ownership step, not a hidden migration

## 4. UX Contract Principles

The future account and sync experience must preserve all of these rules:

1. AliOS works before login.
2. Creating an account is optional.
3. Signing in does not upload data by itself.
4. Sync requires a second, explicit opt-in step after authentication.
5. Local data remains on-device unless the user explicitly chooses otherwise.
6. Backup/export stays available whether or not an account exists.
7. Logout does not delete local records.
8. Conflict and duplicate situations must be explained in plain language before any remote write occurs.

## 5. Future User-Facing Contracts

### 5.1 Settings account entry point

Primary future entry point:

- Settings

Recommended placement:

- a dedicated “Account & Sync” section above advanced export/recovery surfaces but below core appearance/preferences

Required first-state behavior:

- when no account exists, show AliOS as local-only
- explain that the app is already storing data on this device
- offer a future sign-in/create-account action without urgency language

Required copy meaning:

- “Your data stays on this device unless you choose account sync later.”

Must not imply:

- that the user is currently at risk without an account
- that account creation is required for normal use
- that local-only mode is incomplete or degraded

### 5.2 Sign-in / account creation flow concept

Future flow concept:

1. user enters the Account & Sync section
2. user chooses sign in or create account
3. auth provider completes authentication
4. AliOS returns to an authenticated-but-still-local state
5. AliOS asks what to do with existing local data
6. only after explicit confirmation may local records become account-associated
7. only after a separate explicit sync opt-in may remote sync become active

This intentionally creates two distinct approvals:

- authentication approval
- sync/data-association approval

### 5.3 Local-only user state before login

Before login, the user-facing state should communicate:

- your data is stored locally on this device
- you can keep using AliOS without an account
- backup/export is available now
- account features are optional future convenience, not a prerequisite

User-facing local-only indicators should emphasize:

- local device ownership
- no background upload
- manual backup availability

### 5.4 Optional sync opt-in flow

Authentication alone is not sync consent.

Future sync opt-in must include:

- what kinds of data may sync
- what stays device-local
- confirmation that a local copy remains available
- confirmation that backup/export still works
- a clear start-sync action

The opt-in screen must explicitly identify:

- account-owned records
- account-synced preferences
- excluded device-local state
- excluded operational metadata

Must never happen silently:

- enabling sync immediately after login
- treating sign-in as consent to upload all local data
- enabling background upload before the user sees the scope

### 5.5 First device association experience

When a newly signed-in user already has local records, the future UX must present a deliberate local-record association step.

Required behavior:

- explain that AliOS found existing local data on this device
- explain that this data is not yet associated with the signed-in account
- require explicit user confirmation before account-linking
- allow the user to defer sync setup even after authentication

The UX should conceptually support:

- “Keep using locally for now”
- “Associate this device’s local data with my account”

Association approval must not be hidden inside:

- a checkbox preselected by default
- a generic “Continue” button with no data explanation
- account-creation completion copy that implies claiming already happened

### 5.6 Logout expectations

Future logout UX must clearly state:

- the account session will end
- local data stays on this device
- device-local preferences remain device-local
- remote sync, if enabled, stops

Logout must not:

- delete repository-backed local records
- reset the user’s browser-local AliOS state without explicit separate confirmation
- imply that logging out is equivalent to clearing data

If a future “sign out and disconnect sync” action exists, it should remain separate from any destructive local-data action.

### 5.7 Sync status visibility

The user-facing model needs distinct visible statuses, not one vague badge.

Recommended future states:

- Local only
- Signed in, sync not set up
- Ready to sync
- Sync paused
- Sync needs attention
- Sync conflict requires review

Status visibility should live in:

- Settings → Account & Sync as the source of truth
- optional lightweight shell/status summary later, only after the Settings source exists

Status UI must say:

- whether the user is signed in
- whether data is still local-only
- whether sync is active, paused, or blocked
- whether any user action is required

### 5.8 Conflict explanation UX

The future UX must explain conflicts as a data-ownership review problem, not as a hidden technical event.

Required explanation goals:

- explain what data is duplicated or competing
- explain that AliOS stopped before making a silent decision
- explain what the user can review later

Plain-language meaning:

- “AliOS found overlapping data and did not merge it automatically.”

The UX must not:

- silently choose a winner without disclosure
- overwrite local data during first sync
- claim everything was “successfully connected” if manual review is still required

## 6. What Is User-Facing vs Device-Local

### User-facing future account/sync concepts

These may become visible product concepts:

- signed-in identity
- account-associated records
- optional sync status
- sync-ready versus local-only state
- account-synced preferences
- explicit conflict review

### Device-local concepts that remain local

These should stay device-scoped even after future account work:

- recovery mode
- local error log
- local AI endpoint preference
- temporary helper state
- dismissed-for-today runtime state

### Operational metadata that should not be marketed as sync

These should stay outside the user-facing “synced account” promise:

- backup reminder metadata
- legacy compatibility timestamps

## 7. Explicit User Consent Requirements

The future UX must require explicit user consent for:

- creating or signing into an account
- associating existing local records with that account
- enabling sync after authentication
- resolving duplicates or conflicts before remote write
- any future device-disconnect or sync-pause action that changes remote behavior

## 8. Things That Must Never Happen Silently

These are hard UX rules derived from the Stage 213/214 contracts:

- no forced account prompt before normal use
- no hidden upload after authentication
- no automatic local-record claim after sign-in
- no silent merge of local and remote data
- no overwrite of local records during first association
- no deletion of local records on logout
- no storing tokens in preferences
- no putting session data in backups
- no presenting device-local state as if it were synced

## 9. Export / Import Compatibility Rules

Future account UX must preserve the current local-first recovery story:

- backup/export remains available without an account
- backup/import remains understandable as a local data-safety tool
- future sync must not replace backup in the product language
- importing a backup must not silently rewire account ownership

Recommended product framing:

- backup = user-controlled portability and recovery
- sync = optional account convenience, if explicitly enabled later

## 10. Recommended Follow-Up Stage

Recommended next stage: Stage 216 - Account & Sync Settings Surface Contract

That stage should stay planning-only and define:

- the exact Settings information architecture
- empty, signed-in, sync-paused, and conflict-needed screen states
- future consent copy structure
- logout and disconnect wording
- which account/sync messages belong in Settings only versus app-wide status surfaces
