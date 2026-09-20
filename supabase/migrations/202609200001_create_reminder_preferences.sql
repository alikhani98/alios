create table if not exists public.reminder_preferences (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  enabled boolean not null default false,

  channel text not null default 'telegram'
    check (channel = 'telegram'),

  telegram_chat_id text,

  timezone text not null default 'UTC',

  morning_time time without time zone not null default time '08:00:00',

  last_sent_local_date date,

  updated_at timestamptz not null default now(),

  constraint reminder_preferences_chat_id_format
    check (
      telegram_chat_id is null
      or telegram_chat_id ~ '^-?[0-9]+$'
    )
);

create or replace function public.set_reminder_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reminder_preferences_updated_at
on public.reminder_preferences;

create trigger set_reminder_preferences_updated_at
before update on public.reminder_preferences
for each row
execute function public.set_reminder_preferences_updated_at();

alter table public.reminder_preferences enable row level security;

drop policy if exists "Users can select their own reminder preferences"
on public.reminder_preferences;

create policy "Users can select their own reminder preferences"
on public.reminder_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own reminder preferences"
on public.reminder_preferences;

create policy "Users can insert their own reminder preferences"
on public.reminder_preferences
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own reminder preferences"
on public.reminder_preferences;

create policy "Users can update their own reminder preferences"
on public.reminder_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own reminder preferences"
on public.reminder_preferences;

create policy "Users can delete their own reminder preferences"
on public.reminder_preferences
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete
on public.reminder_preferences
to authenticated;
