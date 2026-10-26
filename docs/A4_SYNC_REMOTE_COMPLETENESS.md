# A4 — Remote Sync Read Completeness and Upload Safety

Status: local implementation prepared; owner validation and manual QA pending.
Baseline: cb0b45cc90defd22fea839388013548775dcdd65 (origin/main fetched for this task;
merge PR #251 includes A0 commit 5104e7633ced46e46fd5d9b221ac951f9636a850).
Worktree: C:/dev/alios-a4-sync-completeness.
Branch: codex/a4-sync-completeness.

The intended path and branch did not exist before setup. A separate worktree was
created from the verified fetched baseline. Existing A0/A3 worktrees were not
modified, reset, cleaned or switched. No staging, commit, push, merge, deployment,
hosted DB access or notification was performed. No dependencies were installed.

## Validation ownership

No tests, TypeScript checks, builds, precache generation, git diff --check or
manual/real-world QA were run by the agent for A4. Source inspection and writing
mock fixtures are not execution evidence. The cases below are candidate
regression/compatibility coverage until the owner executes them. In particular,
red/green failure evidence against the original behavior is NOT claimed; the
owner commands below are provided to establish it without changing A0 or A3.
Historical A0 reports and their previously recorded results are unchanged.
PROJECT_STATE.md and CHANGELOG.md are unchanged; A4 is not declared complete.

## Confirmed original behavior from source inspection

At the baseline, supabaseClient.ts:903-960 performs a single records.list GET:

- It filters user_id and an entity IN list but specifies no order, limit, offset,
  exact count or loop. There is no hidden pagination layer or Supabase SDK here:
  this adapter calls fetch against the PostgREST endpoint directly.
- It casts the response body to SupabaseRecordRow[] without verifying it. Any
  successful non-array response is converted to data: [], error: null.
- An array is returned as success without inspecting Content-Range. Thus a
  server-capped successful response is treated as the entire remote collection.
- HTTP/JSON/network failure of that one request returns error, but there is no
  opportunity to notice an error on an unfetched later page.

Supabase documents a default project cap of 1,000 rows, configurable by the
project owner. The actual hosted setting was not inspected and is not assumed
here. PostgREST may return fewer rows than requested; short pages alone do not
prove completion. These are Data API constraints, not a dependency on the JS SDK:

- https://supabase.com/docs/reference/javascript/v1/select
- https://docs.postgrest.org/en/stable/references/api/pagination_count.html

The baseline provider uses this same list contract at two boundaries:

- Normal runSync(): source lines 1953-1963; it checks error before running the
  mutation outbox, merging records, applying local CAS and issuing uploads.
- loadConflictContext(): source lines 1636-1646; both listConflicts() and
  resolveConflict() obtain their remote versions through this shared path.

mergeEntityRecords(), baseline lines 1070-1083, uploads a local record if the
remote map contains no live matching record. A newer remote record omitted by a
row cap is therefore indistinguishable from an absent remote record. The old
local value can be upserted over it. The existing upsert request uses
on_conflict=user_id,entity,record_id and merge-duplicates, not conditional version
matching. A0's local CAS does not protect that remote write.

Concrete deterministic fixture: the API caps pages at two rows and returns a,b
on page one and a newer z on page two. Local z is older and clean. The old
adapter returns only a,b; normal Sync can upload the old local z. The candidate
regression expects the newer z to be read and selected, with no old-z upload.
This failure path is established by inspection; the fixture has not been run.

The baseline provider also hydrates localStorage preferences before awaiting the
record read. A4 defers that user-data mutation until the complete read succeeds.
Attempt/status diagnostics may still be recorded while reading; these are not
remote hydration or domain-record reconciliation.

## Minimum compatible implementation

records.list retains the existing public input/result interface. All pagination
and response checks remain in supabaseClient.ts, the existing Supabase adapter.
No query details are added to domain or feature code.

1. Use limit=500 and offset paging with order=entity.asc,record_id.asc. The order
   is unique within the user filter under the existing composite constraint in
   docs/SYNC_SETUP.md:43. No new key, index, column or RPC is introduced.
2. Request Prefer: count=exact on every page. Verify Content-Range start/end,
   numeric safe total, array length, page-size bound and an unchanged advertised
   total. Advance by the actual number received, not the requested size, so a
   smaller server cap cannot silently stop traversal.
3. Finish only after the accumulated row count equals the exact total. Empty
   scope is a no-request result; an empty result requires a trustworthy zero
   total. No extra request beyond a known exact page boundary is needed.
4. Keep user/entity filters and the captured authorization token on every page.
   Compare the stored session before each request and after each parsed response;
   account change, logout or credential refresh fails closed for that read.
5. Validate persistence envelope fields, requested ownership/entity scope and
   live-record identity. Domain payload validation remains with existing Zod
   parsing in the provider. SQL nullable metadata maps to the existing optional
   string fields. Tombstone payloads, including previousRecord, are retained;
   their marker is not mistaken for a live record missing payload.id.
6. Track composite (entity,record_id) identities. Repeated IDs across different
   entities are valid. An overlapping duplicate within an entity rejects the
   entire read instead of hiding potentially missing rows by deduplication.
7. Any page HTTP/transport/JSON/range/count/scope/identity error returns data: []
   and a non-null error. Previously fetched rows never escape as a successful
   partial snapshot. The existing provider error gates then stop reconciliation,
   outbox claims/acknowledgements and uploads.

Normal Sync calls the existing preference hydration logic only after a complete
record read (or directly for preference-only mode with no record scope). The
original local baseline is still captured before the awaited read, preserving
A0's edit/delete CAS checks. The per-key current-value guard, event suppression,
latest-preference upload sampling, session generation fences and all local CAS
semantics are unchanged. Neither auth flows nor conflict precedence is changed.

The outbox still receives the full fetched row set only after read success.
Tombstones are not filtered out by pagination. A failed page leaves pending
mutations/tombstones unclaimed, and retry starts a new complete read. Accepted
upsert response representations are not used as the authoritative listing;
existing mutation processing updates its remote working set from the rows it
submitted. This stage changes listing completeness, not the write protocol.

## Candidate regression and compatibility coverage

New file: src/core/sync/__tests__/supabaseReadCompleteness.test.ts.
All requests use a synthetic .test endpoint with fetch mocked; unknown requests
throw. Provider cases use the real adapter and Dexie over fake-indexeddb, existing
factories and deferred promises. No credential, production account or hosted DB
is needed. No case has been executed by the agent.

- Empty, small, exact 500-row boundary, 501-row and 1,001-row stable results.
- A server cap smaller than the requested size, including a one-row cap.
- Later-page HTTP, transport and malformed JSON failures, without partial data.
- Overlapping identities, missing/unknown totals, changed totals, ignored offsets,
  premature empty page, wrong body length and malformed successful first body.
- Stable user/entity/order/auth filters across pages, composite identity,
  tombstones and SQL nullable metadata.
- Session switch/logout during paging and empty entity scope.
- Newer remote z on a later page prevents the old local z from being uploaded.
- Page failure stops local domain/preferences hydration, CAS, outbox claims and
  all uploads; the pending delete remains and retry can obtain the complete data.
- A deferred later page permits local edits without partial hydration; local
  Setting/preference changes remain intact after completion.
- Account switching/logout while a later page is pending applies no stale data.
- Conflict listing/resolution refuse incomplete reads. The selected conflict in
  the error fixture is deliberately on page one, so the old adapter would mutate
  it without discovering the failed required page. A conflict on a later page
  is also listed and resolved through the complete-read contract.

Empty/small/exact-boundary cases include compatibility coverage and may already
succeed at the baseline. Do not label them proof of the original defect. Only
owner-observed failures of the defect-specific cases below establish red tests.
Existing A0 tests remain unchanged and must also be executed by the owner.

## Owner red/green proof (PowerShell, normal user)

Do not use an elevated/Admin shell. Do not point tests at a hosted project.
The optional red worktree is separate from A4/A0/A3; stop if its path exists.
The copied test imports only interfaces and factories present at the baseline.
Do not run git clean/reset or overwrite an existing worktree.

~~~powershell
$redRoot = 'C:/dev/alios-a4-sync-completeness-red'
if (Test-Path -LiteralPath $redRoot) { throw 'Choose a different unused red worktree path.' }
git -C C:/dev/alios-a4-sync-completeness worktree add --detach $redRoot cb0b45cc90defd22fea839388013548775dcdd65
Copy-Item -LiteralPath C:/dev/alios-a4-sync-completeness/src/core/sync/__tests__/supabaseReadCompleteness.test.ts -Destination "$redRoot/src/core/sync/__tests__/supabaseReadCompleteness.test.ts"
Set-Location $redRoot
pnpm install --frozen-lockfile
pnpm exec vitest run src/core/sync/__tests__/supabaseReadCompleteness.test.ts -t 'reads all pages when|does not overwrite a newer remote|refuses reconciliation|refuses conflict|uses complete reads'
~~~

Expected red evidence, not an agent-observed result: later pages are omitted,
older local z is selected/uploaded, failed required pages are not discovered and
conflicts on unseen pages are missing. Assertions must not be weakened. Record
actual failures before calling these cases verified regressions. Keep this
synthetic worktree separate; no removal or staging is performed by these commands.

Green checks in A4 (install dependencies only if needed, as a normal user):

~~~powershell
Set-Location C:/dev/alios-a4-sync-completeness
pnpm install --frozen-lockfile
pnpm exec vitest run src/core/sync/__tests__/supabaseReadCompleteness.test.ts
pnpm exec vitest run src/core/sync src/core/backup/__tests__/BackupService.test.ts src/db/dexie/repositories/__tests__/syncChanges.test.ts src/app/__tests__/syncOutboxInjection.test.tsx
pnpm test:run
pnpm exec tsc --noEmit
pnpm build
git diff --check
~~~

pnpm build includes TypeScript, Vite and scripts/generate-precache-manifest.mjs.
No A4 validation result is claimed until the owner runs the commands. If existing
pnpm/node_modules issues arise, follow AGENTS.md: remove node_modules safely in
this worktree only, then pnpm install --frozen-lockfile as a normal user.

## Manual QA with mocks or disposable LOCAL data

1. Create more than one API page of synthetic records across the supported
   entities, including identical record IDs in different entities and a tombstone
   on a later page. Confirm every row is considered once and filters/order remain
   identical on every request. Repeat empty, exact-boundary and smaller-cap cases.
2. Put a newer remote version of a clean local record on the final page. Sync Now
   must select the newer version; inspect mock uploads for absence of the old one.
3. Fail a later page with HTTP 503, transport error or invalid JSON. Expect an
   actionable sync error, unchanged local records/preferences, no CAS/upload,
   and pending outbox/tombstones. Restore responses and retry from page zero.
4. Pause the final page, edit a local preference/Setting/Task, and resume. No
   remote hydration may occur before completion; A0 still retains newer edits
   or rejects a stale target patch and permits a fresh retry.
5. Switch accounts/log out while a page is pending. Release the old response;
   no stale records/preferences/uploads may be applied for the old account.
6. Put a conflict on a later page, list it and resolve it explicitly. Fail a later
   page while selecting a conflict from page one; resolution must not upload or
   alter local records from that incomplete read. Repeat after reconnect.
7. Simulate total changes, ignored offsets and overlapping pages. Expect refusal
   with no partial success, rather than deduplication or silent truncation.

This checklist has not been performed by the agent. Real device/provider QA is
not part of the synthetic tests and is not claimed.

## Remaining concurrency risks and separately approved options

Pagination completeness under a stable result set is not an MVCC snapshot and
is not conditional-write safety. Separate HTTP requests can observe mixed times.
Counts/ranges/duplicate checks detect many membership changes, not every change.
For example, page one reads a,b from a,b,c,d. Removing a and inserting e before
page two leaves the same total; offset two can return d,e, omitting c without a
duplicate. A payload update can likewise keep every key and count unchanged.
A4 does not claim a complete atomic view while other devices mutate that set.

Even a perfect single read would leave this write gap: device A reads v1, device
B writes v2, then A's unconditional upsert/tombstone overwrites it. A0 CAS guards
IndexedDB only. The existing unique key avoids duplicate row identity and RLS
restricts ownership; neither checks that the observed remote version is current.
Auth metadata updates have their existing cross-device last-writer behavior too.

Possible future directions, requiring separate approval/ADR:

- Read and compare an existing server revision (for example server_updated_at),
  use conditional updates/deletes and conflict-aware inserts, and treat a zero
  affected-row result as a conflict. This changes the adapter's write protocol,
  including tombstone and retry semantics; it is not implemented in A4.
- An approved transactional RPC accepting expected versions could reject stale
  batches atomically. It introduces hosted RPC/schema/permission review and is
  explicitly outside this task.
- A server-side snapshot can make one read coherent but does not close the later
  write gap; it cannot substitute for a version-conditional write contract.

Continuous concurrent writes may cause completeness checks to refuse and require
retry. Memory and exact-count work grow with the requested collection. No new
retry loop, distributed lock, last-write-wins rule, account namespace, migration,
RLS policy, local CAS change or hosted operation is introduced here.

## Exact changed-file inventory

Added:
- docs/A4_SYNC_REMOTE_COMPLETENESS.md
- src/core/sync/__tests__/supabaseReadCompleteness.test.ts

Modified:
- src/core/sync/supabaseClient.ts
- src/core/sync/SupabasePreferenceSyncProvider.ts

Removed: none. No dependency, lockfile, deployment configuration, schema,
historical report, PROJECT_STATE.md or CHANGELOG.md change.

Suggested commit message only, after owner validation and explicit approval:
fix(sync): require complete remote reads before reconciliation
