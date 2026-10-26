# A3 — Reminder scheduler reliability and channel safety

Status: architecture approved by the owner on 2026-10-24; local release candidate
with owner-confirmed automated and local DB validation on 2026-10-26.
Manual QA and release approval remain pending. No completion, hosted deployment or real provider
delivery is claimed. Baseline: `b1e34b110a26b348f672b398c6614c0170bf590a`.
Branch: `codex/a3-reminder-scheduler-reliability`.

## Scope and corrected causes

The old scheduler claimed Telegram for every eligible preference and also
claimed Web Push when a sender existed. It treated one successful push device
as a successful parent; removed devices and no devices could also complete the
parent. User/date-only retry discovery and shared last-sent metadata could
select the wrong channel or suppress unfinished work. Source HTTP failures
became empty data sets, Telegram HTTP status was not independently checked,
and helper clocks could disagree at midnight. Expired processing leases had
no database-enforced attempt budget. The entry point ignored authorization
headers and raw provider errors could escape.

A3 limits dispatch to the selected channel and opt-in. It removes Weekly Review
only from scheduled outbound content, without changing the application feature.
Tasks use the current open statuses (`todo`, `doing`, `deferred`) and valid
due/overdue dates. Finance retains the existing inclusive three-day window,
active/unpaid rules and month-boundary dueDay behavior. Data reads are user-scoped,
ordered and paged with exact response totals, including server-capped pages.
A failed source read prevents that entire user's batch from
sending, without preventing another user's independent batch.

## Durable delivery model

The existing parent identity remains `(user_id, channel, local_date)`.
`last_sent_local_date` is informational, not an eligibility gate.
A first Web Push claim atomically snapshots subscription IDs. New devices are
not appended later that day. Stored endpoint/key values are loaded from the
current subscription only after per-target authorization; secrets are never
copied into outcome rows.

| Target state | Meaning and transition |
| --- | --- |
| pending | Snapshotted, not yet dispatched; may be atomically begun |
| processing | Dispatch authorized under the current parent's bounded lease |
| sent | Provider accepted and DB recorded; never automatically resent |
| retryable_failure | Known 429/5xx rejection; retry only this target after backoff |
| permanent_failure | Nonretryable response, removed subscription or exhausted window |
| unknown | Send may have been accepted; never automatically resent that day |

The service RPCs serialize by locking preference, then parent, then target.
Dispatch begins only once per target and requires matching owner, selected
channel, opt-in, current local date/time and active lease. A selection, Chat ID
or enablement change cancels outstanding work; switching back does not revive it.
Preference deletion also cancels work. These checks cover direct RLS preference
writes as well as the existing settings handler.

The linearization point is the database begin authorization. A preference change
cannot recall a request already authorized/in flight. It suppresses later begins
and retries. Provider operations never hold a database transaction open.

The maximum parent budget is five claims; target budgets are also capped at five.
Known-failure delays are 5, 15, 60 and 360 minutes, scheduled from the actual DB
outcome-write time. The DB independently computes the delay rather than trusting
the client's old reference time or proposed retry timestamp. An expired
never-dispatched claim consumes its attempt and may retry within the remaining
budget. An expired in-flight target becomes unknown; untouched targets may still
retry. Expiry reconciliation runs even when users are disabled or the local date
has changed. Closed daily windows terminalize untouched work.

A parent is sent only when its nonempty snapshot is entirely sent. No targets
means skipped. Partial success stays failed with separate success, permanent
failure, unknown and pending counts; only eligible unfinished targets can retry.
A crash after all target results were durably recorded can be reconciled to sent
without repeating devices. Delivery logs remain audit records; the parent/targets
are authoritative if audit insertion fails.

## Clock and provider policy

One injected reference instant controls JS eligibility, source dates, claim date
and audit date, including configured seconds and timezone/year boundaries.
Database wall time controls actual lease fencing, dispatch authorization,
delivery timestamps, completion and backoff. A stale reference instant cannot
authorize sends after the user's daily window has closed.

Telegram requires both successful HTTP and provider `ok: true`. It uses plain
text so user-entered Markdown does not cause parsing failures. Known provider
rejections can retry; a lost response or malformed successful response is unknown.
Web Push known HTTP 404/410 is permanent failure, even when subscription removal
succeeds. A 429/5xx rejection is retryable, independently of other device results.
Adapter configuration failure before dispatch is a safe retryable failure.
Whitelisted connection-establishment errors (connection refusal, DNS failure or
unreachable network/host, including nested cause codes) are retryable without
inventing an HTTP status. Connection reset, timeout, socket loss and abort are
not classified as proof of non-dispatch.
Potentially dispatched network errors/timeouts are unknown; this intentionally
prioritizes avoiding duplicate delivery over replaying an unestablished send.
The Web Push wait is bounded to 30 seconds; the underlying library may finish
later, so a timeout is never automatically retried.

Exactly-once delivery and actual device display are not claimed. Unknown may
represent a notification that was delivered or a notification that was lost.
There is no new UI to replay unknown deliveries. A new local date creates a new
daily identity. Retried unfinished devices receive a fresh digest of current
source data; the device set remains the original snapshot.

The result's `web_push` counts describe durable outcomes in processed snapshots,
not new provider calls; pending and unknown are included in failureCount.
A parent may be sent while the overall response is unsuccessful because audit
persistence failed. That operational failure does not reopen a sent batch.

## Security and migration review

The POST handler independently checks the exact configured service-role bearer.
A valid user or anon JWT is insufficient. Missing runtime configuration fails
closed. Secrets stay in environment variables and provider errors become fixed
application codes; no arbitrary exception, response description, key or URL is
persisted, logged or returned. The existing cron bearer contract remains; hosted
gateway settings are unverified and must not be assumed.

The new migration is `20261024090000_reminder_scheduler_reliability.sql`.
It adds one target table and two scoped parent fields, plus ownership keys,
state constraints and retry/expiry indexes. Composite FKs prevent associating
another account's subscription or parent. A deleted subscription nulls only its
FK, retaining the immutable target identity and outcome (requires PostgreSQL 15+).
Authenticated users can read only their own targets under RLS and cannot mutate
them. Target mutation is available only through service-role RPCs; the internal
helper and cancellation trigger function have no API-role execute grant.
All definer functions use a fixed catalog/public search path and qualified tables.
Old RPC execution grants are explicitly revoked from public/anon/authenticated.

Legacy nonterminal Web Push attempts have no recoverable device snapshot, and
legacy in-flight Telegram attempts may have sent already. Migration closes those
as terminal unknown failures. Historic sent/skipped records and delivery logs
remain unchanged, including any old inaccurate aggregate result. This avoids
inventing successful device records or replaying a potentially delivered batch.
These transition policies deliberately can skip an unestablished notification
on the migration day.

## Changed-file inventory

Added:

- `docs/A3_REMINDER_SCHEDULER_RELIABILITY.md`
- `scripts/test-reminder-concurrency.mjs`
- `supabase/functions/send-morning-reminders/http.ts`
- `supabase/functions/send-morning-reminders/http.test.ts`
- `supabase/migrations/20261024090000_reminder_scheduler_reliability.sql`
- `supabase/tests/reminder_scheduler_reliability.sql`

Modified:

- `PROJECT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `supabase/functions/README_REMINDERS_V1_EDGE_FUNCTIONS.md`
- `supabase/functions/send-morning-reminders/README.md`
- `supabase/functions/send-morning-reminders/core.ts`
- `supabase/functions/send-morning-reminders/core.test.ts`
- `supabase/functions/send-morning-reminders/deliveryState.ts`
- `supabase/functions/send-morning-reminders/deliveryState.test.ts`
- `supabase/functions/send-morning-reminders/deliveryTypes.ts`
- `supabase/functions/send-morning-reminders/index.ts`
- `supabase/functions/send-morning-reminders/webPushSender.ts`
- `supabase/functions/send-morning-reminders/webPushSenderCore.ts`
- `supabase/functions/send-morning-reminders/webPushSender.test.ts`
- `supabase/migrations/README_REMINDERS_V1.md`

Removed: none. Historical migrations and dependencies are unchanged.

## Regression coverage

- `core.test.ts`: channel-only users, no Chat ID, disabled/invalid preferences,
  shared last-sent metadata, channel-switch dispatch, partial push logging,
  failed Task/Finance reads, provider/body errors, unknown transport outcomes,
  repeated/concurrent mocked claims, account isolation, source eligibility,
  seconds/midnight/year boundaries and Weekly Review exclusion.
- `webPushSender.test.ts`: independent device results, retry only the failed
  device, repeated success suppression, permanent/expired subscriptions,
  retryable HTTP responses, ambiguous transport outcomes and failed DB writes.
- `deliveryState.test.ts`: RPC contracts, all backoff intervals, maximum attempt,
  rejected leases, malformed claims and sanitization.
- `http.test.ts`: unauthorized methods/tokens, exact service bearer, missing
  configuration and sanitized exceptions.
- `supabase/tests/reminder_scheduler_reliability.sql`: real local DB state
  transitions, ownership FKs, RLS, grants, target snapshot, retry/backoff,
  success suppression, unknown/stale leases, exhaustion, removal and channel
  cancellation. Fixture state is rolled back.
- `scripts/test-reminder-concurrency.mjs`: two real local PostgreSQL connections
  contend for parent and target authorization. It creates only synthetic fixtures
  and removes its own user afterward. No provider is invoked.

Mocked concurrency verifies client behavior under an atomic RPC contract; the
local SQL/concurrency checks are necessary to evaluate that contract itself.
The owner confirmed successful application of the A3 migration, SQL regression
and real two-connection PostgreSQL concurrency test against disposable local
Supabase. These are validated local checks, not outstanding untested work.
The owner also confirmed 2,009 full-suite Vitest tests, 95 focused Scheduler
tests, app TypeScript, strict Edge TypeScript, production build and diff checks.
The final integration gate reran the 95 focused tests successfully and executed
12 additional in-memory Node mock checks without changing application/test code:
multi-page 200/206 responses, empty snapshot, premature empty page, changing
total, ignored offset, missing range, unknown total, incomplete body length,
malformed JSON, HTTP failure, lease rotation retrying only the unfinished device,
and suppression of sent/unknown targets after interruption. Mock lease state
is a client-contract check; the owner's real SQL tests establish DB behavior.

The SQL source returns `TABLE(target_id uuid)` from `list_reminder_push_targets`,
`jsonb` or null from `begin_reminder_push_target`, boolean from target completion,
and a `jsonb` aggregate from finalization. Client shapes and SQL test assertions
agree. The final gate could not independently reread the live local catalog
because the Docker daemon was unavailable; this does not invalidate the owner's
successful DB tests, but no independent current-schema drift check is claimed.

## Known bounded risks retained by A3

- Sync reads use separate ordered, offset-paginated HTTP requests, not one
  transaction snapshot. Exact totals, ranges, duplicate identities and payload
  identity checks detect many incomplete or changing results. Equal-count
  insert/delete changes or payload updates between pages can still create a
  mixed-time digest. Task and Finance reads are also separate snapshots. A3
  does not claim atomic Sync snapshot consistency or introduce a snapshot RPC.
- Finance `financeCalculations.ts:getNextDueDate` clamps due day 31 to the last
  day of a shorter month. `localReminderResolver.ts` uses exact day equality;
  the existing outbound scheduler tests membership in today through today+3.
  Thus a 31-only obligation is not moved to February's last day by the scheduler.
  A3 preserves that outbound policy and the existing OR when both dueDate and
  dueDay exist; it restores the monthly display label only. Reconciling these
  product policies requires separate approval, not an A3 behavior change.

## Proposed A3 Git boundary

Include `supabase/.gitignore`: its generic rules exclude CLI `.temp`/`.branches`
state and local dotenv files. Ignore rules do not untrack legacy `.temp` files
already present in Git. Do not stage their changes or remove them implicitly.
Exclude `supabase/.temp/cli-latest`: this is generated CLI version cache, not A3.
Exclude the current `supabase/config.toml` from this A3 staging proposal: it is
an uncurated CLI-generated local stack configuration, with local project ID,
default services and a default seed.sql path. A curated shared local development
configuration can be versioned separately; none of its settings should be
treated as proof of hosted configuration. No file was deleted or staged.

## Owner-run commands (Windows CMD, normal user)

From `C:\dev\alios-app-stage-2`:

```cmd
pnpm exec vitest run supabase/functions/send-morning-reminders
pnpm test:run
pnpm exec tsc --noEmit
pnpm build
pnpm exec tsc --noEmit --strict --allowImportingTsExtensions --moduleResolution bundler --module esnext --target es2022 --lib es2022,dom,dom.iterable --skipLibCheck supabase/functions/send-morning-reminders/core.test.ts supabase/functions/send-morning-reminders/deliveryState.test.ts supabase/functions/send-morning-reminders/webPushSender.test.ts supabase/functions/send-morning-reminders/http.test.ts
deno check supabase/functions/send-morning-reminders/index.ts
git diff --check
```

Run the Deno command only when Deno is available. App tsconfig includes `src`
only, so app tsc/build alone do not validate the Edge Function runtime.
The additional tsc command checks the Vitest contract files and their imports.

For SQL checks, first prepare a disposable local Supabase database containing
the existing reminder migrations. Apply the new A3 migration once using the
first psql command below (skip it if A3 is already installed locally). Never point these
commands at a hosted database. No hosted migration is authorized. With `psql`
on PATH and `PGPASSWORD` set securely to that local database's password:

```cmd
set PGHOST=127.0.0.1
set PGPORT=54322
set PGDATABASE=postgres
set PGUSER=postgres
psql "host=127.0.0.1 hostaddr=127.0.0.1 port=54322 dbname=postgres user=postgres" -X -w -v ON_ERROR_STOP=1 -f supabase\migrations\20261024090000_reminder_scheduler_reliability.sql
psql "host=127.0.0.1 hostaddr=127.0.0.1 port=54322 dbname=postgres user=postgres" -X -w -v ON_ERROR_STOP=1 -f supabase\tests\reminder_scheduler_reliability.sql
node scripts\test-reminder-concurrency.mjs
```

Do not paste credentials into source, reports or chat. The SQL fixture must run
as the disposable local database owner to exercise roles and inspect ACLs.

## Manual owner scenarios and rollout requirements

In an isolated local environment with providers replaced by mocks, open Settings
reminder controls and exercise Telegram-only, Web-Push-only, disabled and channel
switching configurations. Confirm existing Weekly Review application behavior
remains available but never appears in outbound payloads. Use two simulated
devices: let A succeed and B return 503, advance the retry state, and verify only
B is sent again. Repeat with 410, unknown outcome, source-read failure and two
accounts. Inspect parent/target rows and audit metadata; no failed or unknown
target may become sent merely because A succeeded. Repeat at a timezone midnight
and just before/at configured seconds. Unauthorized scheduler requests must
perform no source/provider work.

A separately approved hosted rollout must pause the old scheduler, drain old
in-flight invocations, review/back up reminder state using the existing
operational process, confirm PostgreSQL compatibility, apply the forward
migration, deploy the matching Function, verify invocation authorization and
then resume scheduling. Do not mix the old dual-channel sender with the new
target RPCs. There is no hosted SQL, deployment, cron change or real notification
authorization in A3's local implementation request.

Remaining evidence gaps: independent current local catalog drift inspection,
actual hosted ACL/gateway settings, provider acceptance and real device display.
Manual QA/release approval and a separately approved coordinated hosted rollout
remain required. Owner-confirmed local automated/SQL/concurrency results above
must not be reported as untested. No hosted action or real notification was
performed by the final integration gate.

Suggested commit after owner validation and explicit commit authorization:
`fix(reminders): enforce channel selection and track per-device retries`
