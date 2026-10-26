import * as webpush from "jsr:@negrel/webpush@0.5.0";
import type { DeliveryClaim } from "./deliveryState.ts";
import { isPreDispatchNetworkFailure } from "./deliveryTypes.ts";

import type {
  DeliveryResult,
  WebPushNotificationPayload,
} from "./deliveryTypes.ts";
import {
  sendWebPushNotifications,
  type StoredPushSubscription,
} from "./webPushSenderCore.ts";

export type WebPushSenderConfiguration = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  vapidKeysJson?: string;
  vapidSubject?: string;
  fetch: typeof fetch;
}>;

function readVapidKeys(value: string): webpush.ExportedVapidKeys {
  const raw = value.trim();
  if (raw.length === 0) {
    throw new Error("VAPID_KEYS_JSON is not configured.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("VAPID_KEYS_JSON is not valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error(
      "VAPID_KEYS_JSON must contain publicKey and privateKey JWK values."
    );
  }

  if (!isJsonWebKey(parsed.publicKey) || !isJsonWebKey(parsed.privateKey)) {
    throw new Error(
      "VAPID_KEYS_JSON must contain publicKey and privateKey JWK values."
    );
  }

  return {
    publicKey: parsed.publicKey,
    privateKey: parsed.privateKey,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJsonWebKey(value: unknown): value is JsonWebKey {
  return isRecord(value) && typeof value.kty === "string";
}

export function createWebPushSender(
  configuration: WebPushSenderConfiguration
): (
  userId: string,
  payload: WebPushNotificationPayload,
  claim: DeliveryClaim
) => Promise<DeliveryResult> {
  let applicationServerPromise:
    | Promise<webpush.ApplicationServer>
    | undefined;

  const getApplicationServer = (): Promise<webpush.ApplicationServer> => {
    if (!applicationServerPromise) {
      const keysJson = configuration.vapidKeysJson;
      const subject = configuration.vapidSubject?.trim();

      if (!keysJson || !subject) {
        applicationServerPromise = Promise.reject(
          new Error(
            "VAPID_KEYS_JSON and VAPID_SUBJECT must be configured for Web Push."
          )
        );
      } else {
        applicationServerPromise = readApplicationServer(
          keysJson,
          subject
        );
      }
    }

    return applicationServerPromise;
  };

  return (userId, payload, claim) =>
    sendWebPushNotifications(userId, payload, claim, {
      supabaseUrl: configuration.supabaseUrl,
      supabaseServiceKey: configuration.supabaseServiceKey,
      fetch: configuration.fetch,
      send: async (subscription, notificationPayload) => {
        let applicationServer: webpush.ApplicationServer;
        try {
          applicationServer = await getApplicationServer();
        } catch {
          // Configuration failed before dispatch; retry is safe.
          return { ok: false, preDispatchFailure: true };
        }
        let subscriber: ReturnType<webpush.ApplicationServer["subscribe"]>;
        try {
          subscriber = applicationServer.subscribe({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          });
        } catch {
          // Invalid stored subscription data failed before any provider request.
          return { ok: false, status: 400 };
        }
        try {
          const sending = subscriber.pushTextMessage(
            JSON.stringify(notificationPayload),
            {
              topic: "reminders",
              ttl: 86400,
              urgency: webpush.Urgency.Normal,
            }
          );
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              sending,
              new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error("push_timeout")), 30_000);
              }),
            ]);
          } finally {
            clearTimeout(timer);
          }

          return { ok: true, status: 201 };
        } catch (error) {
          if (error instanceof webpush.PushMessageError) {
            return {
              ok: false,
              status: error.response.status,
            };
          }

          const preDispatchFailure = isPreDispatchNetworkFailure(error);
          return { ok: false, preDispatchFailure, unknown: !preDispatchFailure };
        }
      },
    });
}

async function readApplicationServer(
  keysJson: string,
  subject: string
): Promise<webpush.ApplicationServer> {
  const vapidKeys = await webpush.importVapidKeys(readVapidKeys(keysJson));
  return webpush.ApplicationServer.new({
    contactInformation: subject,
    vapidKeys,
  });
}

export type { StoredPushSubscription };
