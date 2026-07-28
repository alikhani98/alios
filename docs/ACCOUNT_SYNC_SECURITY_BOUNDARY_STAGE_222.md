# AliOS Account & Sync Security Boundary Contract - Stage 222

Date: 2026-07-28

Status: `STAGE_222_ACCOUNT_SYNC_SECURITY_BOUNDARY_COMPLETE`

## 1. Stage Summary

Stage 222 defines the future security boundary contract for optional Account & Sync features in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, session runtime, token handling, encryption, remote sync, database changes, schema changes, repository changes, storage migrations, or UI changes.

This stage builds directly on:

- Stage 214C - Session Lifecycle Contract
- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 221 - Account & Sync Data Ownership Model

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward current local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `941602587d92b4d09ef53094edb0ec26fdca8f5d`
- Branch: `codex/stage-222-account-sync-security-boundary`

## 3. Security Boundary Purpose

The future Account & Sync architecture needs a strict boundary between:

- local user data
- authenticated session state
- device-local technical trust
- future remote sync behavior

This contract exists to make sure that future account work never:

- silently transfers local data
- silently deletes local data
- weakens the user’s local ownership of records
- mixes auth session concerns into backups, preferences, or ordinary feature data

## 4. Session Ownership Model

Future session state belongs to the authentication boundary, not to user-authored product data.

### 4.1 What session state may represent

A future authenticated session may represent:

- user identity availability
- authenticated account presence
- session freshness or expiration state
- provider-specific remote authorization state

### 4.2 What session state must not own

Session state must not become the owner of:

- repository-backed user records
- local backups
- local exports
- device-local technical settings
- ordinary feature preferences

### 4.3 Ownership separation rule

Future implementation must preserve:

- account session = access context
- local records = user data already present on the device
- sync setup = separate explicit choice after authentication

Authentication must not be treated as ownership transfer by itself.

## 5. Device Trust Model

AliOS remains a local-first application that trusts the current device with the local working copy of user data.

### 5.1 Trusted local responsibilities

The device remains trusted to hold:

- current local records
- current local preferences
- current local backups created by the user
- device-local technical state

### 5.2 Trusted-device limits

Even on a trusted device, future account work must not assume:

- local records may be uploaded without consent
- local records may be claimed without review
- local device state may be silently reframed as cloud-owned

### 5.3 Device-local safety principle

The device stays the home of the current working copy unless and until the user explicitly approves account association and sync.

## 6. Future Security States

This stage defines the security meaning of future product states.

### 6.1 Local-only

Security meaning:

- no remote account authority is active
- all data remains under local device ownership

### 6.2 Authenticated but sync off

Security meaning:

- identity exists
- remote account access may exist
- local data still remains local
- no upload authority is active yet

### 6.3 Sync enabled

Security meaning:

- authenticated account access exists
- explicit user permission exists for approved sync scope
- local data still remains locally available

### 6.4 Sync paused

Security meaning:

- remote sync authority is temporarily suspended or blocked
- local copy remains available
- no unresolved pause may silently continue in the background

### 6.5 Conflict detected

Security meaning:

- AliOS must stop before making a data ownership decision
- security favors non-destructive pause over silent automation

### 6.6 Signed out

Security meaning:

- remote account authority ends
- local data remains under device ownership

## 7. Logout Behavior Rules

Future logout must preserve the local-first trust model.

### 7.1 Required logout behavior

Logging out must:

- end the authenticated session
- stop future remote sync activity
- preserve local repository-backed data
- preserve device-local preferences and device-local technical state

### 7.2 Forbidden logout behavior

Logging out must not:

- delete local records by default
- remove backups
- clear preferences unrelated to the session boundary
- imply that local data is now inaccessible without an account

### 7.3 Sign-out wording rule

Future UI and provider behavior must keep this meaning:

- sign out ends access to the account
- sign out does not erase the local working copy

## 8. Sensitive Data Boundaries

The future security model must preserve strong separation around sensitive data classes.

### 8.1 Session-sensitive data

The following future data remains outside ordinary app-data ownership:

- auth tokens
- refresh tokens
- provider session metadata
- provider-issued credential material

These must not live in:

- preferences
- backups
- exported user content
- repository-backed feature data

### 8.2 Sensitive user-authored data

The following categories remain user-owned content and require explicit disclosure before any sync:

- finance records
- journal entries
- daily check-ins
- personal manual entries
- decision notes
- knowledge items

Security implication:

- sensitive content cannot be hidden inside vague `sync your data` language
- future consent must remain category-aware

### 8.3 Device-local technical data

These remain local and outside sync promises:

- recovery mode
- local error log
- local AI endpoint settings
- temporary UI support state

## 9. Recovery and Account-Loss Rules

Future account-related failure states must preserve local ownership even when remote account access is unavailable.

### 9.1 Account-loss principle

If the user loses access to the future account:

- local records already on the device remain locally available
- backup/export remains valid as a user-controlled recovery path
- AliOS must not treat account loss as local-data revocation

### 9.2 Session-expired principle

If a future session expires:

- remote account actions may pause
- local data remains available
- sync may remain disabled or paused until re-authentication

### 9.3 Recovery principle

Recovery actions must prioritize:

1. preserving the local working copy
2. preserving backup/export trust
3. making remote/account re-entry explicit

## 10. Local-First Security Principles

These principles govern every future implementation stage:

1. no account is required for basic use
2. no local data is transferred silently
3. no local data is deleted silently
4. no local ownership is lost through sign-in alone
5. security failures should pause and explain, not automate irreversible decisions
6. session boundaries must stay separate from user-authored product data

## 11. Export / Backup Relationship

Future account work must preserve the existing local recovery story.

### 11.1 Backup

Backup remains:

- a user-controlled recovery artifact
- a manual portability tool
- separate from future authenticated session state

### 11.2 Export

Readable export remains:

- a user-controlled data output
- separate from future session or sync mechanics

### 11.3 Security rule

Neither backup nor export may silently become:

- a login artifact
- a token carrier
- a sync state carrier

## 12. Future Implementation Constraints

Any later implementation stage must preserve all of these constraints.

### 12.1 Explicitly prohibited by this contract

- silent data transfer after sign-in
- silent deletion on logout
- storing tokens in preferences
- storing tokens in backups
- storing session state inside repository-backed product records
- treating device-local technical state as synced account data
- remote account failure causing silent local record loss

### 12.2 Requires explicit future approval

- auth provider activation
- session storage strategy
- secure token lifecycle implementation
- remote sync provider activation
- any encryption strategy
- any change to backup/export semantics

## 13. Recommended Next Stage

Recommended next stage: Stage 223 - Account & Sync Sensitive Scope Disclosure Specification

That stage should remain planning-only and define:

- how sensitive categories are disclosed in future sync consent
- how local-only technical exclusions are explained
- how security warnings and reassurance copy should appear in account-related settings flows
