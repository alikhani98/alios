export type WebPushSubscriptionData = Readonly<{
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
}>;

export type WebPushNotificationPayload = Readonly<{
  version?: number;
  title: string;
  body?: string;
  url?: string;
  taskId?: string;
  focusId?: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(
  value: Record<string, unknown>,
  key: string
): string | undefined | null {
  const candidate = value[key];
  if (candidate === undefined) {
    return undefined;
  }

  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate
    : null;
}

export function parseWebPushNotificationPayload(
  value: unknown
): WebPushNotificationPayload | null {
  if (!isRecord(value) || typeof value.title !== "string") {
    return null;
  }

  const title = value.title.trim();
  if (title.length === 0) {
    return null;
  }

  const body = optionalString(value, "body");
  const url = optionalString(value, "url");
  const taskId = optionalString(value, "taskId");
  const focusId = optionalString(value, "focusId");

  if (body === null || url === null || taskId === null || focusId === null) {
    return null;
  }

  if (value.version !== undefined && typeof value.version !== "number") {
    return null;
  }

  return {
    ...(typeof value.version === "number" ? { version: value.version } : {}),
    title,
    ...(body ? { body } : {}),
    ...(url ? { url } : {}),
    ...(taskId ? { taskId } : {}),
    ...(focusId ? { focusId } : {}),
  };
}
