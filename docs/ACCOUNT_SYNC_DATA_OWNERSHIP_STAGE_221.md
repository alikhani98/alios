# AliOS Account & Sync Data Ownership Model - Stage 221

Date: 2026-07-28

Status: `STAGE_221_ACCOUNT_SYNC_DATA_OWNERSHIP_COMPLETE`

## 1. Stage Summary

Stage 221 defines the future Account & Sync data-ownership model for AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, database changes, schema changes, repository changes, storage changes, or UI changes.

This stage builds directly on:

- Stage 213B - Preference Boundary Consolidation
- Stage 213C - Sync Profile Contract Design
- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping
- Stage 219 - Account & Sync Settings Screen-State Specification
- Stage 220 - Account & Sync Interaction Flow Specification

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward current local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `a70e0ddf71afce52f4d905edecae3a5820c96ea3`
- Branch: `codex/stage-221-account-sync-data-ownership`

## 3. Ownership Model Overview

The future AliOS account model must distinguish four ownership classes:

1. local-only user data
2. future sync-eligible account data
3. device-local operational or technical data
4. sensitive data that requires explicit consent before any remote treatment

This contract exists so future account work does not guess at ownership per feature or silently widen the sync scope over time.

## 4. Complete Data Ownership Matrix

| Data category | Current source | Ownership class | Future sync eligible? | Notes |
| --- | --- | --- | --- | --- |
| Tasks | Repository-backed | Account-owned user data | Yes, with explicit consent | Never upload before account association and sync opt-in |
| Daily check-ins | Repository-backed | Account-owned user data | Yes, with explicit consent | Reflection data remains user-owned and local-first |
| Projects | Repository-backed | Account-owned user data | Yes, with explicit consent | Preserve existing links and local-first behavior |
| Goals | Repository-backed | Account-owned user data | Yes, with explicit consent | Includes progress and review metadata only through approved model |
| Life Areas | Repository-backed | Account-owned user data | Yes, with explicit consent | Remains ordinary user-authored data |
| Weekly plans | Repository-backed | Account-owned user data | Yes, with explicit consent | Planning data remains user-owned, not provider-owned |
| Routines | Repository-backed | Account-owned user data | Yes, with explicit consent | No silent server-side automation implied |
| Inbox items | Repository-backed | Account-owned user data | Yes, with explicit consent | Still local-first by default |
| Journal entries | Repository-backed | Account-owned user data | Yes, with explicit consent | User-authored personal records |
| Knowledge items | Repository-backed | Account-owned user data | Yes, with explicit consent | Includes personal knowledge content only after opt-in |
| Personal Manual entries | Repository-backed | Account-owned user data | Yes, with explicit consent | Knowledge-work content remains user-owned |
| Decision Log entries | Repository-backed | Account-owned user data | Yes, with explicit consent | Includes context and outcome notes as user-owned records |
| Finance transactions | Repository-backed | Account-owned user data | Yes, with explicit consent | Financial records are sensitive and require especially explicit scope disclosure |
| Finance obligations | Repository-backed | Account-owned user data | Yes, with explicit consent | Same sensitivity expectations as other finance records |
| Repository-owned settings records | Repository-backed | Narrow account-owned settings data | Potentially, with explicit consent | Future implementation must narrow field scope explicitly before syncing |
| Language preference | localStorage preference | Account-owned preference | Yes, with explicit consent | User-owned preference |
| Theme / appearance | localStorage preference | Account-owned preference | Yes, with explicit consent | User-owned preference |
| Accent color | localStorage preference | Account-owned preference | Yes, with explicit consent | User-owned preference |
| Display name preference | localStorage preference | Account-owned preference | Yes, with explicit consent | Profile-like preference |
| View density | localStorage preference | Account-owned preference | Yes, with explicit consent | User-owned preference |
| Calendar display preference | localStorage preference | Account-owned preference | Yes, with explicit consent | User-owned preference |
| Dashboard layout | localStorage preference | Account-owned preference | Yes, with explicit consent | User intent, not technical metadata |
| Collapsed section layout preferences | localStorage preference | Account-owned preference | Yes, with explicit consent | Still user intent if explicitly supported later |
| Weekly task budget | localStorage preference | Account-owned preference | Yes, with explicit consent | User planning preference |
| Routine nudge preference | localStorage preference | Account-owned preference | Yes, with explicit consent | Persistent user-owned preference |
| Recovery mode | localStorage / runtime support state | Device-local technical state | No | Must remain on-device |
| Local error log | localStorage / runtime support state | Device-local technical state | No | Diagnostic data stays local |
| Local AI endpoint setting | localStorage preference | Device-local technical state | No | Environment-specific local integration setting |
| Temporary helper-card state | localStorage / runtime support state | Device-local temporary state | No | Not durable cross-device intent |
| Dismissed-for-today state | localStorage / runtime support state | Device-local temporary state | No | Ephemeral local runtime state |
| Backup status metadata | localStorage metadata | Intentionally unsynced operational metadata | No | Supports local trust workflow, not account intent |
| Legacy backup reminder timestamps | localStorage metadata | Intentionally unsynced operational metadata | No | Compatibility and operational metadata only |
| Future auth session tokens | Future provider runtime only | Sensitive session data | No, not part of sync payload | Must stay outside preferences and backups |
| Future auth refresh/session metadata | Future provider runtime only | Sensitive session data | No, not part of sync payload | Must stay separate from app data |

## 5. Local-Only Data Categories

The following data classes must remain local-first even if optional account features exist.

### 5.1 Default runtime data before opt-in

Before a user explicitly signs in, associates local records, and enables sync:

- all repository-backed records remain local-only in runtime behavior
- all preferences continue to behave locally

### 5.2 Device-local technical state

These remain device-scoped and must not become part of future sync:

- recovery mode
- local error log
- local AI endpoint configuration
- temporary helper-card state
- dismissed-for-today state

### 5.3 Operational metadata

These remain local operational data, not user cloud intent:

- backup status metadata
- backup reminder compatibility timestamps

## 6. Future Sync-Eligible Data Categories

These categories may become eligible for future sync only after:

1. account authentication
2. local record association when needed
3. explicit sync consent

### 6.1 Account-owned records

Future sync-eligible records include:

- tasks
- daily check-ins
- projects
- goals
- life areas
- weekly plans
- routines
- inbox items
- journal entries
- knowledge items
- personal manual entries
- decision log entries
- finance transactions
- finance obligations

### 6.2 Account-owned preferences

Future sync-eligible preferences include:

- language
- theme / appearance
- accent color
- display name
- view density
- calendar display
- dashboard layout
- collapsed-section layout preferences when explicitly supported
- weekly task budget
- persistent routine-nudge preference

## 7. Sensitive Data Boundaries

Some future sync-eligible data deserves stronger disclosure due to its content or risk.

### 7.1 Financial records

Finance transactions and obligations are sensitive user records.

Future sync implementation must:

- mention finance explicitly in sync scope disclosure
- never include finance silently under vague `your data` wording

### 7.2 Reflective or personal narrative records

The following can contain intimate personal content:

- journal entries
- daily check-ins
- personal manual entries
- decision notes
- knowledge items

Future sync implementation must:

- treat them as user-owned content
- disclose that personal written content may sync if included in the approved scope

### 7.3 Session and credential boundaries

Auth credentials, tokens, refresh state, or provider session data are not syncable user content.

They must:

- stay outside app data ownership categories
- stay outside backups
- stay outside user-facing sync scope promises

## 8. Local-First Rules

The following rules govern every future account or sync implementation:

1. local storage remains the source of truth before sync opt-in
2. no account is required for normal use
3. local records remain available after sign-out
4. local records remain available during paused, offline, or conflict states
5. future sync must layer on top of local-first behavior rather than replace it

## 9. Sync Consent Requirements

Before any future remote upload begins, AliOS must disclose:

- what record categories may sync
- what preference categories may sync
- what remains device-local
- that local copy remains available
- that backup/export remains separate and still matters

Consent must be:

- explicit
- user-confirmed
- specific enough to include sensitive categories such as finance and personal written content

## 10. Conflict Ownership Rules

When local and remote data compete:

1. AliOS must stop before merging automatically.
2. Ownership ambiguity must be treated as a review problem, not an implementation convenience.
3. No silent winner may be chosen.
4. No destructive overwrite may happen by default.
5. Local records remain visible and available while conflict review is pending.

Future conflict handling may use:

- manual review
- explicitly approved resolution actions

It must not use:

- silent merge
- silent overwrite
- deletion as the default

## 11. Export / Import Relationship

Export and import remain user-controlled data portability tools.

They are not:

- automatic sync
- account association
- conflict resolution

Future account work must preserve this meaning:

- export is an intentional user output
- import is an intentional user recovery or transfer action
- neither action should silently rewrite account ownership assumptions

## 12. Backup vs Sync Distinction

AliOS must keep backup and sync as separate product promises.

### Backup

Backup means:

- user-controlled recovery
- explicit portability
- local-first safety

### Sync

Sync means:

- optional convenience after explicit setup
- account-scoped availability across devices
- never a replacement for backup

Future product wording must never imply:

- backup is no longer needed once sync exists
- sync is automatic protection without user approval

## 13. Future Implementation Boundaries

Any later implementation stage must stay inside these boundaries:

### Allowed only with explicit future approval

- auth provider activation
- remote sync provider activation
- sync metadata storage
- field-level narrowing of repository-owned settings data
- conflict-resolution UX

### Still prohibited by this stage

- hidden upload
- hidden merge
- hidden deletion
- widening the sync scope without updating the ownership contract
- treating device-local technical data as account data
- putting tokens or session state into backups or preferences

## 14. Recommended Next Stage

Recommended next stage: Stage 222 - Account & Sync Sensitive Scope Disclosure Specification

That stage should remain planning-only and define:

- exactly how sensitive categories are disclosed in consent UI
- how finance and personal written content are named in future sync warnings
- how device-local exclusions are shown without ambiguity
