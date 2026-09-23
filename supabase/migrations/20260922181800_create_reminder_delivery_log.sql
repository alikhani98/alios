-- reminder_delivery_log: audit log for sent reminders
-- Scope: track when reminders were sent, to which channel, and delivery status
-- Supports Telegram (v1) and future Web Push (optional)

create table if not exists public.reminder_delivery_log (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  channel text not null
    check (channel in ('telegram', 'web_push')),

  category text not null
    check (category in ('task_due', 'finance_obligation')),

  item_count int not null default 0
    check (item_count >= 0),

  sent_at timestamptz not null default now(),

  local_date date not null,

  status text not null default 'sent'
    check (status in ('sent', 'failed', 'skipped')),

  error_message text,

  metadata jsonb
);

create index if not exists idx_reminder_delivery_log_user_id
on public.reminder_delivery_log (user_id);

create index if not exists idx_reminder_delivery_log_local_date
on public.reminder_delivery_log (user_id, local_date desc);

create index if not exists idx_reminder_delivery_log_sent_at
on public.reminder_delivery_log (sent_at desc);

alter table public.reminder_delivery_log enable row level security;

drop policy if exists "Users can select their own reminder delivery log"
on public.reminder_delivery_log;

create policy "Users can select their own reminder delivery log"
on public.reminder_delivery_log
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Service role can insert reminder delivery log"
on public.reminder_delivery_log;

create policy "Service role can insert reminder delivery log"
on public.reminder_delivery_log
for insert
to service_role
with check (true);

grant select
on public.reminder_delivery_log
to authenticated;

grant insert
on public.reminder_delivery_log
to service_role;
