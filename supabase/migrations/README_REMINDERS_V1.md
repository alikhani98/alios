# Reminders V1 Database Schema

## Scope

This directory contains the Supabase database schema for **Reminders V1 — Step 1 (Database only)**.

- **Included**: Three tables with RLS policies
- **Not included**: Edge Functions, UI, VAPID/Telegram bot setup
- **Reminder categories**: Task due/overdue + Finance obligation (v1 scope lock)

---

## Tables

### 1. `reminder_preferences`

**Purpose**: Stores per-user reminder configuration.

**Fields**:

- `user_id` (uuid, PK, FK → `auth.users`): Owner of preferences
- `enabled` (boolean, default `false`): Master on/off switch
- `channel` (text, default `'telegram'`, check: `= 'telegram'`): Delivery channel (v1 supports only Telegram)
- `telegram_chat_id` (text, nullable): Telegram chat ID (must match regex `^-?[0-9]+$` if present)
- `timezone` (text, default `'UTC'`): User's timezone for local-date calculation
- `morning_time` (time, default `'08:00:00'`): Preferred delivery time (local)
- `last_sent_local_date` (date, nullable): Prevents duplicate sends on same local day
- `updated_at` (timestamptz, auto-updated): Last modification timestamp

**RLS**: Users can SELECT/INSERT/UPDATE/DELETE their own row only.

**Notes**:

- One row per user
- Cascade deletes when user account is removed
- Trigger `set_reminder_preferences_updated_at` keeps `updated_at` current

---

### 2. `push_subscriptions`

**Purpose**: Stores Web Push subscription metadata (optional future channel).

**Fields**:

- `id` (uuid, PK, default `gen_random_uuid()`): Subscription identifier
- `user_id` (uuid, FK → `auth.users`): Owner
- `endpoint` (text, not null): Web Push endpoint URL
- `p256dh` (text, not null): Public key for encryption
- `auth` (text, not null): Auth secret for encryption
- `user_agent` (text, nullable): Browser/device info
- `created_at` (timestamptz, default `now()`): Registration time
- `last_used_at` (timestamptz, nullable): Last successful send time

**Unique constraint**: `(user_id, endpoint)` — prevents duplicate subscription registrations.

**RLS**: Users can SELECT/INSERT/DELETE their own subscriptions only.

**Notes**:

- V1 does not activate Web Push; this table prepares the schema for future expansion
- Index on `user_id` for fast per-user lookups

---

### 3. `reminder_delivery_log`

**Purpose**: Audit log for sent reminders.

**Fields**:

- `id` (uuid, PK, default `gen_random_uuid()`): Log entry identifier
- `user_id` (uuid, FK → `auth.users`): Recipient
- `channel` (text, check: `in ('telegram', 'web_push')`): Delivery channel
- `category` (text, check: `in ('task_due', 'finance_obligation')`): Reminder type (v1 scope lock)
- `item_count` (int, default `0`, check: `>= 0`): Number of items in reminder batch
- `sent_at` (timestamptz, default `now()`): Actual send timestamp (UTC)
- `local_date` (date, not null): User's local date when reminder was sent
- `status` (text, default `'sent'`, check: `in ('sent', 'failed', 'skipped')`): Delivery outcome
- `error_message` (text, nullable): Error detail if status = `'failed'`
- `metadata` (jsonb, nullable): Optional structured debug/context data

**Indexes**:

- `user_id` for per-user queries
- `(user_id, local_date desc)` for recent-history queries
- `sent_at desc` for global delivery timeline

**RLS**:

- Users (authenticated) can SELECT their own log entries
- Service role can INSERT log entries (Edge Functions write here)

**Notes**:

- No UPDATE/DELETE policies; log is append-only from user perspective
- Edge Functions use service_role to insert delivery records

---

## Manual Deployment

To apply these migrations to your Supabase project:

```bash
# Option A: Supabase CLI (recommended)
cd C:\dev\alios-app-stage-2.worktrees\reminders-v1-database-schema-8f68431b
supabase db push

# Option B: Manual SQL execution in Supabase Dashboard
# 1. Open https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
# 2. Copy/paste each migration file in order:
#    - 202609200001_create_reminder_preferences.sql
#    - 20260922181700_create_push_subscriptions.sql
#    - 20260922181800_create_reminder_delivery_log.sql
# 3. Run each migration
```

---

## What to Check Manually

After deploying migrations:

1. **Supabase Dashboard → Table Editor**:
   - Verify `reminder_preferences`, `push_subscriptions`, `reminder_delivery_log` tables exist
   - Check column names, types, and default values match specs above

2. **Supabase Dashboard → Authentication → Policies**:
   - Verify RLS policies are active for each table
   - Confirm policy names match those in migration files

3. **Test RLS policies** (optional):
   - Create a test user via Supabase Auth
   - Use SQL Editor with `set role authenticated; set request.jwt.claims.sub = '<user_id>';`
   - Verify INSERT/SELECT/UPDATE/DELETE operations respect ownership

4. **TypeScript compilation** (after Edge Functions are added later):
   - Not applicable yet (this step is database-only)

---

## Next Steps (NOT in this step)

- Edge Function: `send-reminders` (scheduled job)
- Edge Function: `send-reminder-test` (manual test-send)
- UI: Settings reminder preference panel
- VAPID key generation (Web Push, optional future)
- Telegram bot setup (token stored in Supabase secrets)

---

## Reminders V1 Scope Lock

Per `AGENTS.md`:

> V1 of Reminders covers ONLY two categories: Task due/overdue, and Finance obligation reminders.

Do not add habit, goal, journal, or other reminder types in this stage.
