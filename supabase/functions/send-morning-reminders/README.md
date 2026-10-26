# Morning reminder scheduler — A3

Status: local implementation awaiting owner-run validation. No hosted migration,
deployment, cron change, or provider send is part of this work.

V1 outbound categories are **Task due/overdue** and **Finance obligations**.
Weekly Review remains an application feature, but is never included in this
scheduler's Telegram messages, Web Push payloads, or delivery logs.

Only the explicitly selected channel is eligible. Disabled, unknown and legacy
`both` preferences fail closed. Telegram requires a numeric Chat ID; Web Push
does not require one. Selection changes cancel old queued work, including when
switching back later that day.

Eligibility uses one injected reference instant, the user's IANA timezone, and
the configured morning time including seconds. Open Tasks are `todo`, `doing`
and `deferred` with a valid date no later than today. Finance preserves the
existing scheduler's inclusive today-through-three-days-ahead explicit-date or
day-of-month window, limited to active, unpaid obligations. Source query errors
abort that user's batch before claiming or sending. This is a digest of existing
synced copies; it neither activates sync nor uploads local records.

The authoritative idempotency key is user/channel/local date. The legacy shared
`last_sent_local_date` is informational, updated transactionally only for full
success, and never used to suppress a retry.

Web Push snapshots subscription identities on first claim. Each target is
authorized and recorded independently; sent devices are excluded from retries.
Partial, unknown, removed-device and zero-device outcomes are not full success.
HTTP 404/410 remove the expired subscription and remain permanent delivery
failures. Known 429/5xx rejections retry with 5/15/60/360-minute delays, at most five
attempts. Whitelisted pre-dispatch connection/DNS failures retry without a fake
HTTP status; reset, timeout and lost-response failures remain ambiguous.
Potentially accepted but unestablished sends become terminal
`unknown`, without automatic same-day resend. Exactly-once delivery is not
claimed.

The parent is successful only when every snapshotted target is durably sent.
The response's Web Push success/failure counts describe the processed batches'
durable target snapshots (including previously accepted devices); they are not
a count of new sends in this invocation. Target failure totals include pending
retries and unknown outcomes. `removedCount` describes removals acknowledged in
this invocation. A zero-device batch is `skipped`, never `sent`.

## Invocation and secrets

POST only; the handler independently compares the bearer token with the
configured service-role key. User/anon JWTs are rejected regardless of gateway
settings. The existing service-role cron bearer contract is preserved; gateway
configuration must still be verified by the owner. Never disable gateway
verification to bypass an authorization problem.

Secrets remain runtime environment variables: `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `VAPID_KEYS_JSON`, and
`VAPID_SUBJECT`. No provider payload, raw error, response description, subscription
key or token-bearing URL is logged or returned. Provider failures are stored as
bounded application-generated codes. Telegram messages are plain text.

## Required rollout boundary

The new forward-only migration
`20261024090000_reminder_scheduler_reliability.sql` and this Function must be
activated together in a separately approved rollout. The old scheduler must be
paused and in-flight old invocations drained before applying it. The migration
conservatively closes legacy Web Push retries and legacy in-flight Telegram
attempts as unknown, because their prior device outcomes cannot be reconstructed.
Historic sent/skipped records and audit logs are preserved.

See [A3 design, tests and owner commands](../../../docs/A3_REMINDER_SCHEDULER_RELIABILITY.md).
Do not use a production invocation as a local smoke test.
