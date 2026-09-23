# send-morning-reminders Edge Function

## Purpose

Scheduled Supabase Edge Function that runs periodically (e.g., every 15-30 minutes via Supabase cron) to check if any user's local morning time has arrived, and sends them a Telegram message with due tasks and finance obligations.

## Scope (Reminders V1 — Step 2)

- Reads `reminder_preferences` table to find users with `enabled = true` and a valid `telegram_chat_id`.
- Checks each user's timezone and `morning_time` against the current UTC time to determine if it's time to send.
- Skips users who have already received a reminder today (`last_sent_local_date = today`).
- Queries `alios_sync_records` table where `entity = 'tasks'` for due/overdue items (status ≠ done, ≠ cancelled, dueDate ≤ today).
- Queries `alios_sync_records` table where `entity = 'financeObligations'` for active obligations (status = active, dueDate ≤ today OR dueDay ≤ today's day-of-month).
- Sends a single Telegram message via Bot API (token from `Deno.env.get('TELEGRAM_BOT_TOKEN')`).
- Logs delivery attempts to `reminder_delivery_log`.
- Updates `last_sent_local_date` in `reminder_preferences` after successful send.

## Dependencies

- `SUPABASE_URL`: Supabase project URL (auto-provided by Supabase runtime).
- `SUPABASE_SERVICE_ROLE_KEY`: service role key (auto-provided by Supabase runtime).
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token (must be set as a Supabase secret — see below).

## Setting the Telegram Bot Token Secret

Run this command **once** in your terminal (replace `YOUR_ACTUAL_TOKEN` with the real bot token):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=YOUR_ACTUAL_TOKEN
```

After setting the secret, you must **redeploy** the function for the change to take effect:

```bash
supabase functions deploy send-morning-reminders
```

## Deployment

```bash
supabase functions deploy send-morning-reminders
```

## Scheduling (via Supabase cron)

To run this function every 15 minutes, create a Postgres cron job:

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

## Manual Testing

1. Insert a test user row in `reminder_preferences`:
   ```sql
   insert into public.reminder_preferences (user_id, enabled, telegram_chat_id, timezone, morning_time)
   values (
     'YOUR_AUTH_USER_ID',
     true,
     'YOUR_TELEGRAM_CHAT_ID',
     'Asia/Tehran',
     '08:00:00'
   );
   ```

2. Insert a test task or finance obligation in `alios_sync_records`:
   ```sql
   -- Test task
   insert into public.alios_sync_records (user_id, entity, record_id, payload, updated_at, created_at)
   values (
     'YOUR_AUTH_USER_ID',
     'tasks',
     'test-task-1',
     '{"id":"test-task-1","title":"Test Task","status":"pending","dueDate":"2026-09-23","priority":"medium","isMit":false,"createdAt":"2026-09-23T00:00:00Z","updatedAt":"2026-09-23T00:00:00Z"}',
     now(),
     now()
   );

   -- Test finance obligation
   insert into public.alios_sync_records (user_id, entity, record_id, payload, updated_at, created_at)
   values (
     'YOUR_AUTH_USER_ID',
     'financeObligations',
     'test-obligation-1',
     '{"id":"test-obligation-1","title":"Test Obligation","status":"active","dueDate":"2026-09-23","type":"debt","totalAmount":1000,"paidAmount":0,"createdAt":"2026-09-23T00:00:00Z","updatedAt":"2026-09-23T00:00:00Z"}',
     now(),
     now()
   );
   ```

3. Invoke the function manually via Supabase CLI:
   ```bash
   supabase functions invoke send-morning-reminders --method POST
   ```

4. Check your Telegram bot chat to see if the message arrives.
5. Verify `reminder_delivery_log` for a new row.

## Notes

- This function uses **service role key** to bypass RLS, allowing it to read all users' preferences and items.
- The function is idempotent per day: it skips users who have already received a reminder today.
- If `alios_sync_records` table does not exist or contains no matching records, the function will log warnings and skip those categories gracefully.
