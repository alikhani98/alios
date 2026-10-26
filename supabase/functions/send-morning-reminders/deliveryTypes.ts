export type WebPushNotificationPayload = Readonly<{
  version: number;
  title: string;
  body: string;
  url: string;
}>;
export type DeliveryResult = Readonly<{
  successCount: number;
  failureCount: number;
  removedCount: number;
  errors: string[];
}>;
export function emptyDeliveryResult(): DeliveryResult {
  return { successCount: 0, failureCount: 0, removedCount: 0, errors: [] };
}
export type ProviderOutcome = Readonly<{
  ok: boolean;
  status?: number;
  // An ambiguous transport outcome must never be retried automatically.
  unknown?: boolean;
  preDispatchFailure?: boolean;
}>;
export function isPreDispatchNetworkFailure(error: unknown): boolean {
  // Only failures establishing a connection are safe to replay. Reset, timeout
  // and abort errors may follow acceptance and deliberately remain unknown.
  for (let depth = 0; depth < 3 && typeof error === "object" && error !== null; depth++) {
    if ("code" in error && typeof error.code === "string" &&
        ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH"].includes(error.code)) return true;
    if ("name" in error && typeof error.name === "string" &&
        ["ConnectionRefused", "NetworkUnreachable", "HostUnreachable"].includes(error.name)) return true;
    error = "cause" in error ? error.cause : undefined;
  }
  return false;
}
export function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || (status !== undefined && status >= 500 && status <= 599);
}
export function providerErrorCode(provider: "telegram" | "web_push", outcome: ProviderOutcome): string {
  if (outcome.unknown) return `${provider}_outcome_unknown`;
  if (outcome.preDispatchFailure) return `${provider}_pre_dispatch_failure`;
  const status = outcome.status;
  return `${provider}_http_${status !== undefined && Number.isInteger(status) && status >= 100 && status <= 599 ? status : "invalid"}`;
}
