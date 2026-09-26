import type { WebPushSubscriptionData } from "./webPushTypes";

export type WebPushCapabilities = Readonly<{
  notification: boolean;
  serviceWorker: boolean;
  pushManager: boolean;
  supported: boolean;
}>;

export type WebPushPermissionState = NotificationPermission | "unsupported";

export type WebPushSubscriptionResult =
  | Readonly<{
      status: "unsupported";
      capabilities: WebPushCapabilities;
    }>
  | Readonly<{
      status: "permission-denied" | "permission-default";
      permission: Exclude<NotificationPermission, "granted">;
      capabilities: WebPushCapabilities;
    }>
  | Readonly<{
      status: "subscribed";
      capabilities: WebPushCapabilities;
      subscription: WebPushSubscriptionData;
    }>;

type NotificationApi = Readonly<{
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
}>;

type PushSubscriptionLike = Pick<PushSubscription, "endpoint" | "getKey">;

type PushManagerLike = {
  getSubscription: () => Promise<PushSubscriptionLike | null>;
  subscribe: (options: {
    userVisibleOnly: true;
    applicationServerKey: BufferSource;
  }) => Promise<PushSubscriptionLike>;
};

type ServiceWorkerRegistrationLike = Readonly<{
  pushManager: PushManagerLike;
}>;

type ServiceWorkerContainerLike = Readonly<{
  ready: Promise<ServiceWorkerRegistrationLike>;
}>;

export type WebPushBrowserEnvironment = Readonly<{
  notification?: NotificationApi;
  serviceWorker?: ServiceWorkerContainerLike;
  pushManagerSupported?: boolean;
  userAgent?: string;
}>;

function getDefaultEnvironment(): WebPushBrowserEnvironment {
  return {
    notification:
      typeof Notification === "undefined" ? undefined : Notification,
    serviceWorker:
      typeof navigator === "undefined" ? undefined : navigator.serviceWorker,
    pushManagerSupported:
      typeof PushManager !== "undefined",
    userAgent:
      typeof navigator === "undefined" ? undefined : navigator.userAgent,
  };
}

export function getWebPushCapabilities(
  environment: WebPushBrowserEnvironment = getDefaultEnvironment()
): WebPushCapabilities {
  const notification = Boolean(environment.notification);
  const serviceWorker = Boolean(environment.serviceWorker);
  const pushManager = environment.pushManagerSupported === true;

  return {
    notification,
    serviceWorker,
    pushManager,
    supported: notification && serviceWorker && pushManager,
  };
}

export function getWebPushPermissionState(
  environment: WebPushBrowserEnvironment = getDefaultEnvironment()
): WebPushPermissionState {
  if (!environment.notification) {
    return "unsupported";
  }

  return environment.notification.permission;
}

export function getVapidPublicKey(): string | null {
  const value = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function base64UrlToUint8Array(
  value: string
): Uint8Array<ArrayBuffer> {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  if (normalized.length === 0) {
    throw new Error("VAPID public key is empty.");
  }

  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("VAPID public key is not valid base64url.");
  }

  const bytes = new Uint8Array<ArrayBuffer>(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function arrayBufferToBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function serializeWebPushSubscription(
  subscription: PushSubscriptionLike,
  userAgent?: string
): WebPushSubscriptionData {
  if (subscription.endpoint.trim().length === 0) {
    throw new Error("Push subscription endpoint is empty.");
  }

  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");

  if (!p256dh || !auth) {
    throw new Error("Push subscription encryption keys are missing.");
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64Url(p256dh),
    auth: arrayBufferToBase64Url(auth),
    user_agent:
      userAgent ??
      (typeof navigator === "undefined" ? null : navigator.userAgent) ??
      null,
  };
}

export async function requestWebPushSubscription(options?: Readonly<{
  environment?: WebPushBrowserEnvironment;
  vapidPublicKey?: string;
}>): Promise<WebPushSubscriptionResult> {
  const environment = options?.environment ?? getDefaultEnvironment();
  const capabilities = getWebPushCapabilities(environment);

  if (!capabilities.supported) {
    return { status: "unsupported", capabilities };
  }

  const notification = environment.notification;
  if (!notification) {
    return { status: "unsupported", capabilities };
  }

  const permission =
    notification.permission === "default"
      ? await notification.requestPermission()
      : notification.permission;

  if (permission !== "granted") {
    return {
      status: permission === "denied"
        ? "permission-denied"
        : "permission-default",
      permission,
      capabilities,
    };
  }

  const publicKey = options?.vapidPublicKey ?? getVapidPublicKey();
  if (!publicKey) {
    throw new Error("VAPID public key is not configured.");
  }

  const serviceWorker = environment.serviceWorker;
  if (!serviceWorker) {
    return { status: "unsupported", capabilities };
  }

  const registration = await serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    }));

  return {
    status: "subscribed",
    capabilities,
    subscription: serializeWebPushSubscription(
      subscription,
      environment.userAgent
    ),
  };
}
