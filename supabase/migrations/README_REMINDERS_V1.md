# Reminder schema and V1 scope

Status: A3 migration authored locally; owner validation and any hosted rollout
remain pending. Historical migrations are unchanged.

| Migration | Existing or proposed contract |
| --- | --- |
| `202609200001_create_reminder_preferences.sql` | Per-user opt-in, timezone, morning time and legacy last-sent metadata |
| `20260922181700_create_push_subscriptions.sql` | Per-user endpoint and encryption credentials |
| `20260922181800_create_reminder_delivery_log.sql` | Category audit log |
| `20260927100000_create_reminder_delivery_attempts.sql` | User/channel/date parent claim, lease and retry state |
| `20261003090000_expand_reminder_preference_channel.sql` | Historical database accepts Telegram, Web Push and legacy both |
| `20261004120000_expand_reminder_delivery_log_category.sql` | Historical audit constraint also accepts Weekly Review |
| `20261024090000_reminder_scheduler_reliability.sql` | A3 target snapshot, independent outcomes, service-only RPCs, cancellation and bounded lease recovery |

Current V1 scheduler behavior accepts only one selected channel, Telegram or Web
Push. Legacy `both` is rejected without dispatch. Scheduled categories are Task
due/overdue and Finance obligations only. Historical Weekly Review audit records
remain readable; the application Weekly Review feature is unchanged.

A3 adds `reminder_push_delivery_targets`, composite ownership foreign keys,
unique parent/subscription identity, bounded target retry/lease state, RLS own-row
reads and service-role-only RPC mutations. Subscription credentials are not
copied into target rows. PostgreSQL 15+ is required for the selective
`ON DELETE SET NULL (subscription_id)` foreign key.

The migration also adds parent `targets_initialized` and
`dispatch_started_at` fields and composite ownership keys. It replaces the three
existing claim/complete/fail RPC bodies and adds begin/list/finish/finalize,
expiry-reconciliation and preference-cancellation functions. All public
scheduler RPCs explicitly revoke execution from public, anon and authenticated.
The internal lock helper and trigger function are not exposed to service_role.

The migration is transactional and forward-only. Legacy nonterminal Web Push
attempts and in-flight Telegram attempts are closed conservatively without
replaying unknown sends. Existing sent/skipped states and audit logs are not
rewritten. No backfill can recover past device outcomes.

Read the [A3 design and rollout requirements](../../docs/A3_REMINDER_SCHEDULER_RELIABILITY.md)
before owner-run local validation. No hosted migration or production activation
is authorized here.
