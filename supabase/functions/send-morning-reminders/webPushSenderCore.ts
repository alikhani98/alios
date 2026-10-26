import { callRpc, isRecord, readPagedRows, type DeliveryClaim, type DeliveryStateDependencies } from "./deliveryState.ts";
import { emptyDeliveryResult, isPreDispatchNetworkFailure, isRetryableStatus, providerErrorCode, type DeliveryResult, type ProviderOutcome, type WebPushNotificationPayload } from "./deliveryTypes.ts";

export type StoredPushSubscription = Readonly<{
  endpoint: string; p256dh: string; auth: string; user_agent: string | null;
}>;
export type WebPushAttemptResult = ProviderOutcome;
export type WebPushSenderCoreDependencies = DeliveryStateDependencies & Readonly<{
  send: (subscription: StoredPushSubscription, payload: WebPushNotificationPayload) => Promise<WebPushAttemptResult>;
}>;

export async function sendWebPushNotifications(
  userId: string, payload: WebPushNotificationPayload, claim: DeliveryClaim, deps: WebPushSenderCoreDependencies,
): Promise<DeliveryResult> {
  const context = { p_attempt_id: claim.attempt_id, p_lease_token: claim.lease_token, p_user_id: userId };
  const targets = await readPagedRows("rpc/list_reminder_push_targets", new URLSearchParams({ order: "target_id.asc" }), deps, context);
  const identities = new Set<string>();
  if (!targets.every((target): target is { target_id: string } => {
    if (!isRecord(target) || typeof target.target_id !== "string" || identities.has(target.target_id)) return false;
    identities.add(target.target_id);
    return true;
  })) {
    throw new Error("web_push_targets_invalid");
  }
  let successCount = 0;
  let failureCount = 0;
  let removedCount = 0;
  const errors: string[] = [];
  for (const target of targets) {
    const started = await callRpc("begin_reminder_push_target", { ...context, p_target_id: target.target_id }, deps);
    if (started === null) continue; // Suppressed preference, terminal target, removed device or expired lease.
    if (!isRecord(started) || typeof started.endpoint !== "string" || typeof started.p256dh !== "string" || typeof started.auth !== "string") {
      throw new Error("web_push_target_invalid");
    }
    let outcome: ProviderOutcome;
    try {
      outcome = await deps.send({
        endpoint: started.endpoint, p256dh: started.p256dh, auth: started.auth,
        user_agent: typeof started.user_agent === "string" ? started.user_agent : null,
      }, payload);
    } catch (error) {
      const preDispatchFailure = isPreDispatchNetworkFailure(error);
      outcome = { ok: false, preDispatchFailure, unknown: !preDispatchFailure };
    }
    // HTTP acceptance is required even when an adapter incorrectly returns ok.
    const accepted = outcome.ok && outcome.status !== undefined && outcome.status >= 200 && outcome.status < 300 && !outcome.unknown && !outcome.preDispatchFailure;
    const error = providerErrorCode("web_push", outcome);
    const recorded = await callRpc("finish_reminder_push_target", {
      ...context, p_target_id: target.target_id,
      p_outcome: accepted ? "sent" : outcome.unknown ? "unknown" : outcome.preDispatchFailure ? "retryable_failure" : outcome.status === undefined ? "unknown" : isRetryableStatus(outcome.status) ? "retryable_failure" : "permanent_failure",
      p_http_status: outcome.status ?? null,
    }, deps);
    if (recorded !== true) throw new Error("web_push_target_not_recorded");
    if (accepted) successCount++;
    else {
      failureCount++;
      errors.push(error);
      if (outcome.status === 404 || outcome.status === 410) removedCount++;
    }
  }
  return { ...emptyDeliveryResult(), successCount, failureCount, removedCount, errors };
}
