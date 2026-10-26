import { processMorningReminders, type MorningRemindersDependencies, type MorningRemindersResult } from "./core.ts";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function equalToken(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}
export async function handleSchedulerRequest(
  request: Request,
  deps: MorningRemindersDependencies,
  process: (deps: MorningRemindersDependencies) => Promise<MorningRemindersResult> = processMorningReminders,
): Promise<Response> {
  if (request.method !== "POST") return json(405, { ok: false, message: "method_not_allowed" });
  if (!deps.supabaseServiceKey.trim() || !deps.supabaseUrl.trim()) return json(503, { ok: false, message: "scheduler_unconfigured" });
  // Match the existing cron's service-role bearer, independently of gateway JWT verification.
  // A user/anon JWT is never accepted merely because it is a valid Supabase token.
  if (!equalToken(request.headers.get("authorization") ?? "", `Bearer ${deps.supabaseServiceKey}`)) {
    return json(401, { ok: false, message: "unauthorized" });
  }
  try {
    const result = await process(deps);
    return json(result.ok ? 200 : 503, result);
  } catch {
    return json(503, { ok: false, message: "scheduler_unavailable" });
  }
}
