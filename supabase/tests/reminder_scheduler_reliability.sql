-- Owner-run only against a disposable LOCAL Supabase database after the A3 migration.
-- No provider requests, network extensions, real data, or test notifications.
-- Fixture changes roll back. Timers are advanced by editing fixture state, never sleeping.
\set ON_ERROR_STOP on
begin;
create function pg_temp.a3_assert(condition boolean, message text)
returns void language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'A3 regression: %', message; end if;
end;
$$;
do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  subscription_a uuid := gen_random_uuid();
  subscription_b uuid := gen_random_uuid();
  subscription_other uuid := gen_random_uuid();
  delivery record;
  denied record;
  target_a uuid;
  target_b uuid;
  result jsonb;
  reference_time timestamptz;
  zone text := case when extract(hour from clock_timestamp() at time zone 'UTC') between 2 and 21
    then 'UTC' else 'Etc/GMT-6' end;
  local_day date;
  procedure_name text;
begin
  reference_time := clock_timestamp();
  local_day := (reference_time at time zone zone)::date;
  insert into auth.users(id) values (user_a), (user_b);
  insert into public.reminder_preferences(user_id, enabled, channel, timezone, morning_time, telegram_chat_id)
    values (user_a, true, 'web_push', zone, '00:00:00', null),
           (user_b, true, 'web_push', zone, '00:00:00', null);
  insert into public.push_subscriptions(id,user_id,endpoint,p256dh,auth)
    values (subscription_a,user_a,'https://push.example.test/a','fake','fake'),
           (subscription_b,user_a,'https://push.example.test/b','fake','fake'),
           (subscription_other,user_b,'https://push.example.test/other','fake','fake');

  select * into delivery from public.claim_reminder_delivery(user_a,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed, 'initial claim');
  perform pg_temp.a3_assert((select count(*) = 2 from public.reminder_push_delivery_targets where delivery_attempt_id = delivery.attempt_id), 'snapshot excludes another account');
  select id into target_a from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id and subscription_key=subscription_a;
  select id into target_b from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id and subscription_key=subscription_b;
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_a) is null, 'cross-user begin denied');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,gen_random_uuid(),user_a,target_a) is null, 'wrong lease denied');
  begin
    insert into public.reminder_push_delivery_targets(delivery_attempt_id,user_id,subscription_key,subscription_id)
      values(delivery.attempt_id,user_a,subscription_other,subscription_other);
    raise exception 'A3 regression: cross-user subscription FK accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.reminder_push_delivery_targets(delivery_attempt_id,user_id,subscription_key,subscription_id)
      values(delivery.attempt_id,user_b,subscription_other,subscription_other);
    raise exception 'A3 regression: cross-user parent FK accepted';
  exception when foreign_key_violation then null;
  end;

  -- Actual RLS checks, not an emulated policy.
  perform set_config('request.jwt.claim.sub',user_b::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.reminder_push_delivery_targets) then raise exception 'A3 regression: RLS exposes user A targets to B'; end if;
  begin
    update public.reminder_push_delivery_targets set status='sent';
    raise exception 'A3 regression: authenticated mutation accepted';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',user_a::text,true);
  execute 'set local role authenticated';
  if (select count(*) from public.reminder_push_delivery_targets) <> 2 then raise exception 'A3 regression: RLS hides own target reads'; end if;
  execute 'reset role';

  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_a) is not null, 'begin device A');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_a) is null, 'duplicate begin fenced');
  perform pg_temp.a3_assert(public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_a,'sent',201), 'record device A success');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_b) is not null, 'begin device B');
  perform pg_temp.a3_assert(public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_b,'retryable_failure',503), 'record device B failure');
  result := public.finalize_reminder_push_delivery(delivery.attempt_id,delivery.lease_token);
  perform pg_temp.a3_assert(result->>'status' = 'failed' and result->>'outcome'='partial', 'partial is not complete success');
  perform pg_temp.a3_assert((select next_attempt_at > clock_timestamp()+interval '4 minutes' and next_attempt_at <= clock_timestamp()+interval '5 minutes'
    from public.reminder_delivery_attempts where id=delivery.attempt_id), 'five-minute first retry');
  insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values(user_a,'https://push.example.test/new','fake','fake');
  perform pg_temp.a3_assert((select count(*)=2 from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id), 'new device not appended');
  reference_time := clock_timestamp();
  select * into denied from public.claim_reminder_delivery(user_a,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'backoff respected');
  update public.reminder_delivery_attempts set next_attempt_at=clock_timestamp()-interval '1 second' where id=delivery.attempt_id;
  update public.reminder_push_delivery_targets set next_attempt_at=clock_timestamp()-interval '1 second' where id=target_b;
  select * into delivery from public.claim_reminder_delivery(user_a,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=2, 'retry claims same parent');
  perform pg_temp.a3_assert((select count(*)=1 from public.list_reminder_push_targets(delivery.attempt_id,delivery.lease_token,user_a)), 'only failed target selected');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_a) is null, 'successful device never resent');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_b) is not null, 'failed device can retry');
  perform public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_a,target_b,'sent',201);
  result := public.finalize_reminder_push_delivery(delivery.attempt_id,delivery.lease_token);
  perform pg_temp.a3_assert(result->>'status'='sent' and (result->>'success_count')::integer=2, 'all devices complete');
  select * into denied from public.claim_reminder_delivery(user_a,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'repeated completed batch suppressed');

  -- A crash after all durable device successes can recover without another send.
  select * into delivery from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  select id into target_b from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id;
  perform public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b);
  perform public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b,'sent',201);
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  select * into denied from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and denied.status='sent', 'all-sent crash reconciles without replay');

  -- An in-flight device after crash is unknown; no automatic same-day resend.
  delete from public.reminder_delivery_attempts where user_id=user_b;
  select * into delivery from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  select id into target_b from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id;
  perform public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b);
  update public.reminder_push_delivery_targets set started_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=target_b;
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  perform public.expire_reminder_delivery_leases();
  perform pg_temp.a3_assert((select status='unknown' from public.reminder_push_delivery_targets where id=target_b), 'crash becomes unknown');
  perform pg_temp.a3_assert(not public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b,'sent',201), 'stale completion rejected');
  select * into denied from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'unknown does not retry');

  -- A fifth expired parent cannot restart or leave pending targets retryable.
  delete from public.reminder_delivery_attempts where user_id=user_b;
  select * into delivery from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  update public.reminder_delivery_attempts set attempt_count=5, claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  perform public.expire_reminder_delivery_leases();
  select * into denied from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=5, 'expired leases do not evade five-attempt budget');
  perform pg_temp.a3_assert(not exists(select 1 from public.reminder_push_delivery_targets
    where delivery_attempt_id=delivery.attempt_id and status in ('pending','retryable_failure','processing')), 'exhausted targets are terminal');

  -- 410 removes only B's subscription, but is a delivery failure.
  delete from public.reminder_delivery_attempts where user_id=user_b;
  select * into delivery from public.claim_reminder_delivery(user_b,'web_push',local_day,reference_time,reference_time+interval '10 minutes');
  select id into target_b from public.reminder_push_delivery_targets where delivery_attempt_id=delivery.attempt_id;
  perform public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b);
  perform public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,user_b,target_b,'sent',410);
  result := public.finalize_reminder_push_delivery(delivery.attempt_id,delivery.lease_token);
  perform pg_temp.a3_assert(result->>'status'='failed' and (result->>'success_count')::integer=0, '410 cannot be called sent');
  perform pg_temp.a3_assert(not exists(select 1 from public.push_subscriptions where id=subscription_other), 'expired B device removed');
  perform pg_temp.a3_assert(exists(select 1 from public.push_subscriptions where id=subscription_a), 'A device unaffected');

  -- Telegram preserves known-failure retries, while channel changes cancel them.
  delete from public.reminder_delivery_attempts where user_id=user_b;
  update public.reminder_preferences set channel='telegram',telegram_chat_id='456' where user_id=user_b;
  select * into delivery from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'456'), 'Telegram dispatch authorized');
  perform public.fail_reminder_delivery(delivery.attempt_id,delivery.lease_token,true,'telegram_http_503',null,reference_time);
  perform pg_temp.a3_assert((select retryable from public.reminder_delivery_attempts where id=delivery.attempt_id), 'known Telegram 503 retryable');
  update public.reminder_delivery_attempts set next_attempt_at=clock_timestamp()-interval '1 second' where id=delivery.attempt_id;
  select * into delivery from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=2, 'confirmed Telegram 503 can acquire attempt two');
  perform pg_temp.a3_assert(public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'456'), 'confirmed Telegram retry can dispatch');
  perform public.fail_reminder_delivery(delivery.attempt_id,delivery.lease_token,true,'telegram_pre_dispatch_failure',null,reference_time);
  perform pg_temp.a3_assert((select retryable and next_attempt_at > clock_timestamp()+interval '14 minutes'
    from public.reminder_delivery_attempts where id=delivery.attempt_id), 'pre-dispatch failure uses second backoff');
  update public.reminder_preferences set channel='web_push' where user_id=user_b;
  perform pg_temp.a3_assert((select status='skipped' and not retryable from public.reminder_delivery_attempts where id=delivery.attempt_id), 'channel switch cancels old retry');
  update public.reminder_preferences set channel='telegram' where user_id=user_b;
  select * into denied from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'switching back does not resurrect canceled retry');

  delete from public.reminder_delivery_attempts where user_id=user_b;
  select * into delivery from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'456');
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  perform public.expire_reminder_delivery_leases();
  perform pg_temp.a3_assert((select not retryable and status='failed' from public.reminder_delivery_attempts where id=delivery.attempt_id), 'ambiguous Telegram crash not replayed');

  -- Disabled and unsupported selections are denied by the DB as well as JS.
  delete from public.reminder_delivery_attempts where user_id=user_b;
  update public.reminder_preferences set enabled=false where user_id=user_b;
  select * into denied from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'disabled preference denied');
  update public.reminder_preferences set enabled=true,channel='both' where user_id=user_b;
  select * into denied from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'legacy both denied');
  update public.reminder_preferences set channel='telegram',telegram_chat_id=null where user_id=user_b;
  select * into denied from public.claim_reminder_delivery(user_b,'telegram',local_day,reference_time,reference_time+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed, 'missing Telegram chat denied');

  -- RPC grants and the internal helper are checked against actual catalog ACLs.
  foreach procedure_name in array array[
    'public.claim_reminder_delivery(uuid,text,date,timestamptz,timestamptz)',
    'public.complete_reminder_delivery(uuid,uuid,timestamptz)',
    'public.fail_reminder_delivery(uuid,uuid,boolean,text,timestamptz,timestamptz)',
    'public.begin_telegram_reminder_delivery(uuid,uuid,text)',
    'public.list_reminder_push_targets(uuid,uuid,uuid)',
    'public.begin_reminder_push_target(uuid,uuid,uuid,uuid)',
    'public.finish_reminder_push_target(uuid,uuid,uuid,uuid,text,integer)',
    'public.finalize_reminder_push_delivery(uuid,uuid)',
    'public.expire_reminder_delivery_leases()'
  ] loop
    perform pg_temp.a3_assert(not has_function_privilege('anon',procedure_name,'EXECUTE'), 'anon cannot execute '||procedure_name);
    perform pg_temp.a3_assert(not has_function_privilege('authenticated',procedure_name,'EXECUTE'), 'user cannot execute '||procedure_name);
    perform pg_temp.a3_assert(has_function_privilege('service_role',procedure_name,'EXECUTE'), 'service RPC grant '||procedure_name);
  end loop;
  perform pg_temp.a3_assert(not has_function_privilege('service_role','public.lock_reminder_delivery(uuid,uuid,uuid)','EXECUTE'), 'internal helper not exposed');
end;
$$;

-- Known rejection and ambiguous in-flight state are intentionally different.
-- Fresh fixtures keep the complete 1..5 budgets independent of the earlier cases.
do $$
declare
  telegram_user uuid := gen_random_uuid();
  push_user uuid := gen_random_uuid();
  push_subscription uuid := gen_random_uuid();
  second_subscription uuid := gen_random_uuid();
  zone text := case when extract(hour from clock_timestamp() at time zone 'UTC') between 2 and 21
    then 'UTC' else 'Etc/GMT-6' end;
  local_day date := (clock_timestamp() at time zone zone)::date;
  delivery record;
  denied record;
  target_id uuid;
  second_target uuid;
  old_lease uuid;
  attempt_number integer;
  delay_minutes integer;
  failure_code text;
  before_failure timestamptz;
  after_failure timestamptz;
  result jsonb;
begin
  insert into auth.users(id) values (telegram_user), (push_user);
  insert into public.reminder_preferences(user_id,enabled,channel,telegram_chat_id,timezone,morning_time)
    values (telegram_user,true,'telegram','789',zone,'00:00:00'),
           (push_user,true,'web_push',null,zone,'00:00:00');
  insert into public.push_subscriptions(id,user_id,endpoint,p256dh,auth)
    values(push_subscription,push_user,'https://push.example.test/retry-budget','fake','fake');

  for attempt_number in 1..5 loop
    select * into delivery from public.claim_reminder_delivery(
      telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
    perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=attempt_number
      and delivery.status='processing', 'Telegram acquires expected attempt '||attempt_number);
    perform pg_temp.a3_assert((select dispatch_started_at is null and next_attempt_at is null
      from public.reminder_delivery_attempts where id=delivery.attempt_id), 'Telegram new claim resets per-attempt state');
    if old_lease is not null then
      perform pg_temp.a3_assert(delivery.lease_token <> old_lease, 'Telegram lease rotates');
      perform pg_temp.a3_assert(not public.begin_telegram_reminder_delivery(delivery.attempt_id,old_lease,'789'), 'old Telegram lease cannot begin new attempt');
      perform pg_temp.a3_assert(not public.complete_reminder_delivery(delivery.attempt_id,old_lease,clock_timestamp()), 'old Telegram lease cannot complete new attempt');
      perform pg_temp.a3_assert(not public.fail_reminder_delivery(delivery.attempt_id,old_lease,true,'telegram_http_503',null,clock_timestamp()), 'old Telegram lease cannot fail new attempt');
    end if;
    perform pg_temp.a3_assert(public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789'), 'Telegram retry begins');
    perform pg_temp.a3_assert(not public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789'), 'Telegram same-attempt duplicate begin denied');
    failure_code := case when attempt_number=2 then 'telegram_http_429'
      when attempt_number=3 then 'telegram_http_502' else 'telegram_http_503' end;
    before_failure := clock_timestamp();
    perform pg_temp.a3_assert(public.fail_reminder_delivery(delivery.attempt_id,delivery.lease_token,
      true,failure_code,null,clock_timestamp()), 'Telegram known rejection recorded');
    after_failure := clock_timestamp();
    if attempt_number < 5 then
      delay_minutes := (array[5,15,60,360])[attempt_number];
      perform pg_temp.a3_assert((select status='failed' and retryable
        and dispatch_started_at is null and lease_token is null and lease_until is null
        and completed_at is null and last_error=failure_code
        and next_attempt_at between before_failure+delay_minutes*interval '1 minute'
          and after_failure+delay_minutes*interval '1 minute'
        from public.reminder_delivery_attempts where id=delivery.attempt_id), 'Telegram known rejection preserves bounded backoff');
      select * into denied from public.claim_reminder_delivery(
        telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
      perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=attempt_number, 'Telegram cannot bypass backoff');
      -- Model an older writer retaining a marker after a confirmed 503. The
      -- failed/retryable state must still be claimable, unlike processing.
      update public.reminder_delivery_attempts
        set next_attempt_at=clock_timestamp()-interval '1 second',
            dispatch_started_at=case when attempt_number=1 then before_failure else dispatch_started_at end
        where id=delivery.attempt_id;
    else
      perform pg_temp.a3_assert((select status='failed' and not retryable
        and next_attempt_at is null and completed_at is not null
        from public.reminder_delivery_attempts where id=delivery.attempt_id), 'Telegram fifth rejection exhausts budget');
      select * into denied from public.claim_reminder_delivery(
        telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
      perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=5, 'Telegram attempt six denied');
    end if;
    old_lease := delivery.lease_token;
  end loop;

  -- A confirmed 503 can subsequently succeed, despite legacy last-sent metadata.
  delete from public.reminder_delivery_attempts where user_id=telegram_user;
  update public.reminder_preferences set last_sent_local_date=local_day where user_id=telegram_user;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789');
  perform public.fail_reminder_delivery(delivery.attempt_id,delivery.lease_token,true,'telegram_http_503',null,clock_timestamp());
  update public.reminder_delivery_attempts set next_attempt_at=clock_timestamp()-interval '1 second' where id=delivery.attempt_id;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=2, 'Telegram 503 retry acquired for success');
  perform pg_temp.a3_assert(public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789'), 'Telegram 503 retry dispatch authorized');
  perform pg_temp.a3_assert(public.complete_reminder_delivery(delivery.attempt_id,delivery.lease_token,clock_timestamp()), 'Telegram 503 retry completed');
  perform pg_temp.a3_assert((select status='sent' and not retryable from public.reminder_delivery_attempts where id=delivery.attempt_id), 'Telegram retry success terminal');

  -- Explicit unknown ignores a caller's retry request and stays terminal.
  delete from public.reminder_delivery_attempts where user_id=telegram_user;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789');
  perform pg_temp.a3_assert(public.fail_reminder_delivery(delivery.attempt_id,delivery.lease_token,
    true,'telegram_outcome_unknown',null,clock_timestamp()), 'Telegram unknown recorded');
  select * into denied from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and not denied.retryable and denied.last_error='telegram_outcome_unknown', 'Telegram unknown cannot retry');

  -- Expired processing with a dispatch marker is ambiguous, not a known failure.
  delete from public.reminder_delivery_attempts where user_id=telegram_user;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform public.begin_telegram_reminder_delivery(delivery.attempt_id,delivery.lease_token,'789');
  old_lease := delivery.lease_token;
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  select * into denied from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and not denied.retryable and denied.status='failed', 'Telegram expired in-flight send not reclaimed');
  perform pg_temp.a3_assert(not public.complete_reminder_delivery(delivery.attempt_id,old_lease,clock_timestamp()), 'Telegram expired lease cannot complete');
  perform pg_temp.a3_assert(not public.fail_reminder_delivery(delivery.attempt_id,old_lease,true,'telegram_http_503',null,clock_timestamp()), 'Telegram stale lease cannot reclassify unknown as retryable');

  -- A never-dispatched expired claim can safely retry, but not exceed five claims.
  delete from public.reminder_delivery_attempts where user_id=telegram_user;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  old_lease := delivery.lease_token;
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  select * into delivery from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=2 and delivery.lease_token<>old_lease, 'Telegram expired undispatched claim safely rotates lease');
  perform pg_temp.a3_assert(not public.begin_telegram_reminder_delivery(delivery.attempt_id,old_lease,'789'), 'Telegram pre-dispatch old lease fenced');
  update public.reminder_delivery_attempts set attempt_count=5, claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  select * into denied from public.claim_reminder_delivery(
    telegram_user,'telegram',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=5 and not denied.retryable, 'Telegram expired undispatched fifth claim is exhausted');

  old_lease := null;
  for attempt_number in 1..5 loop
    select * into delivery from public.claim_reminder_delivery(
      push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
    perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=attempt_number
      and delivery.status='processing', 'Web Push acquires expected known-failure retry');
    select id into target_id from public.reminder_push_delivery_targets
      where delivery_attempt_id=delivery.attempt_id and subscription_key=push_subscription;
    if old_lease is not null then
      perform pg_temp.a3_assert(delivery.lease_token<>old_lease, 'Web Push parent lease rotates');
      perform pg_temp.a3_assert(not public.finish_reminder_push_target(
        delivery.attempt_id,old_lease,push_user,target_id,'sent',201), 'Web Push old lease cannot overwrite next attempt');
    end if;
    perform pg_temp.a3_assert(public.begin_reminder_push_target(
      delivery.attempt_id,delivery.lease_token,push_user,target_id) is not null, 'Web Push known failure can dispatch next attempt');
    before_failure := clock_timestamp();
    perform pg_temp.a3_assert(public.finish_reminder_push_target(
      delivery.attempt_id,delivery.lease_token,push_user,target_id,'retryable_failure',503), 'Web Push known 503 recorded');
    after_failure := clock_timestamp();
    result := public.finalize_reminder_push_delivery(delivery.attempt_id,delivery.lease_token);
    perform pg_temp.a3_assert(result->>'status'='failed'
      and (result->>'success_count')::integer=0, 'Web Push rejection never sent');
    if attempt_number < 5 then
      delay_minutes := (array[5,15,60,360])[attempt_number];
      perform pg_temp.a3_assert((select status='retryable_failure' and attempt_count=attempt_number
        and lease_token is null and lease_until is null and completed_at is null
        and next_attempt_at between before_failure+delay_minutes*interval '1 minute'
          and after_failure+delay_minutes*interval '1 minute'
        from public.reminder_push_delivery_targets where id=target_id), 'Web Push target preserves bounded backoff');
      perform pg_temp.a3_assert((select a.retryable and a.next_attempt_at=t.next_attempt_at
        from public.reminder_delivery_attempts a join public.reminder_push_delivery_targets t
          on t.delivery_attempt_id=a.id where a.id=delivery.attempt_id), 'Web Push parent follows target retry state');
      select * into denied from public.claim_reminder_delivery(
        push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
      perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=attempt_number, 'Web Push early retry denied');
      update public.reminder_delivery_attempts set next_attempt_at=clock_timestamp()-interval '1 second' where id=delivery.attempt_id;
      update public.reminder_push_delivery_targets set next_attempt_at=clock_timestamp()-interval '1 second' where id=target_id;
    else
      perform pg_temp.a3_assert((select status='permanent_failure' and attempt_count=5
        and next_attempt_at is null and completed_at is not null
        from public.reminder_push_delivery_targets where id=target_id), 'Web Push fifth target rejection terminal');
      select * into denied from public.claim_reminder_delivery(
        push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
      perform pg_temp.a3_assert(not denied.claimed and denied.attempt_count=5 and not denied.retryable, 'Web Push attempt six denied');
    end if;
    old_lease := delivery.lease_token;
  end loop;

  -- Recover untouched work without replaying an ambiguous in-flight device.
  delete from public.reminder_delivery_attempts where user_id=push_user;
  insert into public.push_subscriptions(id,user_id,endpoint,p256dh,auth)
    values(second_subscription,push_user,'https://push.example.test/untouched','fake','fake');
  select * into delivery from public.claim_reminder_delivery(
    push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  select id into target_id from public.reminder_push_delivery_targets
    where delivery_attempt_id=delivery.attempt_id and subscription_key=push_subscription;
  select id into second_target from public.reminder_push_delivery_targets
    where delivery_attempt_id=delivery.attempt_id and subscription_key=second_subscription;
  perform public.begin_reminder_push_target(delivery.attempt_id,delivery.lease_token,push_user,target_id);
  old_lease := delivery.lease_token;
  update public.reminder_delivery_attempts set claimed_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=delivery.attempt_id;
  update public.reminder_push_delivery_targets set started_at=clock_timestamp()-interval '20 minutes',
    lease_until=clock_timestamp()-interval '11 minutes' where id=target_id;
  select * into delivery from public.claim_reminder_delivery(
    push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(delivery.claimed and delivery.attempt_count=2, 'Web Push reclaims untouched work only');
  perform pg_temp.a3_assert((select status='unknown' from public.reminder_push_delivery_targets where id=target_id), 'Web Push expired in-flight target is unknown');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(
    delivery.attempt_id,delivery.lease_token,push_user,target_id) is null, 'Web Push unknown target not redispatched under fresh lease');
  perform pg_temp.a3_assert(not public.finish_reminder_push_target(
    delivery.attempt_id,old_lease,push_user,target_id,'sent',201), 'Web Push stale worker cannot resolve unknown');
  perform pg_temp.a3_assert((select count(*)=1 from public.list_reminder_push_targets(
    delivery.attempt_id,delivery.lease_token,push_user)), 'only untouched Web Push target eligible');
  perform pg_temp.a3_assert(public.begin_reminder_push_target(
    delivery.attempt_id,delivery.lease_token,push_user,second_target) is not null, 'untouched Web Push target authorized');
  perform public.finish_reminder_push_target(delivery.attempt_id,delivery.lease_token,push_user,second_target,'sent',201);
  result := public.finalize_reminder_push_delivery(delivery.attempt_id,delivery.lease_token);
  perform pg_temp.a3_assert(result->>'status'='failed' and result->>'outcome'='partial'
    and (result->>'unknown_count')::integer=1 and (result->>'success_count')::integer=1
    and (result->>'pending_count')::integer=0, 'Web Push partial unknown never fully successful');
  select * into denied from public.claim_reminder_delivery(
    push_user,'web_push',local_day,clock_timestamp(),clock_timestamp()+interval '10 minutes');
  perform pg_temp.a3_assert(not denied.claimed and not denied.retryable, 'Web Push only-unknown remainder terminal');
end;
$$;
rollback;
