// Owner-run integration regression. Never invokes an Edge Function or provider.
// Requires the approved migration in a disposable local Supabase DB.
// Use psql on PATH, or LOCAL_PSQL_VIA_DOCKER=1 with the local Supabase container.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const psqlViaDocker = process.env.LOCAL_PSQL_VIA_DOCKER === "1";
const pgOptions = "-c statement_timeout=10000 -c lock_timeout=5000";
if (process.env.PGHOST !== "127.0.0.1" || process.env.PGPORT !== "54322" ||
    process.env.PGDATABASE !== "postgres") {
  throw new Error("Set PGHOST=127.0.0.1, PGPORT=54322 and PGDATABASE=postgres. Hosted databases are forbidden.");
}
if (!psqlViaDocker && !process.env.PGPASSWORD) {
  throw new Error("Set local PGPASSWORD for direct psql, or LOCAL_PSQL_VIA_DOCKER=1 for local container authentication.");
}
function sql(statement) {
  return new Promise((resolve, reject) => {
    const connectionArgs = psqlViaDocker ? [
      "exec", "-i", "-e", `PGOPTIONS=${pgOptions}`, "-e", "PGCONNECT_TIMEOUT=5", "-e", "PGHOSTADDR=",
      "supabase_db_alios-app-stage-2", "psql",
      "host=/var/run/postgresql port=5432 dbname=postgres user=postgres",
    ] : [
      "host=127.0.0.1 hostaddr=127.0.0.1 port=54322 dbname=postgres",
      "-U", process.env.PGUSER || "postgres",
    ];
    // Each call starts its own psql process/connection, including inside Docker.
    const child = spawn(psqlViaDocker ? "docker" : "psql", [
      ...connectionArgs, "-X", "-q", "-t", "-A", "-w", "-v", "ON_ERROR_STOP=1",
    ], {
      env: { ...process.env, PGUSER: process.env.PGUSER || "postgres", PGCONNECT_TIMEOUT: "5", PGOPTIONS: pgOptions },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    // Do not echo SQL, connection information, or raw database errors.
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", () => reject(new Error(psqlViaDocker ? "local_docker_unavailable" : "local_psql_unavailable")));
    child.on("close", (code) => {
      if (code !== 0) reject(new Error("local_sql_regression_failed"));
      else {
        try {
          resolve(output.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)));
        } catch {
          reject(new Error("local_sql_result_invalid"));
        }
      }
    });
    child.stdin.end(statement);
  });
}
async function contend(statement) {
  // A failed contender must not let fixture cleanup race the other connection.
  const results = await Promise.allSettled([sql(statement), sql(statement)]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
}
const owner = randomUUID();
const localDaySql = `(clock_timestamp() at time zone (select timezone from public.reminder_preferences where user_id='${owner}'))::date`;
let checkFailed = false;
try {
  await sql(`
    insert into auth.users(id) values ('${owner}');
    insert into public.reminder_preferences(user_id,enabled,channel,timezone,morning_time)
      values ('${owner}',true,'web_push',
        case when extract(hour from clock_timestamp() at time zone 'UTC') between 2 and 21
          then 'UTC' else 'Etc/GMT-6' end,'00:00:00');
    insert into public.push_subscriptions(user_id,endpoint,p256dh,auth)
      values ('${owner}','https://push.example.test/concurrency','fake-key','fake-auth');
  `);
  const claimSql = `
    begin;
    select to_jsonb(c) from public.claim_reminder_delivery(
      '${owner}','web_push',${localDaySql},
      clock_timestamp(),clock_timestamp()+interval '10 minutes') c;
    -- Encourage contention; this timing window is not a deterministic barrier.
    -- Winner assertions also hold if the OS happens to schedule these serially.
    do $$ begin perform pg_sleep(0.2); end $$;
    commit;
  `;
  const contenders = await contend(claimSql);
  assert.equal(contenders.filter((row) => row.claimed).length, 1, "only one concurrent parent claim");
  const winner = contenders.find((row) => row.claimed);
  const [target] = await sql(`select jsonb_build_object('id',id) from public.reminder_push_delivery_targets where delivery_attempt_id='${winner.attempt_id}';`);
  const beginSql = `
    begin;
    select coalesce(public.begin_reminder_push_target('${winner.attempt_id}','${winner.lease_token}','${owner}','${target.id}'),'null'::jsonb);
    do $$ begin perform pg_sleep(0.2); end $$;
    commit;
  `;
  const begins = await contend(beginSql);
  assert.equal(begins.filter((row) => row !== null).length, 1, "only one concurrent device dispatch authorization");
  const [finalized] = await sql(`select public.finalize_reminder_push_delivery('${winner.attempt_id}','${winner.lease_token}');`);
  assert.equal(finalized.outcome, "unknown", "unestablished outcome is unknown");
  const [repeat] = await sql(`select to_jsonb(c) from public.claim_reminder_delivery(
    '${owner}','web_push',${localDaySql},
    clock_timestamp(),clock_timestamp()+interval '10 minutes') c;`);
  assert.equal(repeat.claimed, false, "unknown target cannot be resent");
  process.stdout.write("Local reminder concurrency assertions completed. No provider sends.\n");
} catch (error) {
  checkFailed = true;
  throw error;
} finally {
  try {
    await sql(`delete from auth.users where id='${owner}';`);
  } catch (error) {
    if (!checkFailed) throw error;
    // This is a generated local fixture ID, never a real account or credential.
    process.stderr.write(`Local fixture cleanup failed for synthetic user ${owner}.\n`);
  }
}
