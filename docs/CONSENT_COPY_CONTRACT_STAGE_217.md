# AliOS Consent & Copy Contract - Stage 217

Date: 2026-07-28

Status: `STAGE_217_CONSENT_COPY_CONTRACT_COMPLETE`

## 1. Stage Summary

Stage 217 defines the exact user-facing language and consent model for future optional Account and Sync features in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, schema changes, repository changes, migrations, runtime UI changes, or any change to current local-first behavior.

This stage builds on:

- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- compatible with backup/export as the user-controlled safety path

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `11a6cd83b184d3c100085956bebebbc8bae375d6`
- Branch: `codex/stage-217-consent-copy-contract`

## 3. Copy Principles

All future account and sync copy must preserve these rules:

1. Speak calmly and plainly.
2. Make local-first behavior explicit before mentioning cloud convenience.
3. Treat account creation as optional, never urgent.
4. Separate signing in from enabling sync.
5. Never imply that data is already uploading unless the user explicitly enabled sync.
6. Explain ownership boundaries in user language, not technical language.
7. Keep backup/export trust intact by describing sync as optional convenience, not as the only safety path.

Tone targets:

- reassuring, not sales-like
- explicit, not vague
- user-controlled, not automatic
- trustworthy about local data and non-destructive actions

## 4. Account Introduction Copy

### 4.1 Purpose statement

Future account introduction copy should explain why AliOS may offer an account:

> An AliOS account can help you connect your data across devices later, if you choose.

### 4.2 Local-only reassurance

Future local-only explanation should say:

> AliOS already works on this device without an account.

Supporting copy:

> Your data stays on this device unless you choose to connect an account and enable sync.

### 4.3 Optional account framing

Future account-entry copy should say:

> Creating an account is optional.

Approved supporting variants:

- `Use AliOS locally, or add an account later if you want sync.`
- `You can keep using AliOS without signing in.`

### 4.4 Copy that must not be used

Do not use wording that implies:

- the app is incomplete without an account
- the user is unsafe until they sign in
- cloud storage is already active
- sign-in automatically protects or uploads all data

Disallowed meaning examples:

- `Finish setup by creating your account`
- `Your data is not protected until you sign in`
- `Sign in to keep AliOS working`

## 5. Sync Consent Copy

### 5.1 Consent intro

Before future sync is enabled, the consent surface should introduce sync with:

> Sync is optional and stays off until you turn it on.

### 5.2 Data-scope explanation

Future sync-scope copy should say:

> If you enable sync, AliOS may sync your account-owned records and supported preferences between your devices.

Use explicit examples nearby:

- tasks
- goals
- finance records
- weekly review records
- personal manual entries
- decisions
- projects
- life areas
- supported account preferences such as language, theme, accent, and view preferences

### 5.3 Device-local exception copy

Future consent copy must explicitly say:

> Some technical and device-specific settings stay only on this device.

Approved examples list:

- recovery mode
- local error log
- local AI endpoint settings
- temporary device-only UI state

### 5.4 Permission confirmation copy

Future confirmation copy before first upload should say:

> Nothing will be uploaded until you confirm.

And:

> Your local data will stay available on this device.

### 5.5 Backup relationship copy

Future sync consent copy should preserve backup trust with:

> Backup and export remain available whether or not you enable sync.

And:

> Sync is optional convenience. Backup remains your user-controlled recovery path.

### 5.6 Consent action labels

Approved action concepts:

- `Enable sync`
- `Not now`
- `Review what syncs`

Avoid vague action labels such as:

- `Continue`
- `Next`
- `Connect everything`

unless the screen already made the exact effect unmistakable.

## 6. Privacy and Ownership Explanations

### 6.1 Local data ownership

Future ownership copy should say:

> Your current AliOS data belongs to this device until you choose to connect it to an account.

### 6.2 Account-linked data

Future account-linked explanation should say:

> After you approve account association, eligible records can belong to your account for future sync.

### 6.3 Device-only data

Future device-only explanation should say:

> Some technical and support information stays only on this device and does not become part of your synced account.

### 6.4 Backup/export relationship

Future backup relationship copy should say:

> Backups and readable exports stay separate from account sync. They remain available for manual recovery, transfer, and record keeping.

### 6.5 Must-never-happen explanation

Future user-facing language should make clear:

> AliOS does not upload, merge, or claim existing local data silently.

## 7. User State Messages

These messages define the future source-of-truth wording for state summaries.

### 7.1 Local-only

Primary message:

> Local only

Supporting copy:

> AliOS is working only on this device right now. No account is connected, and nothing is being uploaded.

### 7.2 Signed in but sync disabled

Primary message:

> Signed in, sync off

Supporting copy:

> Your account is connected, but sync is still off. Your data remains local until you enable sync.

### 7.3 Sync enabled

Primary message:

> Sync on

Supporting copy:

> AliOS can sync approved records and supported preferences with your account. Your local copy stays available on this device.

### 7.4 Sync paused

Primary message:

> Sync paused

Supporting copy:

> Sync is not active right now. AliOS is waiting for your review or confirmation before continuing.

### 7.5 Offline state

Primary message:

> Offline

Supporting copy:

> AliOS can keep working locally on this device. Sync actions will wait until you are online again.

### 7.6 Conflict detected

Primary message:

> Sync needs review

Supporting copy:

> AliOS found overlapping data and stopped before making a silent merge decision.

## 8. Safety Warnings

### 8.1 First sync warning

Future first-sync warning should say:

> Review what will sync before you continue. AliOS will not start uploading until you confirm.

### 8.2 New device association warning

Future new-device warning should say:

> This device already has local AliOS data. Review it before connecting it to your account.

Supporting copy:

> AliOS will not claim this device's local records automatically.

### 8.3 Logout warning

Future logout warning should say:

> Signing out ends your account session on this device. It does not delete your local AliOS data.

### 8.4 Conflict-resolution warning

Future conflict warning should say:

> AliOS found data that needs review. Nothing will be merged or overwritten until you choose how to continue.

## 9. Error and Recovery Messages

### 9.1 Failed sync

Primary message:

> Sync could not finish

Supporting copy:

> Your local data is still available on this device. Review the connection and try again when you are ready.

### 9.2 Expired session

Primary message:

> Session expired

Supporting copy:

> Sign in again to continue account actions. Your local AliOS data on this device is unchanged.

### 9.3 Interrupted setup

Primary message:

> Setup was interrupted

Supporting copy:

> AliOS did not finish connecting this account or enabling sync. Your data remains local until you complete the process.

## 10. Consent Rules That Must Never Be Violated

The future Account & Sync implementation must preserve this copy meaning:

1. No forced account creation.
2. No hidden upload after sign-in.
3. No silent sync activation.
4. No silent claim of existing local records.
5. No silent merge or overwrite during conflict states.
6. No wording that suggests logout deletes local data when it does not.
7. No wording that treats backup/export as obsolete once sync exists.

## 11. Implementation Notes for Future UI Stages

When these copy contracts are implemented later:

- local-only reassurance should appear before any account CTA
- sync consent must use a dedicated confirmation step
- conflict and paused states must have distinct messages
- destructive and non-destructive actions must not share ambiguous labels
- backup/export reassurance should appear wherever sync enablement is introduced

## 12. Recommended Next Stage

Recommended next stage: Stage 218 - Account & Sync State Flow Mapping

That stage should remain planning-only and translate the approved copy and Settings contract into explicit future screen-state flows, transitions, and edge-case paths for:

- local-only to signed-in
- signed-in to sync-enabled
- first-device association
- paused and offline recovery
- conflict review and safe exit paths
