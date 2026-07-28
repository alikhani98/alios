# AliOS Account & Sync Error Handling Contract - Stage 223

Date: 2026-07-28

Status: `STAGE_223_ACCOUNT_SYNC_ERROR_HANDLING_COMPLETE`

## 1. Stage Summary

Stage 223 defines the future error-handling contract for optional Account & Sync features in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, API calls, database changes, schema changes, repository changes, storage migrations, or runtime UI changes.

This stage builds directly on:

- Stage 214C - Session Lifecycle Contract
- Stage 215 - Account & Sync Experience Planning
- Stage 218 - Account & Sync State Flow Mapping
- Stage 219 - Account & Sync Settings Screen-State Specification
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 221 - Account & Sync Data Ownership Model
- Stage 222 - Account & Sync Security Boundary Contract

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- non-destructive toward current local data

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `4aa25dc8348b6712f759e9ff981f08d13cc5af41`
- Branch: `codex/stage-223-account-sync-error-handling`

## 3. Error-Handling Principles

Every future Account & Sync failure path must preserve these rules:

1. sync failures must not block normal local usage
2. local records remain available during failures
3. no silent deletion may happen during error handling
4. no silent overwrite may happen during retries or recovery
5. the user should understand what happened in plain language
6. failure states should pause and explain, not guess or automate irreversible decisions

## 4. Sync Error State Model

Future Account & Sync behavior should distinguish these error states instead of collapsing them into one generic failure.

### 4.1 Sync paused

Meaning:

- sync cannot proceed safely
- the user or environment must resolve something before continuation

### 4.2 Offline

Meaning:

- connectivity is unavailable or unstable
- local usage continues
- remote sync work waits

### 4.3 Session expired

Meaning:

- future account session is no longer valid for remote actions
- local data remains available

### 4.4 Permission failure

Meaning:

- future provider or account policy does not permit the requested remote action
- local state must remain preserved

### 4.5 Conflict detected

Meaning:

- overlapping or competing data requires explicit user review
- sync must stop before making ownership decisions

### 4.6 Unexpected sync error

Meaning:

- sync encountered an unclassified failure
- product must fail safely into a paused or attention state

## 5. Network Failure Behavior

Network failures must be treated as availability problems, not as data-loss problems.

### Required behavior

- local feature usage continues
- pending remote work does not silently disappear
- Settings may show `Offline` or `Sync paused` depending on context
- the user may retry later

### Forbidden behavior

- deleting local records because a remote request failed
- blocking ordinary local reads and writes
- claiming sync completed when it did not

## 6. Authentication and Session Failure States

Future session failure states must remain separate from user-owned data state.

### 6.1 Expired session

If a future session expires:

- remote account actions stop
- local data remains available
- sync may transition to paused
- re-authentication becomes an explicit next action

### 6.2 Sign-in interrupted

If future sign-in or account creation is interrupted:

- return to local-only or signed-out state
- do not partially activate sync
- do not partially claim local records

### 6.3 Refresh failure

If a future session refresh fails:

- transition into a visible expired or paused state
- do not silently continue with invalid account state

## 7. Permission Failure Handling

Permission failures must be explained as account or provider limitations, not as local data failures.

### Required behavior

- keep local records untouched
- show a clear next step where possible
- distinguish permission failure from offline failure

### Example cases

- account lacks access to a remote resource
- provider temporarily rejects an operation
- future policy blocks device association or sync continuation

### Forbidden behavior

- deleting local data because remote permission was denied
- pretending the failure was only a network issue if it was not

## 8. Conflict Detected Experience

Conflicts are not ordinary sync errors; they are ownership-review states.

### Required behavior

- pause sync
- surface a visible attention state
- explain that AliOS stopped before merging automatically
- provide a clear review action

### Forbidden behavior

- silent merge
- silent overwrite
- implicit local-or-remote winner selection

### User understanding requirement

The user should understand:

- what kind of problem happened
- that data was not silently rewritten
- that review is required before sync can continue

## 9. Retry Behavior

Retry actions must be safe and non-destructive.

### Allowed retry behavior

- retry a failed remote action
- retry session re-entry
- retry conflict-detail loading
- retry connectivity-dependent sync steps

### Required retry safeguards

- retry must not imply success before completion
- retry must not delete local records
- retry must not silently overwrite existing data

### Retry result states

After retry, the product should move to one of:

- sync enabled
- sync paused
- offline
- signed-in sync-off
- conflict detected

Never to an ambiguous hidden state.

## 10. Offline Continuation Rules

Offline behavior must preserve ordinary local-first use.

### Required behavior

- local pages continue to work
- local record edits continue to behave as local actions
- Account & Sync surfaces explain that remote work is waiting

### Forbidden behavior

- blocking local use because sync is unavailable
- masking offline as successful sync
- treating temporary disconnection as account loss

## 11. Recovery Paths

Every future Account & Sync failure path must leave the user with a safe next step.

### Recovery options may include

- retry later
- sign in again
- review conflict
- disable sync
- sign out
- continue locally

### Recovery priority

1. preserve the local working copy
2. explain current state clearly
3. offer a safe next action
4. avoid irreversible automation

## 12. User-Facing Error Copy Principles

Future account/sync error copy should follow these rules:

1. say what failed in plain language
2. say what did not happen silently
3. say whether local data is still available
4. say what the user can do next

### Preferred message qualities

- calm
- specific
- non-alarmist
- local-first reassuring

### Avoid

- vague `something went wrong` copy with no next step
- implying local data loss when none occurred
- using technical provider language without explanation

## 13. Error Logging Boundaries

Future account/sync errors may be logged only within the existing local-first support model unless a later approved stage says otherwise.

### Allowed boundary

- bounded local diagnostics
- local support context
- user-visible troubleshooting context where appropriate

### Forbidden boundary

- hidden telemetry
- silent remote error reporting
- storing sensitive provider tokens in local error logs

## 14. Privacy Constraints

Future account/sync error handling must preserve privacy boundaries.

### Required constraints

- no sensitive credentials in user-facing error copy
- no tokens in logs, backups, or exports
- no silent transmission of local diagnostics
- no widening of sync scope during error recovery

### Sensitive content rule

If error handling references content classes like finance, journal, or personal notes, it must do so carefully and only as needed for user understanding.

## 15. Recommended Next Stage

Recommended next stage: Stage 224 - Account & Sync Sensitive Scope Disclosure Specification

That stage should remain planning-only and define:

- exact future disclosure language for sensitive synced categories
- how consent UI distinguishes account-owned data from device-local exclusions
- how warning and error copy should describe sensitive scope without ambiguity
