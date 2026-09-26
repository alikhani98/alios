import { describe, expect, it, vi } from "vitest";

import {
  arrayBufferToBase64Url,
  getWebPushCapabilities,
  getWebPushPermissionState,
  requestWebPushSubscription,
  serializeWebPushSubscription,
} from "../webPushSubscription";
import { parseWebPushNotificationPayload } from "../webPushTypes";

function bytes(...values: number[]) {
  return Uint8Array.from(values).buffer;
}

describe("Web Push subscription foundation", () => {
  it("serializes the browser subscription fields", () => {
    const subscription = {
      endpoint: "https://push.example.test/subscription",
      getKey: vi.fn((name: "p256dh" | "auth") =>
        name === "p256dh" ? bytes(1, 2, 3) : bytes(4, 5, 6)
      ),
    };

    expect(serializeWebPushSubscription(subscription, "Test Browser")).toEqual({
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64Url(bytes(1, 2, 3)),
      auth: arrayBufferToBase64Url(bytes(4, 5, 6)),
      user_agent: "Test Browser",
    });
  });

  it("reports unsupported browser capabilities without requesting permission", () => {
    const requestPermission = vi.fn();
    const environment = {
      notification: {
        permission: "default" as NotificationPermission,
        requestPermission,
      },
      pushManagerSupported: false,
    };

    expect(getWebPushCapabilities(environment)).toEqual({
      notification: true,
      serviceWorker: false,
      pushManager: false,
      supported: false,
    });
    expect(getWebPushPermissionState(environment)).toBe("default");

    return expect(
      requestWebPushSubscription({ environment })
    ).resolves.toMatchObject({ status: "unsupported" }).then(() => {
      expect(requestPermission).not.toHaveBeenCalled();
    });
  });

  it("preserves denied and dismissed permission states", async () => {
    const deniedEnvironment = {
      notification: {
        permission: "denied" as NotificationPermission,
        requestPermission: vi.fn(),
      },
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn(),
            subscribe: vi.fn(),
          },
        }),
      },
      pushManagerSupported: true,
    };

    await expect(
      requestWebPushSubscription({ environment: deniedEnvironment })
    ).resolves.toMatchObject({
      status: "permission-denied",
      permission: "denied",
    });
    expect(deniedEnvironment.notification.requestPermission).not.toHaveBeenCalled();

    const defaultEnvironment = {
      ...deniedEnvironment,
      notification: {
        permission: "default" as NotificationPermission,
        requestPermission: vi.fn().mockResolvedValue("default" as NotificationPermission),
      },
    };

    await expect(
      requestWebPushSubscription({ environment: defaultEnvironment })
    ).resolves.toMatchObject({
      status: "permission-default",
      permission: "default",
    });
    expect(defaultEnvironment.notification.requestPermission).toHaveBeenCalledOnce();
  });

  it("reuses an existing subscription after granted permission", async () => {
    const subscription = {
      endpoint: "https://push.example.test/existing",
      getKey: vi.fn((name: "p256dh" | "auth") =>
        name === "p256dh" ? bytes(7, 8) : bytes(9, 10)
      ),
    };
    const getSubscription = vi.fn().mockResolvedValue(subscription);
    const subscribe = vi.fn();

    const result = await requestWebPushSubscription({
      vapidPublicKey: "AQID",
      environment: {
        notification: {
          permission: "granted",
          requestPermission: vi.fn(),
        },
        serviceWorker: {
          ready: Promise.resolve({
            pushManager: { getSubscription, subscribe },
          }),
        },
        pushManagerSupported: true,
        userAgent: "Test Browser",
      },
    });

    expect(result.status).toBe("subscribed");
    expect(getSubscription).toHaveBeenCalledOnce();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("creates a subscription with the VAPID key after granted permission", async () => {
    const createdSubscription = {
      endpoint: "https://push.example.test/created",
      getKey: vi.fn((name: "p256dh" | "auth") =>
        name === "p256dh" ? bytes(11, 12) : bytes(13, 14)
      ),
    };
    const subscribe = vi.fn().mockResolvedValue(createdSubscription);

    const result = await requestWebPushSubscription({
      vapidPublicKey: "AQID",
      environment: {
        notification: {
          permission: "granted",
          requestPermission: vi.fn(),
        },
        serviceWorker: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(null),
              subscribe,
            },
          }),
        },
        pushManagerSupported: true,
      },
    });

    expect(result.status).toBe("subscribed");
    expect(subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: Uint8Array.from([1, 2, 3]),
    });
  });

  it("parses valid payload fields and rejects malformed payloads", () => {
    expect(
      parseWebPushNotificationPayload({
        version: 1,
        title: "Task due",
        body: "Review the task",
        url: "/#/today",
        taskId: "task-1",
        focusId: "task-1",
      })
    ).toEqual({
      version: 1,
      title: "Task due",
      body: "Review the task",
      url: "/#/today",
      taskId: "task-1",
      focusId: "task-1",
    });

    expect(parseWebPushNotificationPayload({ title: "" })).toBeNull();
    expect(parseWebPushNotificationPayload({ title: "Task", body: 42 })).toBeNull();
    expect(parseWebPushNotificationPayload(null)).toBeNull();
  });
});
