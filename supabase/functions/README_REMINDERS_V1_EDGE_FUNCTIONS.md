# Reminders V1 Edge Functions

## Scope

This directory contains the Supabase Edge Functions for **Reminders V1 — Step 2 (Edge Functions only)**.

- **Included**: Two Edge Functions (`reminder-settings`, `send-morning-reminders`)
- **Not included**: UI, VAPID/Web Push logic (tables exist but stay unused in this step), actual Telegram bot creation
- **Reminder categories**: Task due/overdue + Finance obligation (v1 scope lock)

---

## Edge Functions

### 1. `reminder-settings`

**Purpose**: HTTP endpoint for users to read/update their row in `reminder_preferences`.

**Methods**:

- `GET`: Fetch current user's preferences (respects RLS)
- `POST`: Save/update preferences (respects RLS)
- `OPTIONS`: CORS preflight

**Authentication**: Requires Bearer token (Supabase auth JWT) in `Authorization` header.

**Request body (POST)**:

```json
{
  "action": "save",
  "preference": {
    "enabled": true,
    "channel": "telegram",
    "telegramChatId": "123456789",
    "timezone": "Asia/Tehran",
    "morningTime": "08:00"
  }
}
```

**Response (GET)**:

```json
{
  "ok": true,
  "message": "Preference retrieved",
  "preference": {
    "user_id": "...",
    "enabled": true,
    "channel": "telegram",
    "telegram_chat_id": "123456789",
    "timezone": "Asia/Tehran",
    "morning_time": "08:00:00",
    "last_sent_local_date": "2026-09-23",
    "updated_at": "2026-09-23T05:00:00Z"
  }
}
```

**Deployment**:

```bash
supabase functions deploy reminder-settings
```

**Manual testing**:

```bash
# Get preferences
curl -X GET https://YOUR_PROJECT_REF.supabase.co/functions/v1/reminder-settings \
  -H "Authorization: Bearer YOUR_USER_JWT"

# Save preferences
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/reminder-settings \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"save","preference":{"enabled":true,"channel":"telegram","telegramChatId":"123456789","timezone":"Asia/Tehran","morningTime":"08:00"}}'
```

---

### 2. `send-morning-reminders`

**Purpose**: Scheduled function that runs periodically (e.g., every 15-30 minutes via Supabase cron) to check if any user's local morning time has arrived, and sends them a Telegram message with due tasks and finance obligations.

**Authentication**: Requires service role key (auto-provided by Supabase runtime for scheduled jobs).

**Logic**:

1. Fetch all users from `reminder_preferences` where `enabled = true` and `telegram_chat_id` is not null.
2. For each user:
   - Calculate their current local time using their `timezone`.
   - Check if current local time >= `morning_time`.
   - Skip if `last_sent_local_date` equals today (already sent).
3. Query `alios_sync_records` table where `entity = 'tasks'` for due/overdue items (status ≠ done, ≠ cancelled, dueDate ≤ today).
4. Query `alios_sync_records` table where `entity = 'financeObligations'` for active obligations (status = active, dueDate ≤ today OR dueDay ≤ today's day-of-month).
5. If any items exist, send a single Telegram message via Bot API.
6. Log delivery attempt in `reminder_delivery_log`.
7. Update `last_sent_local_date` in `reminder_preferences`.

**Dependencies**:

- `SUPABASE_URL`: auto-provided by Supabase runtime
- `SUPABASE_SERVICE_ROLE_KEY`: auto-provided by Supabase runtime
- `TELEGRAM_BOT_TOKEN`: must be set as a Supabase secret (see below)

**Setting the Telegram Bot Token Secret**:

Run this command **once** (replace `YOUR_ACTUAL_TOKEN` with the real bot token):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=YOUR_ACTUAL_TOKEN
```

After setting the secret, redeploy the function:

```bash
supabase functions deploy send-morning-reminders
```

**Deployment**:

```bash
supabase functions deploy send-morning-reminders
```

**Scheduling (via Supabase cron)**:

To run this function every 15 minutes, create a Postgres cron job in Supabase SQL Editor:

```sql
select cron.schedule(
  'send-morning-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-morning-reminders',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with your actual values.

**Manual testing**:

```bash
supabase functions invoke send-morning-reminders --method POST
```

**Notes**:

- This function uses **service role key** to bypass RLS, allowing it to read all users' preferences and items.
- The function is idempotent per day: it skips users who have already received a reminder today.
- If `alios_sync_records` table does not exist or contains no matching records, the function will log warnings and return empty arrays gracefully.

---

## Shared Utilities

### `_shared/cors.ts`

**Purpose**: Provides CORS headers and preflight response helpers.

**Exports**:

- `createCorsHeaders(origin: string | null): Headers`: Returns CORS headers for allowed origins.
- `createCorsPreflightResponse(origin: string | null): Response`: Returns 204 preflight response.

**Allowed origins**:

- `http://localhost:5173` (local development)
- `https://alikhani98.github.io` (production)

---

## What to Check Manually

After deploying Edge Functions:

1. **Supabase Dashboard → Edge Functions**:
   - Verify `reminder-settings` and `send-morning-reminders` functions are listed and deployed.

2. **Test `reminder-settings` via curl** (see above):
   - GET: Should return 401 without a valid JWT, 200 with a valid JWT.
   - POST: Should return 400 for invalid input, 200 for valid preference save.

3. **Test `send-morning-reminders` manually**:
   - Insert a test user row in `reminder_preferences` with `enabled = true` and a valid `telegram_chat_id`.
   - Insert a test task or finance obligation in `alios_sync_records` (see function README for SQL examples).
   - Invoke the function via `supabase functions invoke send-morning-reminders --method POST`.
   - Check your Telegram bot chat to see if the message arrives.
   - Verify `reminder_delivery_log` for a new row.

4. **TypeScript compilation** (not run by agent — you must run this):
   - Edge Functions are deployed directly to Supabase, but you can optionally validate TypeScript locally:
     ```bash
     cd supabase/functions/reminder-settings
     deno check index.ts
     cd ../send-morning-reminders
     deno check index.ts
     ```

---

## Secrets & Credentials

Per `AGENTS.md`:

> Never write a real secret, token, API key, or password directly in code. Always read it from an environment variable (`.env` file) or from Supabase's own secrets store (`Deno.env.get()` inside Edge Functions).

All Edge Functions read secrets via `Deno.env.get()`:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: auto-provided by Supabase runtime
- `TELEGRAM_BOT_TOKEN`: must be set manually via `supabase secrets set TELEGRAM_BOT_TOKEN=...`

---

## Next Steps (NOT in this step)

- UI: Settings panel for reminder preferences
- VAPID key generation (Web Push, optional future)
- Actual Telegram bot creation (not done here — only the token is expected to exist)
- Migration to create `alios_sync_records` table (assumed to exist from earlier sync stages)

---

## Reminders V1 Scope Lock

Per `AGENTS.md`:

> V1 of Reminders covers ONLY two categories: Task due/overdue, and Finance obligation reminders.

Do not add habit, goal, journal, or other reminder types in this stage.
