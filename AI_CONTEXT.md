# AliOS AI Context

## Purpose

AliOS is a bilingual personal life-management application that remains local-first while allowing explicitly approved optional account and sync capabilities. The repository is the source of truth for product behavior and architecture.

## Current Product Reality

- Latest valid stage: Stage 254 - Essential User Data Sync Completion
- Current merged main base for new work: `a4090773c574df37471f9dd2c413aa90213b79d8`
- Local-first remains the primary operating model
- Using AliOS without an account must remain possible
- Account and sync are optional additive capabilities
- Sync activates only after explicit user consent
- Local data remains the first readable and writable copy
- Backup, export, import, and restore remain valid safety paths

## Current Architecture

- Frontend: Vite + React + TypeScript
- Styling: Tailwind CSS + shared AliOS UI primitives
- Local persistence: IndexedDB through Dexie
- Data boundaries: feature layer -> repository layer -> storage adapter layer
- Optional account/auth/sync boundaries remain adapters around the existing local-first core

## Account and Sync Model

- Supabase-backed auth and sync are approved additive capabilities
- Email authentication is implemented
- Google authentication also exists in the codebase as an optional provider path
- Repositories remain the source of truth for application data access
- Auth providers must not take ownership of feature data or repository logic

## Sync Scope Implemented Through Stage 254

The implemented sync scope now covers:

- Preferences
- Tasks
- Routines
- Projects
- Goals
- Finance records
- Personal Manual records

This scope is implemented through the current Supabase-backed sync provider with explicit opt-in and local-first safety rules.

## Validation Reality

- Automated validation evidence exists for the current implementation path
- Real-world multi-device verification is still a separate concern and must not be assumed from automated checks
- Stage 254 did not prove real laptop/mobile sync end to end

Always report these separately:

```text
Implementation status:
Automated validation status:
Real-world validation status:
```

And always preserve this rule:

```text
Automated validation passed != Real-world validation passed
```

## Merged vs Not Fully Proven

Merged and implemented:

- Stage 251A through Stage 254 are merged into `origin/main`
- Email account authentication is implemented
- Optional sync activation is implemented
- Current synced categories are implemented

Not yet proven by repository evidence alone:

- Full real-world laptop/mobile verification for the complete current sync scope
- Broad browser/device QA for every authenticated and synced state

## Canonical Reference Order

Use these sources in this order when resuming work:

1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `README.md`
6. `docs/ROADMAP.md`
7. Stage-specific docs relevant to the active stage

If a document conflicts with implementation evidence, do not guess. Record the conflict and resolve it only in an approved stage.

## Local-First Approval Chain

```text
Local implementation
-> Local automated validation
-> Local/real-world QA
-> User approval
-> Commit
-> User approval
-> Push / PR
-> Separate approval for Merge
```

## Recommended Next Stage

Recommended next stage after Stage 255:

- Stage 256 - Real Multi-Device Sync Verification and Documentation Closure

This is a recommendation only. It is not already implemented.
