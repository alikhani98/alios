# Reminders V1 Edge Functions

This document describes repository implementation, not evidence of hosted
deployment or completed owner validation.

- `reminder-settings`: authenticated POST actions `get`, `save`, and manual
  Telegram `test`; preferences are owned by the authenticated user and accessed
  under RLS. Manual test delivery is an explicit user action, outside scheduler tests.
- `push-subscription`: authenticated register/delete actions, scoped to the
  authenticated owner. Registration alone does not opt a user into delivery.
- `send-morning-reminders`: service-role-authorized POST scheduler for one
  selected channel, Telegram or Web Push. See its [current contract](send-morning-reminders/README.md).
- `telegram-bot`: existing bot functionality; A3 does not modify its commands.

V1 scheduled outbound delivery includes only Task due/overdue and active unpaid
Finance obligations. Weekly Review outbound delivery is excluded. The Weekly
Review application feature and unrelated bot functionality remain intact.

Earlier Step 1/Step 2 descriptions that called all Web Push delivery deferred
describe historical scope. Web Push sender code exists in this baseline; A3 adds
independent durable device outcomes in a new local migration. Hosted readiness,
authorization configuration, provider acceptance and device display remain
owner-validation requirements.

Do not copy keys into SQL cron definitions, source code, documentation or chat.
Runtime secrets remain environment-managed. No hosted rollout is authorized by
these instructions. Use the [A3 owner-run checks](../../docs/A3_REMINDER_SCHEDULER_RELIABILITY.md)
with mocked providers and a disposable local database.
