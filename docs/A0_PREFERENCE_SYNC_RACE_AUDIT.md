# A0 — Preference Sync Destructive Race Audit

Branch: codex/a0-preference-sync-race. Baseline: 800ad5a7d6826285c8f437be49252614ea7f5b08.
Date: 2026-10-26. Local implementation and automated audit only; owner manual QA
and approval remain pending. No commit, push, deployment, hosted DB operation,
real Supabase request or external notification was performed.

## Confirmed findings and reproduction

The original implementation failed all four initial deterministic regressions in
preferenceSyncRace.test.ts using a real Dexie adapter over fake-indexeddb and a
manually released remote-read promise. No timers, real credentials or providers
were used. The failures were observed before production code was modified:

1. Start sync, capture backup.readAll(), and suspend records.list(). Create a
   Setting and a Task locally, then release one remote Task. The Setting became
   undefined and the new Task disappeared because the old backup replaced the DB.
2. While the same read is pending, edit an existing Task and delete another.
   Continuing sync overwrote the edit with the old title; the old full snapshot
   also had enough information to restore the deleted record. The final test
   includes the deleted Task in the remote result to exercise resurrection safety.
3. Change account A to B while the remote read is pending. A's result still
   hydrated into the local DB, and the old operation continued to outbound writes.
4. Log out while that read is pending. The operation likewise continued and
   applied A's stale result after logout.

At baseline, SupabasePreferenceSyncProvider.ts had exactly two replaceAll calls:
line 1464 in resolveConflict(), after an awaited remote write, and line 1947 in
runSync(), after awaited source reads/outbox processing. Both passed a whole
AliosBackupData captured earlier. DexieBackupStorage.replaceAll() at line 109
clears almost every application table inside a transaction and bulk-writes that
snapshot. Its atomicity prevents half a restore, but does not make the snapshot
fresh. preserveMutationOutbox protects the queue only; it does not protect
settings or unrelated/new domain records.

The provider's name is misleading here: appearance/language/UI preferences live
in localStorage, whereas this destructive path replaces IndexedDB user data,
including legacy Setting records and non-synced collections. A delayed sync also
reused its initial merged localStorage preference snapshot for updateUser(); a
user edit during the wait could therefore leave the remote preference stale.
Existing local preference values win normal merging and are not deleted merely
because remote preference keys are absent. Reentrant preference event handlers
were another gap: a write made while a different key was hydrated could be
replaced using the original snapshot of the second key.

## Lifecycle and ownership boundaries

- UI preferences initialize locally through readStoredPreference and their
  feature parsers (for example I18nProvider and appearance hooks). User changes
  go through writeStoredPreference/removeStoredPreference and local events.
- AppProviders initializes local storage first. LazySupabaseSyncProvider passes
  the existing backup adapter and mutation outbox into the sync provider.
  Construction remains inert. Background activation and explicit operations
  share one auth watcher. Explicit operations retain it until their finally
  cleanup even if activate() was never called.
- Sync opt-in is device-local. syncNow() reuses an existing in-flight operation.
  Existing Supabase sessions are reused; the approved Google token exchange
  remains available when needed. No forced login or cloud dependency was added.
- Preferences come from auth user_metadata.alios_preferences and are limited to
  the existing eight permitted keys. Local values win; missing local keys can
  hydrate from remote. Missing remote keys are not deletions.
- Domain records are separately read from user-scoped alios_sync_records and
  merged by the existing application rules. Missing rows are not deletion
  instructions. Explicit tombstones still use the existing dirty/conflict rules.
- Auth transitions and logout invalidate old work. Operation-scoped generation
  fencing covers transitions before transaction entry and during IndexedDB awaits; current auth/runtime
  identities and backend owner are rechecked before writes and after responses.
  Logout still disables the opt-in and disconnects the remote session without
  clearing the local data copy.
- Local data remains device-owned under the existing shared local DB model.
  This stage adds no per-account local database namespace or migration. It
  prevents stale account A operations from continuing under account B; it does
  not redesign the product's existing record-association policy.
- The remaining production replaceAll caller is BackupService.restoreBackup()
  at line 48: an explicit, validated Restore action. That intentionally replacing
  workflow and its attachment/outbox options remain unchanged.

## Minimal architecture decision

Keep reconciliation/business rules in SupabasePreferenceSyncProvider. Add one
bounded operation, BackupStorage.applySyncChanges(before, after, isCurrent), to
the existing storage contract. Dexie remains confined to the adapter.

The adapter applies only differences in the existing eight synced collections.
It never clears a table, modifies settings/non-sync collections, attachments or
the mutation outbox. For every changed ID it compares the current stored record
with the original baseline in the same read/write transaction as the write.
Concurrent creation of a different ID is retained. A changed/deleted target or
cancellation fails closed and rolls back the entire patch, including earlier
entity writes; no timestamp-only comparison or last-write-wins guess is used.
The caller can retry from a fresh local snapshot. Keeping the baseline also
prevents a local deletion during hydration from being mistaken for a new remote
record to import.

Both former Sync replaceAll calls now use this operation. Session checks fence
source hydration, conflict resolution, outbox dispatch, uploads and metadata
completion. Preference metadata is re-sampled immediately before upload;
hydration checks the current key before filling it. Changes arriving during an
active upload are coalesced into a follow-up sync, while internal hydration events
remain suppressed to avoid recursion. Existing merge/conflict precedence stays
unchanged. No new dependency, IndexedDB version, historical migration or hosted
schema change is needed.

## Final gate: additional confirmed defects

The independent final gate reproduced three further failure modes before changing code:

1. Two tests suspended applySyncChanges after the final async ownership check
   but before transaction entry, without activate(). Account B or logout still
   allowed A's result to be written: the generation predicate depended on a
   background subscription that did not exist. Explicit normal sync, conflict
   resolution and conflict listing now retain the existing shared auth watcher
   until completion. No construction side effect or extra simultaneous watcher
   is introduced. Tests cover both gaps, conflict-resolution equivalents,
   A-to-B-to-A transitions, deactivation, one shared subscription and cleanup.
2. A real IndexedDB outbox test paused after claim(), changed session and resumed
   dispatch authorization. Cancellation was treated as a permanent domain
   conflict, leaving the entry blocked-conflict. SyncSessionChangedError now
   derives from an explicit MutationOutboxRetryableError, which the processor
   places in retry-wait using existing backoff. The test confirms no cancelled
   upload and successful acknowledgement of the same entry after reconnect.
   Actual domain-conflict classification is unchanged.
3. Two additional metadata tests failed: a delayed initial session result could
   overwrite the next account's sync status, and conflict completion could be
   published after an account transition following the local commit. Initial
   status/diagnostic publication now follows scope authorization inside the
   guarded try block. Conflict resolution rechecks its original scope after
   commit, after refreshing remaining conflicts, and after awaiting final status.
   The newer account's metadata is retained; old completion is refused.

The CAS adapter needed no further production correction. Additional storage
checks inject a write failure and explicit transaction abort after an earlier
entity write, verify complete rollback, and then succeed using a fresh baseline.
No poison flag permanently starves sync after a CAS rejection; continued writes
can still defer conflicting patches until a stable retry. Untouched IDs do not
block unrelated changes.

## Regression coverage

- preferenceSyncRace.test.ts: delayed domain/session hydration, concurrent local
  Setting/Task/preference writes, edit/delete protection, inactive and active
  account switching/logout, network failure and reconnect/retry, incomplete
  remote snapshots, idempotent repeated sync, changes during metadata upload,
  reentrant local preference writes and stale conflict resolution.
- syncChanges.test.ts: two IndexedDB connections, preserving newly added IDs and
  settings, rollback of earlier entity writes when a later target is stale,
  concurrent deletion/edit safety, cancellation during a write, confirmed
  deletion, retained mutation outbox and refusal of a stale replay.
- Existing provider/tombstone/outbox/backup tests verify previous behavior and
  explicit Restore still uses its own replacing operation. Stub adapters gained
  the new contract member; the provider-event tests await completion gates instead of assuming a fixed
  number of microtasks is enough for the extra session checks.

## Validation evidence

- Original implementation: all 4 initial destructive reproductions failed
  before the first fix.
- Final gate before corrections: 2 ownership-check/transaction-gap tests failed;
  1 cancelled-outbox test failed with blocked-conflict instead of retry-wait;
  2 metadata/completion tests failed after account transitions.
- Final related run: 80 tests in 11 files passed, including 31 dedicated cases
  in preferenceSyncRace.test.ts and syncChanges.test.ts.
- Final complete Vitest: 2,043 tests in 213 files passed, exit 0. Started at
  17:24:41 as reported by Vitest; duration 322.36 seconds. This run followed all
  production corrections and every final test addition. No tests were added
  after it. It includes the 31 dedicated regressions and all A1/A2/A3 tests.
- Final TypeScript: exit 0, using the installed TypeScript CLI with --noEmit.
- Final production Vite build: exit 0; precache generation: exit 0, five critical
  chunks. Unchanged React/Vite/Tailwind warnings are not validation failures.
- Final git diff --check: exit 0. The 11 modified/untracked paths match the A0
  manifest exactly, the index is empty, and newly added files were also checked
  for trailing whitespace. No configuration/cache/migration/dependency file is
  proposed for staging.
- Earlier 2,027-test and 2,041-test/213-file runs preceded the last additions
  or production corrections; neither is the final gate's complete-suite result.

The worktree reuses already-installed packages through an ignored node_modules
junction. No dependencies or lockfiles were changed. The pnpm wrapper attempted
an automatic dependency refresh and aborted before running tests, so the actual
checks used the installed Node CLIs directly, as a normal user:

~~~powershell
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run src/core/sync src/core/backup/__tests__/BackupService.test.ts src/db/dexie/repositories/__tests__/syncChanges.test.ts src/app/__tests__/syncOutboxInjection.test.tsx
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node scripts/generate-precache-manifest.mjs
git diff --check
~~~

## Manual checks and remaining risks

Use only a disposable local database and mocked Supabase client. Pause a remote
read, edit Settings appearance and a Task, add a Setting/Task, then release the
read. New records/settings must remain. A changed target can produce a retryable
user action (sync error); retry Sync Now and verify the latest local content.
Repeat with a local deletion, network failure/reconnect and account switch/logout.
Pause conflict resolution's remote write and edit that record locally before
releasing it: local content must survive and the stale patch must be refused.
Explicit Backup Restore should still perform its documented replacing action.

This is local race protection, not a distributed transaction. A provider request
already dispatched under a valid account cannot be recalled. A remote conflict
resolution may have reached the remote copy before a concurrent local edit makes
its local CAS fail; the local edit is retained and another sync/conflict review
may be needed. The existing remote read pagination and cross-device metadata
last-write behavior are not redesigned here. UI preferences remain shared
device-local settings with the existing local-first precedence. A0 does not
claim atomicity across localStorage, IndexedDB and Supabase, or live multi-device
QA. Manual owner validation and approval are still required before commit.

## Remote consequences and final boundary

| Case | Result |
| --- | --- |
| Remote conflict-resolution write accepted, local CAS rejected | Newer local data survives; remote may hold the earlier choice. Fresh sync/conflict review must reconcile them. |
| Local edit during upload | The response does not replace local domain data. Active events request a follow-up, or an explicit fresh retry reconciles it. Tests preserve the edit and upload its latest value on retry. |
| Response after account switch/logout | The operation watcher invalidates the scope; DB entry/end predicates and later ownership checks fence local writes and completion. Already-dispatched remote requests cannot be recalled. |
| Retry of an accepted request | Existing upsert identity is (user_id, entity, record_id); retry does not create duplicate local records. Existing tombstone/outbox semantics remain. This is not remote conditional CAS against another device. |
| Failed remote record read | No domain patch/upload; local data stays usable and reconnect/retry is tested. |
| Incomplete successful remote read | Missing rows do not delete local records. But the existing listing contract does not prove completeness: an omitted newer remote row could be overwritten by a local upload. Remote pagination/completeness and cross-device conditional writes remain separate risks. |

Session fencing relies on identity transitions emitted by AuthSessionSource.
The adapter serializes local record comparisons/writes, not auth storage or
remote services. Operations already committed under a previously valid scope
are not undone. There is no new per-account local DB partition or distributed
rollback. These limits are documented, not claimed solved by local CAS.

## Final gate assessment

Atomic CAS, session/account fencing, remote-consequence analysis, compatibility,
final automated validation and Git hygiene: PASS within the A0 local scope.
There is no remaining reproduced A0 commit blocker. This is technical readiness
for a local commit review, not an owner QA/commit authorization or hosted release.
The project workflow still requires owner manual QA and explicit approval before
any commit. No commit, staging, push, merge, deployment or hosted action occurred.
The remote completeness/cross-device risks above remain explicitly out of scope.

## Exact file inventory

Added:
- docs/A0_PREFERENCE_SYNC_RACE_AUDIT.md
- src/core/sync/__tests__/preferenceSyncRace.test.ts
- src/db/dexie/repositories/__tests__/syncChanges.test.ts

Modified:
- src/core/backup/BackupStorage.ts
- src/core/backup/__tests__/BackupService.test.ts
- src/core/sync/SupabasePreferenceSyncProvider.ts
- src/core/sync/mutationOutbox.ts
- src/core/sync/mutationOutboxProcessor.ts
- src/core/sync/__tests__/SupabaseMutationOutboxTombstone.test.ts
- src/core/sync/__tests__/SupabasePreferenceSyncProvider.test.ts
- src/db/dexie/DexieBackupStorage.ts

Removed: none. PROJECT_STATE, CHANGELOG and global architecture/ADR documents
are unchanged; no completed-stage claim is made before owner validation.

Suggested commit after validation and explicit authorization:
fix(sync): prevent stale snapshots from replacing newer local data
