create table if not exists public.reminder_delivery_attempts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  channel text not null
    check (channel in ('telegram', 'web_push')),

  local_date date not null,

  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed', 'skipped')),

  attempt_count integer not null default 0
    check (attempt_count >= 0),

  next_attempt_at timestamptz,

  last_error text,

  retryable boolean not null default true,

  lease_token uuid,

  lease_until timestamptz,

  claimed_at timestamptz,

  completed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint reminder_delivery_attempts_unique_day
    unique (user_id, channel, local_date)
);

create index if not exists idx_reminder_delivery_attempts_retry
on public.reminder_delivery_attempts (status, retryable, next_attempt_at);

create index if not exists idx_reminder_delivery_attempts_user_date
on public.reminder_delivery_attempts (user_id, local_date desc);

alter table public.reminder_delivery_attempts enable row level security;

drop policy if exists "Users can select their own reminder delivery attempts"
on public.reminder_delivery_attempts;

create policy "Users can select their own reminder delivery attempts"
on public.reminder_delivery_attempts
for select
to authenticated
using (user_id = auth.uid());

grant select
on public.reminder_delivery_attempts
to authenticated;

create or replace function public.claim_reminder_delivery(
  p_user_id uuid,
  p_channel text,
  p_local_date date,
  p_now timestamptz,
  p_lease_until timestamptz
)
returns table (
  claimed boolean,
  attempt_id uuid,
  attempt_count integer,
  lease_token uuid,
  status text,
  retryable boolean,
  next_attempt_at timestamptz,
  last_error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_attempt public.reminder_delivery_attempts%rowtype;
  new_lease_token uuid;
begin
  if p_channel not in ('telegram', 'web_push') then
    raise exception 'Unsupported reminder delivery channel';
  end if;

  if p_lease_until <= p_now then
    raise exception 'Reminder delivery lease must end after now';
  end if;

  new_lease_token := gen_random_uuid();

  insert into public.reminder_delivery_attempts (
    user_id,
    channel,
    local_date,
    status,
    attempt_count,
    retryable,
    lease_token,
    lease_until,
    claimed_at,
    updated_at
  )
  values (
    p_user_id,
    p_channel,
    p_local_date,
    'processing',
    1,
    true,
    new_lease_token,
    p_lease_until,
    p_now,
    p_now
  )
  on conflict (user_id, channel, local_date) do nothing
  returning
    true,
    id,
    attempt_count,
    lease_token,
    status,
    retryable,
    next_attempt_at,
    last_error
  into
    claimed,
    attempt_id,
    attempt_count,
    lease_token,
    status,
    retryable,
    next_attempt_at,
    last_error;

  if found then
    return next;
  end if;

  select *
  into current_attempt
  from public.reminder_delivery_attempts
  where user_id = p_user_id
    and channel = p_channel
    and local_date = p_local_date
  for update;

  if current_attempt.status = 'sent'
    or current_attempt.status = 'skipped'
    or not current_attempt.retryable
    or (
      current_attempt.status = 'failed'
      and current_attempt.next_attempt_at is not null
      and current_attempt.next_attempt_at > p_now
    )
    or (
      current_attempt.status = 'processing'
      and current_attempt.lease_until is not null
      and current_attempt.lease_until > p_now
    )
  then
    claimed := false;
    attempt_id := current_attempt.id;
    attempt_count := current_attempt.attempt_count;
    lease_token := current_attempt.lease_token;
    status := current_attempt.status;
    retryable := current_attempt.retryable;
    next_attempt_at := current_attempt.next_attempt_at;
    last_error := current_attempt.last_error;
    return next;
  end if;

  new_lease_token := gen_random_uuid();

  update public.reminder_delivery_attempts
  set
    status = 'processing',
    attempt_count = current_attempt.attempt_count + 1,
    next_attempt_at = null,
    lease_token = new_lease_token,
    lease_until = p_lease_until,
    claimed_at = p_now,
    completed_at = null,
    updated_at = p_now
  where id = current_attempt.id
  returning
    true,
    id,
    attempt_count,
    lease_token,
    status,
    retryable,
    next_attempt_at,
    last_error
  into
    claimed,
    attempt_id,
    attempt_count,
    lease_token,
    status,
    retryable,
    next_attempt_at,
    last_error;

  return next;
end;
$$;

create or replace function public.complete_reminder_delivery(
  p_attempt_id uuid,
  p_lease_token uuid,
  p_now timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reminder_delivery_attempts
  set
    status = 'sent',
    retryable = false,
    next_attempt_at = null,
    last_error = null,
    lease_token = null,
    lease_until = null,
    completed_at = p_now,
    updated_at = p_now
  where id = p_attempt_id
    and status = 'processing'
    and lease_token = p_lease_token
    and (lease_until is null or lease_until >= p_now);

  return found;
end;
$$;

create or replace function public.fail_reminder_delivery(
  p_attempt_id uuid,
  p_lease_token uuid,
  p_retryable boolean,
  p_last_error text,
  p_next_attempt_at timestamptz,
  p_now timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reminder_delivery_attempts
  set
    status = 'failed',
    retryable = p_retryable,
    next_attempt_at = case
      when p_retryable then p_next_attempt_at
      else null
    end,
    last_error = nullif(left(coalesce(p_last_error, ''), 2000), ''),
    lease_token = null,
    lease_until = null,
    completed_at = case when p_retryable then null else p_now end,
    updated_at = p_now
  where id = p_attempt_id
    and status = 'processing'
    and lease_token = p_lease_token
    and (lease_until is null or lease_until >= p_now);

  return found;
end;
$$;

grant execute on function public.claim_reminder_delivery(uuid, text, date, timestamptz, timestamptz)
to service_role;

grant execute on function public.complete_reminder_delivery(uuid, uuid, timestamptz)
to service_role;

grant execute on function public.fail_reminder_delivery(uuid, uuid, boolean, text, timestamptz, timestamptz)
to service_role;

revoke execute on function public.claim_reminder_delivery(uuid, text, date, timestamptz, timestamptz)
from public;

revoke execute on function public.complete_reminder_delivery(uuid, uuid, timestamptz)
from public;

revoke execute on function public.fail_reminder_delivery(uuid, uuid, boolean, text, timestamptz, timestamptz)
from public;

alter table public.push_subscriptions
  add column if not exists last_failure_at timestamptz,
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_error text;

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_consecutive_failures_nonnegative;

alter table public.push_subscriptions
  add constraint push_subscriptions_consecutive_failures_nonnegative
  check (consecutive_failures >= 0);
