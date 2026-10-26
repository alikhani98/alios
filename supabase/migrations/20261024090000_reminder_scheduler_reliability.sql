-- A3: forward-only reminder delivery safety. Apply only during a coordinated rollout
-- with the old scheduler paused; no historic per-device outcomes can be reconstructed.
begin;

alter table public.reminder_delivery_attempts
  add column targets_initialized boolean not null default false,
  add column dispatch_started_at timestamptz,
  add constraint reminder_attempt_owner_key unique (id, user_id);
alter table public.push_subscriptions
  add constraint push_subscription_owner_key unique (id, user_id);

create table public.reminder_push_delivery_targets (
  id uuid primary key default gen_random_uuid(),
  delivery_attempt_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Preserve the original, non-secret identity even after subscription deletion.
  subscription_key uuid not null,
  subscription_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'retryable_failure', 'permanent_failure', 'unknown')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  next_attempt_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint reminder_target_parent_owner foreign key (delivery_attempt_id, user_id)
    references public.reminder_delivery_attempts(id, user_id) on delete cascade,
  -- PostgreSQL 15+: deletion retains the target's ownership and outcome.
  constraint reminder_target_subscription_owner foreign key (subscription_id, user_id)
    references public.push_subscriptions(id, user_id) on delete set null (subscription_id),
  constraint reminder_target_identity check (subscription_id is null or subscription_id = subscription_key),
  constraint reminder_target_unique unique (delivery_attempt_id, subscription_key),
  constraint reminder_target_lease check (
    (status = 'processing' and lease_token is not null and lease_until is not null and started_at is not null
      and lease_until > started_at and lease_until <= started_at + interval '10 minutes')
    or (status <> 'processing' and lease_token is null and lease_until is null)
  ),
  constraint reminder_target_retry check (
    (status = 'retryable_failure' and next_attempt_at is not null and attempt_count between 1 and 4)
    or (status <> 'retryable_failure' and next_attempt_at is null)
  ),
  constraint reminder_target_completion check (
    (status in ('sent', 'permanent_failure', 'unknown') and completed_at is not null)
    or (status in ('pending', 'processing', 'retryable_failure') and completed_at is null)
  )
);
create index reminder_push_targets_due on public.reminder_push_delivery_targets
  (delivery_attempt_id, next_attempt_at) where status in ('pending', 'retryable_failure');
create index reminder_push_targets_owner on public.reminder_push_delivery_targets(user_id, delivery_attempt_id);
create index reminder_push_targets_subscription on public.reminder_push_delivery_targets(subscription_id, user_id);
create index reminder_delivery_expired_leases on public.reminder_delivery_attempts(lease_until, user_id)
  where status = 'processing';
alter table public.reminder_push_delivery_targets enable row level security;
revoke all on public.reminder_push_delivery_targets from public, anon, authenticated;
grant select on public.reminder_push_delivery_targets to authenticated;
create policy reminder_targets_select_own on public.reminder_push_delivery_targets
  for select to authenticated using (user_id = (select auth.uid()));
-- Mutations are only exposed through the service-role RPCs below.
revoke all on public.reminder_push_delivery_targets from service_role;
grant select on public.reminder_push_delivery_targets to service_role;

-- Already-sent batches remain terminal. Legacy Web Push retries have no snapshot:
-- replaying them could resend a successful device. Preserve their audit logs.
update public.reminder_delivery_attempts
set status = 'failed', retryable = false, next_attempt_at = null,
    lease_token = null, lease_until = null, completed_at = clock_timestamp(),
    last_error = 'legacy_outcome_unknown', updated_at = clock_timestamp()
where (channel = 'web_push' and (status = 'processing' or (status = 'failed' and retryable)))
   or (channel = 'telegram' and status = 'processing')
   or (attempt_count >= 5 and status = 'failed' and retryable);

-- All operations acquire locks in preference -> parent -> target order.
-- Internal helper is not executable by API roles, including service_role.
create function public.lock_reminder_delivery(p_attempt_id uuid, p_lease_token uuid, p_user_id uuid default null)
returns public.reminder_delivery_attempts
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  owner_id uuid;
  pref public.reminder_preferences%rowtype;
  delivery public.reminder_delivery_attempts%rowtype;
begin
  select a.user_id into owner_id from public.reminder_delivery_attempts a where a.id = p_attempt_id;
  if owner_id is null or (p_user_id is not null and p_user_id <> owner_id) then return null; end if;
  select * into pref from public.reminder_preferences p where p.user_id = owner_id for update;
  if not found or not pref.enabled or pref.channel not in ('telegram', 'web_push') then return null; end if;
  select * into delivery from public.reminder_delivery_attempts a where a.id = p_attempt_id for update;
  if delivery.status <> 'processing' or delivery.lease_token is distinct from p_lease_token
     or delivery.lease_until is null or delivery.lease_until <= clock_timestamp()
     or delivery.channel <> pref.channel then return null; end if;
  -- Reference time is for digest calculation; the DB's wall clock fences actual sending.
  if not exists (select 1 from pg_timezone_names where name = pref.timezone) then return null; end if;
  if delivery.local_date <> (clock_timestamp() at time zone pref.timezone)::date
     or (clock_timestamp() at time zone pref.timezone)::time < pref.morning_time then return null; end if;
  return delivery;
end;
$$;
revoke all on function public.lock_reminder_delivery(uuid, uuid, uuid) from public, anon, authenticated, service_role;

create or replace function public.claim_reminder_delivery(
  p_user_id uuid, p_channel text, p_local_date date, p_now timestamptz, p_lease_until timestamptz
)
returns table (
  claimed boolean, attempt_id uuid, attempt_count integer, lease_token uuid,
  status text, retryable boolean, next_attempt_at timestamptz, last_error text
)
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  pref public.reminder_preferences%rowtype;
  delivery public.reminder_delivery_attempts%rowtype;
  wall_time timestamptz;
  expiry timestamptz;
  fresh boolean := false;
  terminal_status text;
begin
  select * into pref from public.reminder_preferences p where p.user_id = p_user_id for update;
  wall_time := clock_timestamp();
  if not found or not pref.enabled or p_channel is null or p_channel not in ('telegram', 'web_push')
     or pref.channel <> p_channel
     or (p_channel = 'telegram' and coalesce(pref.telegram_chat_id, '') !~ '^-?[0-9]+$')
     or not exists (select 1 from pg_timezone_names where name = pref.timezone) then
    return query select false, '00000000-0000-0000-0000-000000000000'::uuid, 0, null::uuid, 'skipped'::text, false, null::timestamptz, null::text;
    return;
  end if;
  expiry := least(p_lease_until, wall_time + interval '10 minutes');
  if p_now is null or p_local_date is null or p_lease_until is null or expiry <= wall_time
     or p_local_date <> (p_now at time zone pref.timezone)::date
     or p_local_date <> (wall_time at time zone pref.timezone)::date
     or (p_now at time zone pref.timezone)::time < pref.morning_time then
    return query select false, '00000000-0000-0000-0000-000000000000'::uuid, 0, null::uuid, 'skipped'::text, false, null::timestamptz, null::text;
    return;
  end if;
  insert into public.reminder_delivery_attempts as a (
    user_id, channel, local_date, status, attempt_count, retryable,
    lease_token, lease_until, claimed_at, updated_at
  ) values (p_user_id, p_channel, p_local_date, 'processing', 1, true, gen_random_uuid(), expiry, wall_time, wall_time)
  on conflict on constraint reminder_delivery_attempts_unique_day do nothing
  returning a.* into delivery;
  fresh := found;
  if not fresh then
    select * into delivery from public.reminder_delivery_attempts a
      where a.user_id = p_user_id and a.channel = p_channel and a.local_date = p_local_date for update;
    if delivery.status in ('sent', 'skipped') or not delivery.retryable
       or (delivery.status = 'failed' and delivery.next_attempt_at > wall_time)
       or (delivery.status = 'processing' and delivery.lease_until > wall_time) then
      return query select false, delivery.id, delivery.attempt_count, delivery.lease_token,
        delivery.status, delivery.retryable, delivery.next_attempt_at, delivery.last_error;
      return;
    end if;
    if delivery.channel = 'web_push' then
      update public.reminder_push_delivery_targets t
      set status = 'unknown', lease_token = null, lease_until = null, next_attempt_at = null,
          completed_at = wall_time, updated_at = wall_time, last_error = 'lease_outcome_unknown'
      where t.delivery_attempt_id = delivery.id and t.status = 'processing';
    end if;
    if delivery.attempt_count >= 5
       -- Only an expired, unresolved processing send has an ambiguous outcome.
       -- A failed/retryable row records a confirmed rejection, even if an older
       -- writer retained its dispatch marker.
       or (delivery.channel = 'telegram' and delivery.status = 'processing'
         and delivery.dispatch_started_at is not null)
       or (delivery.channel = 'web_push' and (
         not delivery.targets_initialized or not exists (
           select 1 from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id
             and t.status in ('pending', 'retryable_failure') and t.attempt_count < 5
         )
       )) then
      update public.reminder_push_delivery_targets t
      set status = 'permanent_failure', next_attempt_at = null, completed_at = wall_time,
        updated_at = wall_time, last_error = 'retry_budget_exhausted'
      where t.delivery_attempt_id = delivery.id and t.status in ('pending', 'retryable_failure');
      terminal_status := case
        when delivery.channel = 'web_push' and delivery.targets_initialized
          and not exists(select 1 from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id) then 'skipped'
        when delivery.channel = 'web_push'
          and exists(select 1 from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id)
          and not exists(select 1 from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id and t.status <> 'sent') then 'sent'
        else 'failed' end;
      update public.reminder_delivery_attempts a set status = terminal_status, retryable = false,
        next_attempt_at = null, lease_token = null, lease_until = null, completed_at = wall_time,
        last_error = case when terminal_status = 'sent' then null else 'exhausted_or_outcome_unknown' end,
        updated_at = wall_time where a.id = delivery.id returning a.* into delivery;
      if terminal_status = 'sent' then
        update public.reminder_preferences set last_sent_local_date = delivery.local_date where user_id = p_user_id;
      end if;
      return query select false, delivery.id, delivery.attempt_count, delivery.lease_token,
        delivery.status, delivery.retryable, delivery.next_attempt_at, delivery.last_error;
      return;
    end if;
    update public.reminder_delivery_attempts a set status = 'processing', attempt_count = a.attempt_count + 1,
      next_attempt_at = null, lease_token = gen_random_uuid(), lease_until = expiry,
      dispatch_started_at = null, claimed_at = wall_time, completed_at = null, updated_at = wall_time
      where a.id = delivery.id returning a.* into delivery;
  end if;
  if fresh and p_channel = 'web_push' then
    insert into public.reminder_push_delivery_targets(delivery_attempt_id, user_id, subscription_key, subscription_id)
      select delivery.id, p_user_id, s.id, s.id from public.push_subscriptions s where s.user_id = p_user_id;
    update public.reminder_delivery_attempts a set targets_initialized = true where a.id = delivery.id;
  end if;
  return query select true, delivery.id, delivery.attempt_count, delivery.lease_token,
    delivery.status, delivery.retryable, delivery.next_attempt_at, delivery.last_error;
  return;
end;
$$;

create function public.begin_telegram_reminder_delivery(p_attempt_id uuid, p_lease_token uuid, p_chat_id text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare delivery public.reminder_delivery_attempts%rowtype;
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token);
  if delivery.id is null or delivery.channel <> 'telegram' or delivery.dispatch_started_at is not null
     or p_chat_id is null or p_chat_id !~ '^-?[0-9]+$'
     or not exists (select 1 from public.reminder_preferences p where p.user_id = delivery.user_id and p.telegram_chat_id = p_chat_id)
     then return false; end if;
  update public.reminder_delivery_attempts set dispatch_started_at = clock_timestamp() where id = delivery.id;
  return true;
end;
$$;

create or replace function public.complete_reminder_delivery(p_attempt_id uuid, p_lease_token uuid, p_now timestamptz)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare delivery public.reminder_delivery_attempts%rowtype;
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token);
  if delivery.id is null or delivery.channel <> 'telegram' or delivery.dispatch_started_at is null then return false; end if;
  update public.reminder_delivery_attempts set status = 'sent', retryable = false,
    next_attempt_at = null, last_error = null, lease_token = null, lease_until = null,
    completed_at = clock_timestamp(), updated_at = clock_timestamp() where id = delivery.id;
  update public.reminder_preferences set last_sent_local_date = delivery.local_date where user_id = delivery.user_id;
  return true;
end;
$$;

create or replace function public.fail_reminder_delivery(
  p_attempt_id uuid, p_lease_token uuid, p_retryable boolean, p_last_error text,
  p_next_attempt_at timestamptz, p_now timestamptz
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  delivery public.reminder_delivery_attempts%rowtype;
  can_retry boolean;
  error_code text;
  wall_time timestamptz := clock_timestamp();
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token);
  wall_time := clock_timestamp();
  if delivery.id is null or delivery.channel <> 'telegram' or delivery.dispatch_started_at is null then return false; end if;
  error_code := case when p_last_error ~ '^telegram_(http_[0-9]{3}|http_invalid|outcome_unknown|pre_dispatch_failure)$'
    then p_last_error else 'provider_failure' end;
  can_retry := coalesce(p_retryable, false) and delivery.attempt_count < 5
    and (error_code ~ '^telegram_http_(429|5[0-9]{2})$' or error_code = 'telegram_pre_dispatch_failure');
  update public.reminder_delivery_attempts set status = 'failed', retryable = can_retry,
    next_attempt_at = case when can_retry then wall_time + (array[5,15,60,360])[delivery.attempt_count] * interval '1 minute' else null end,
    last_error = error_code, lease_token = null, lease_until = null,
    dispatch_started_at = case when can_retry then null else dispatch_started_at end,
    completed_at = case when can_retry then null else wall_time end,
    updated_at = wall_time where id = delivery.id;
  return true;
end;
$$;

create function public.list_reminder_push_targets(p_attempt_id uuid, p_lease_token uuid, p_user_id uuid)
returns table(target_id uuid)
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare delivery public.reminder_delivery_attempts%rowtype;
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token, p_user_id);
  if delivery.id is null or delivery.channel <> 'web_push' then return; end if;
  return query select t.id from public.reminder_push_delivery_targets t
    where t.delivery_attempt_id = delivery.id and t.user_id = p_user_id and t.attempt_count < 5
      and (t.status = 'pending' or (t.status = 'retryable_failure' and t.next_attempt_at <= clock_timestamp()))
    order by t.id;
end;
$$;

create function public.begin_reminder_push_target(p_attempt_id uuid, p_lease_token uuid, p_user_id uuid, p_target_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  delivery public.reminder_delivery_attempts%rowtype;
  target public.reminder_push_delivery_targets%rowtype;
  subscription public.push_subscriptions%rowtype;
  wall_time timestamptz := clock_timestamp();
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token, p_user_id);
  wall_time := clock_timestamp();
  if delivery.id is null or delivery.channel <> 'web_push' then return null; end if;
  select * into target from public.reminder_push_delivery_targets t
    where t.id = p_target_id and t.delivery_attempt_id = delivery.id and t.user_id = p_user_id for update;
  if not found or target.attempt_count >= 5
    or not (target.status = 'pending' or (target.status = 'retryable_failure' and target.next_attempt_at <= wall_time)) then return null; end if;
  select * into subscription from public.push_subscriptions s
    where s.id = target.subscription_id and s.user_id = p_user_id;
  if not found then
    update public.reminder_push_delivery_targets set status = 'permanent_failure',
      next_attempt_at = null, completed_at = wall_time, updated_at = wall_time, last_error = 'subscription_removed'
      where id = target.id;
    return null;
  end if;
  update public.reminder_push_delivery_targets set status = 'processing', attempt_count = attempt_count + 1,
    next_attempt_at = null, lease_token = p_lease_token, lease_until = delivery.lease_until,
    started_at = wall_time, updated_at = wall_time, completed_at = null where id = target.id;
  return jsonb_build_object('endpoint', subscription.endpoint, 'p256dh', subscription.p256dh,
    'auth', subscription.auth, 'user_agent', subscription.user_agent);
end;
$$;

create function public.finish_reminder_push_target(
  p_attempt_id uuid, p_lease_token uuid, p_user_id uuid, p_target_id uuid, p_outcome text, p_http_status integer
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  delivery public.reminder_delivery_attempts%rowtype;
  target public.reminder_push_delivery_targets%rowtype;
  outcome text;
  wall_time timestamptz := clock_timestamp();
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token, p_user_id);
  wall_time := clock_timestamp();
  if delivery.id is null or delivery.channel <> 'web_push' then return false; end if;
  select * into target from public.reminder_push_delivery_targets t
    where t.id = p_target_id and t.delivery_attempt_id = delivery.id and t.user_id = p_user_id for update;
  if not found or target.status <> 'processing' or target.lease_token is distinct from p_lease_token
     or target.lease_until <= wall_time then return false; end if;
  -- Validate status independently of the caller's classification.
  outcome := case
    when p_outcome = 'sent' and p_http_status between 200 and 299 then 'sent'
    when p_http_status in (404, 410) then 'permanent_failure'
    when p_outcome = 'retryable_failure' and p_http_status is null
      then case when target.attempt_count < 5 then 'retryable_failure' else 'permanent_failure' end
    when p_outcome = 'unknown' or p_http_status is null then 'unknown'
    when (p_http_status = 429 or p_http_status between 500 and 599) and target.attempt_count < 5 then 'retryable_failure'
    else 'permanent_failure' end;
  update public.reminder_push_delivery_targets set status = outcome,
    next_attempt_at = case when outcome = 'retryable_failure'
      then wall_time + (array[5,15,60,360])[target.attempt_count] * interval '1 minute' else null end,
    lease_token = null, lease_until = null,
    last_error = case when outcome = 'sent' then null when outcome = 'unknown' then 'web_push_outcome_unknown'
      when p_outcome = 'retryable_failure' and p_http_status is null then 'web_push_pre_dispatch_failure'
      when p_http_status between 100 and 599 then 'web_push_http_' || p_http_status::text else 'web_push_http_invalid' end,
    completed_at = case when outcome = 'retryable_failure' then null else wall_time end,
    updated_at = wall_time where id = target.id;
  if outcome = 'sent' then
    update public.push_subscriptions set last_used_at = wall_time, consecutive_failures = 0,
      last_failure_at = null, last_error = null where id = target.subscription_id and user_id = p_user_id;
  elsif p_http_status in (404, 410) then
    delete from public.push_subscriptions where id = target.subscription_id and user_id = p_user_id;
  else
    update public.push_subscriptions set last_failure_at = wall_time,
      consecutive_failures = least(consecutive_failures, 2147483646) + 1,
      last_error = case when outcome = 'unknown' then 'web_push_outcome_unknown' else 'web_push_provider_failure' end
      where id = target.subscription_id and user_id = p_user_id;
  end if;
  return true;
end;
$$;

create function public.finalize_reminder_push_delivery(p_attempt_id uuid, p_lease_token uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  delivery public.reminder_delivery_attempts%rowtype;
  total integer; successes integer; failures integer; unknowns integer; pending integer;
  next_retry timestamptz; final_status text; outcome text;
  wall_time timestamptz := clock_timestamp();
begin
  delivery := public.lock_reminder_delivery(p_attempt_id, p_lease_token);
  wall_time := clock_timestamp();
  if delivery.id is null or delivery.channel <> 'web_push' or not delivery.targets_initialized then
    return jsonb_build_object('recorded', false);
  end if;
  -- An interrupted sender cannot establish outcomes for its in-flight targets.
  update public.reminder_push_delivery_targets set status = 'unknown', lease_token = null,
    lease_until = null, next_attempt_at = null, completed_at = wall_time,
    updated_at = wall_time, last_error = 'web_push_outcome_unknown'
    where delivery_attempt_id = delivery.id and status = 'processing';
  -- The parent budget also bounds crash recovery of targets never started.
  if delivery.attempt_count >= 5 then
    update public.reminder_push_delivery_targets set status = 'permanent_failure',
      next_attempt_at = null, completed_at = wall_time, updated_at = wall_time, last_error = 'retry_budget_exhausted'
      where delivery_attempt_id = delivery.id and status in ('pending', 'retryable_failure');
  end if;
  select count(*), count(*) filter (where t.status = 'sent'),
    count(*) filter (where t.status = 'permanent_failure'), count(*) filter (where t.status = 'unknown'),
    count(*) filter (where t.status in ('pending', 'retryable_failure')),
    min(coalesce(t.next_attempt_at, wall_time + interval '5 minutes')) filter (where t.status in ('pending', 'retryable_failure'))
    into total, successes, failures, unknowns, pending, next_retry
    from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id;
  final_status := case when total = 0 then 'skipped' when successes = total then 'sent' else 'failed' end;
  outcome := case when total = 0 then 'no_targets' when successes = total then 'sent'
    when successes > 0 then 'partial' when unknowns > 0 then 'unknown' else 'failed' end;
  update public.reminder_delivery_attempts set status = final_status, retryable = pending > 0,
    next_attempt_at = next_retry, lease_token = null, lease_until = null,
    last_error = case when final_status = 'sent' then null else 'web_push_batch_' || outcome end,
    completed_at = case when pending > 0 then null else wall_time end, updated_at = wall_time where id = delivery.id;
  if final_status = 'sent' then
    update public.reminder_preferences set last_sent_local_date = delivery.local_date where user_id = delivery.user_id;
  end if;
  return jsonb_build_object('recorded', true, 'status', final_status, 'outcome', outcome,
    'success_count', successes, 'failure_count', failures, 'unknown_count', unknowns, 'pending_count', pending);
end;
$$;

-- A selection change is a cancellation, even if the user switches back later.
-- This trigger also covers direct RLS-authorized preference writes and deletions.
create function public.cancel_unselected_reminder_deliveries()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $$
declare owner_id uuid; wall_time timestamptz := clock_timestamp();
begin
  owner_id := old.user_id;
  if tg_op = 'UPDATE' then
    if new.enabled is not distinct from old.enabled
      and new.channel is not distinct from old.channel
      and new.telegram_chat_id is not distinct from old.telegram_chat_id then return new; end if;
  end if;
  -- Parent locks precede target locks, matching every scheduler RPC.
  perform 1 from public.reminder_delivery_attempts a
    where a.user_id = owner_id and (a.status = 'processing' or (a.status = 'failed' and a.retryable)) order by a.id for update;
  update public.reminder_push_delivery_targets t
  set status = case when t.status = 'processing' then 'unknown' else 'permanent_failure' end,
    next_attempt_at = null, lease_token = null, lease_until = null,
    completed_at = wall_time, updated_at = wall_time, last_error = 'preference_changed'
  where t.user_id = owner_id and t.status in ('pending', 'processing', 'retryable_failure');
  update public.reminder_delivery_attempts a set status = 'skipped', retryable = false,
    next_attempt_at = null, lease_token = null, lease_until = null,
    completed_at = wall_time, updated_at = wall_time, last_error = 'preference_changed'
    where a.user_id = owner_id and (a.status = 'processing' or (a.status = 'failed' and a.retryable));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger cancel_unselected_reminder_deliveries
  before update or delete on public.reminder_preferences
  for each row execute function public.cancel_unselected_reminder_deliveries();
revoke all on function public.cancel_unselected_reminder_deliveries() from public, anon, authenticated, service_role;

-- CREATE OR REPLACE retains old grants: revoke explicitly on every public RPC.
revoke all on function public.claim_reminder_delivery(uuid,text,date,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.complete_reminder_delivery(uuid,uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.fail_reminder_delivery(uuid,uuid,boolean,text,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.begin_telegram_reminder_delivery(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.list_reminder_push_targets(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.begin_reminder_push_target(uuid,uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.finish_reminder_push_target(uuid,uuid,uuid,uuid,text,integer) from public, anon, authenticated;
revoke all on function public.finalize_reminder_push_delivery(uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_reminder_delivery(uuid,text,date,timestamptz,timestamptz) to service_role;
grant execute on function public.complete_reminder_delivery(uuid,uuid,timestamptz) to service_role;
grant execute on function public.fail_reminder_delivery(uuid,uuid,boolean,text,timestamptz,timestamptz) to service_role;
grant execute on function public.begin_telegram_reminder_delivery(uuid,uuid,text) to service_role;
grant execute on function public.list_reminder_push_targets(uuid,uuid,uuid) to service_role;
grant execute on function public.begin_reminder_push_target(uuid,uuid,uuid,uuid) to service_role;
grant execute on function public.finish_reminder_push_target(uuid,uuid,uuid,uuid,text,integer) to service_role;
grant execute on function public.finalize_reminder_push_delivery(uuid,uuid) to service_role;


-- Called before preference enumeration, so disabled users and old local dates are
-- reconciled too. It never starts a send. Duplicate calls are harmless.
create function public.expire_reminder_delivery_leases()
returns integer language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  candidate record;
  pref public.reminder_preferences%rowtype;
  delivery public.reminder_delivery_attempts%rowtype;
  wall_time timestamptz;
  total integer; successes integer; pending integer;
  can_retry boolean;
  final_status text;
  reconciled integer := 0;
begin
  for candidate in
    select a.id, a.user_id from public.reminder_delivery_attempts a
    where a.status = 'processing' and (a.lease_until is null or a.lease_until <= clock_timestamp())
    order by a.user_id, a.id
  loop
    select * into pref from public.reminder_preferences p where p.user_id = candidate.user_id for update;
    select * into delivery from public.reminder_delivery_attempts a where a.id = candidate.id for update;
    wall_time := clock_timestamp();
    if delivery.status <> 'processing' or delivery.lease_until > wall_time then continue; end if;
    can_retry := coalesce(pref.enabled and pref.channel = delivery.channel, false)
      and delivery.attempt_count < 5;
    if can_retry then
      if exists (select 1 from pg_timezone_names where name = pref.timezone) then
        can_retry := delivery.local_date = (wall_time at time zone pref.timezone)::date;
      else can_retry := false;
      end if;
    end if;
    if delivery.channel = 'web_push' then
      update public.reminder_push_delivery_targets set status = 'unknown', lease_token = null,
        lease_until = null, next_attempt_at = null, completed_at = wall_time,
        updated_at = wall_time, last_error = 'lease_outcome_unknown'
        where delivery_attempt_id = delivery.id and status = 'processing';
      if not can_retry then
        update public.reminder_push_delivery_targets set status = 'permanent_failure',
          next_attempt_at = null, completed_at = wall_time, updated_at = wall_time, last_error = 'retry_window_closed'
          where delivery_attempt_id = delivery.id and status in ('pending', 'retryable_failure');
      end if;
      select count(*), count(*) filter (where t.status = 'sent'),
        count(*) filter (where t.status in ('pending', 'retryable_failure'))
        into total, successes, pending from public.reminder_push_delivery_targets t where t.delivery_attempt_id = delivery.id;
      can_retry := can_retry and pending > 0;
      final_status := case when delivery.targets_initialized and total = 0 then 'skipped'
        when total > 0 and successes = total then 'sent' else 'failed' end;
    else
      can_retry := can_retry and delivery.dispatch_started_at is null;
      final_status := 'failed';
    end if;
    update public.reminder_delivery_attempts set status = final_status, retryable = can_retry,
      next_attempt_at = case when can_retry then wall_time +
        (array[5,15,60,360])[delivery.attempt_count] * interval '1 minute' else null end,
      lease_token = null, lease_until = null, completed_at = case when can_retry then null else wall_time end,
      updated_at = wall_time, last_error = case when final_status = 'sent' then null else 'lease_expired_or_outcome_unknown' end
      where id = delivery.id;
    if final_status = 'sent' then
      update public.reminder_preferences set last_sent_local_date = delivery.local_date
        where user_id = delivery.user_id and enabled and channel = delivery.channel;
    end if;
    reconciled := reconciled + 1;
  end loop;
  return reconciled;
end;
$$;
revoke all on function public.expire_reminder_delivery_leases() from public, anon, authenticated;
grant execute on function public.expire_reminder_delivery_leases() to service_role;

commit;
