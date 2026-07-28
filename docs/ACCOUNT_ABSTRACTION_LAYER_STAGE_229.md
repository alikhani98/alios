# AliOS Account Abstraction Layer Preparation - Stage 229

Date: 2026-07-28

Status: `STAGE_229_ACCOUNT_ABSTRACTION_LAYER_PREPARATION_COMPLETE`

## 1. Stage Summary

Stage 229 prepares a future-safe account boundary for AliOS while preserving the current local-first product behavior.

This stage does not implement authentication, Supabase, remote sync, API calls, user accounts, cloud storage, database schema changes, repository migrations, or runtime account UI.

This stage adds only:

- contract documentation
- a minimal account abstraction contract in code
- no runtime provider activation

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `f26b84bd6b825367cbb95e6dd96c0890ba363505`
- Branch: `codex/stage-229-account-abstraction-layer-preparation`

## 3. Current State

AliOS currently remains:

- local-first
- fully usable with no account
- repository-owned for application data
- preference-local unless a future stage explicitly reclassifies a preference category
- protected by local backup and export safety tools

Current architecture facts:

- feature repositories remain the owners of application data access
- current `src/core/auth` defines a provider seam and runtime container for future identity work
- `src/core/sync` defines future sync ownership and consent boundaries
- Backup / Restore and Export remain local safety mechanisms, not cloud features

This stage does not change any of those facts.

## 4. Future Account Abstraction

Stage 229 introduces a narrow conceptual account layer in `src/core/account`.

### 4.1 AccountIdentity

`AccountIdentity` represents future user identity metadata only.

It does not represent:

- application records
- feature ownership transfer
- repository state
- runtime UI state

### 4.2 AccountStatus

`AccountStatus` describes high-level account state:

- `local-only`
- `signed-out`
- `authenticating`
- `authenticated`
- `expired`
- `provider-unavailable`
- `error`

This separates account state from future sync state and preserves the rule that authentication and sync are not the same lifecycle.

### 4.3 AccountProvider boundary

`AccountProvider` defines the future provider contract for:

- `authenticate()`
- `restoreIdentity()`
- `refreshSession()`
- `signOut()`
- identity/session queries
- capability exposure
- state subscription

It is intentionally contract-only and does not activate any runtime account flow.

### 4.4 Session boundary

`AccountSessionBoundary` defines:

- current account status
- optional identity
- provider id
- optional expiration time
- optional detail

It remains separate from:

- feature repositories
- sync engine behavior
- record ownership mutation

### 4.5 Account capability model

`AccountCapabilitySet` exists so future runtime code can ask what account actions are available without inferring behavior from provider identity alone.

Current local-only default:

- status: `local-only`
- available capabilities: none

This preserves the rule that AliOS does not accidentally grow an account UI or behavior just because an abstraction exists.

## 5. Ownership Rules

### 5.1 Local data ownership

Current local data ownership remains unchanged:

- repositories own application record access
- records remain local unless a future explicit sync stage is approved
- backups and exports remain the trusted recovery/portability tools

### 5.2 Future cloud ownership

Future account or sync work must not assume:

- account identity automatically means remote data ownership
- sign-in automatically claims local records
- provider identity automatically overrides repository ownership

### 5.3 Explicit transfer points

Any future ownership shift must happen only at explicit transfer points:

- sign-in completion alone is not a transfer point
- sync opt-in alone is not enough if local record association is unresolved
- any future claim or association step must remain explicit and reviewable

### 5.4 Migration expectations

If future account work touches existing local records:

- no deletion-first migration
- no silent merge
- no silent overwrite
- no weakening of backup/export trust

## 6. Provider Boundary

### 6.1 Future provider responsibilities

The future provider boundary is responsible for:

- authenticate
- restore identity
- refresh session
- sign out
- expose account capability state
- surface provider-specific session failure at the boundary

### 6.2 What the provider must not own

The provider must not own:

- application data model
- feature logic
- repositories
- UI state
- backup/export flows
- migration decisions for local records

That boundary is the main point of this stage.

## 7. Dependency Direction

The required dependency direction remains:

UI
↓
Account abstraction
↓
Future provider

Feature repositories remain independent.

More specifically:

- feature code may read future account state through an approved abstraction only when a future stage explicitly allows it
- repositories must not depend on account-provider implementations
- storage ownership rules must not move into provider code

## 8. Minimal Code Abstraction Added

Added files:

- `src/core/account/types.ts`
- `src/core/account/index.ts`
- `src/core/account/__tests__/types.test.ts`

These files:

- define future account concepts
- preserve local-only defaults
- introduce no runtime behavior
- create no fake session in the live application
- do not replace the existing auth runtime seam

The current `src/core/auth` module remains the active runtime boundary. The new `src/core/account` module is a higher-level contract layer for future implementation planning.

## 9. Testing Readiness

Future implementation stages should cover at least:

- no account mode
- signed out
- authenticated
- expired session
- provider unavailable

And later, once runtime work is approved:

- account sign-in does not imply sync
- local-only remains usable when provider fails
- local records are not silently claimed
- backup/export trust remains intact through account transitions

## 10. Files Added and Modified

Added:

- `docs/ACCOUNT_ABSTRACTION_LAYER_STAGE_229.md`
- `src/core/account/types.ts`
- `src/core/account/index.ts`
- `src/core/account/__tests__/types.test.ts`

Modified:

- `PROJECT_STATE.md`
- `CHANGELOG.md`

## 11. Implementation Boundaries Preserved

Stage 229 changes no current product behavior.

It does not:

- enable authentication
- add Supabase
- add remote sync
- add API calls
- add account UI
- change repository ownership
- change storage ownership
- change schema
- change migration behavior

It only prepares a minimal future account abstraction boundary.

## 12. Recommended Next Stage

Recommended next stage: Stage 230 should define the Account & Sync sensitive-scope disclosure specification so the future account boundary, consent flow, and implementation prep chain have an exact category-level statement of what may sync, what remains device-local, and what requires explicit user review before any upload or merge behavior is allowed.
