-- push_subscriptions: Web Push subscription metadata
-- Scope: optional future Web Push support alongside Telegram
-- V1 does not activate Web Push; this table prepares the schema

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  endpoint text not null,

  p256dh text not null,

  auth text not null,

  user_agent text,

  created_at timestamptz not null default now(),

  last_used_at timestamptz,

  constraint push_subscriptions_unique_endpoint
    unique (user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user_id
on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can select their own push subscriptions"
on public.push_subscriptions;

create policy "Users can select their own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own push subscriptions"
on public.push_subscriptions;

create policy "Users can insert their own push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own push subscriptions"
on public.push_subscriptions;

create policy "Users can delete their own push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, delete
on public.push_subscriptions
to authenticated;
