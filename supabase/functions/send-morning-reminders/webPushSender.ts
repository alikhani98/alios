import * as webpush from "jsr:@negrel/webpush@0.5.0";

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
  payload: WebPushNotificationPayload
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

  return (userId, payload) =>
    sendWebPushNotifications(userId, payload, {
      supabaseUrl: configuration.supabaseUrl,
      supabaseServiceKey: configuration.supabaseServiceKey,
      fetch: configuration.fetch,
      send: async (subscription, notificationPayload) => {
        try {
          const applicationServer = await getApplicationServer();
          const subscriber = applicationServer.subscribe({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          });

          await subscriber.pushTextMessage(
            JSON.stringify(notificationPayload),
            {
              topic: "reminders",
              ttl: 86400,
              urgency: webpush.Urgency.Normal,
            }
          );

          return { ok: true, status: 201 };
        } catch (error) {
          if (error instanceof webpush.PushMessageError) {
            return {
              ok: false,
              status: error.response.status,
              error: error.toString(),
            };
          }

          return {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Web Push delivery failed.",
          };
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
