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
  return {
    successCount: 0,
    failureCount: 0,
    removedCount: 0,
    errors: [],
  };
}
