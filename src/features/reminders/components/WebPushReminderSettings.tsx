import { BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuthSession } from "@/core/auth";
import { getSupabaseSyncConfiguration } from "@/core/sync";
import { useI18n } from "@/shared/i18n";
import { Button, SoftPanel, StatusChip } from "@/shared/ui";

import {
  getVapidPublicKey,
  getWebPushCapabilities,
  getWebPushPermissionState,
  requestWebPushSubscription,
} from "../webPushSubscription";
import {
  deleteWebPushSubscription,
  registerWebPushSubscription,
} from "../webPushSubscriptionClient";

type WebPushDeviceStatus =
  | "checking"
  | "subscribed"
  | "not-subscribed"
  | "not-supported"
  | "permission-denied"
  | "vapid-missing"
  | "error";

type PendingAction = "check" | "enable" | "disable" | null;
type Feedback = Readonly<{
  tone: "success" | "danger" | "neutral";
  message: string;
}> | null;

async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

export function WebPushReminderSettings() {
  const { t } = useI18n();
  const authSession = useAuthSession();
  const [status, setStatus] = useState<WebPushDeviceStatus>("checking");
  const [pendingAction, setPendingAction] = useState<PendingAction>("check");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isAuthenticated = authSession.status === "authenticated";
  const isSupabaseConfigured = getSupabaseSyncConfiguration() !== null;
  const canUseRemoteSettings = isAuthenticated && isSupabaseConfigured;
  const isBusy = pendingAction !== null;

  const refreshStatus = useCallback(async () => {
    const capabilities = getWebPushCapabilities();
    if (!capabilities.supported) {
      setStatus("not-supported");
      setPendingAction(null);
      return;
    }

    const permission = getWebPushPermissionState();
    if (permission === "denied") {
      setStatus("permission-denied");
      setPendingAction(null);
      return;
    }

    setPendingAction("check");
    try {
      const subscription = await getCurrentPushSubscription();
      if (subscription) {
        setStatus("subscribed");
        return;
      }

      setStatus(getVapidPublicKey() ? "not-subscribed" : "vapid-missing");
    } catch (error) {
      setStatus("error");
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : t("settings.webPushReminderStatusError"),
      });
    } finally {
      setPendingAction(null);
    }
  }, [t]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const enableWebPush = async () => {
    if (!getVapidPublicKey()) {
      setStatus("vapid-missing");
      setFeedback({
        tone: "danger",
        message: t("settings.webPushReminderVapidMissing"),
      });
      return;
    }

    setPendingAction("enable");
    setFeedback(null);

    try {
      const result = await requestWebPushSubscription();

      if (result.status === "unsupported") {
        setStatus("not-supported");
        setFeedback({
          tone: "danger",
          message: t("settings.webPushReminderNotSupportedHelp"),
        });
        return;
      }

      if (result.status === "permission-denied") {
        setStatus("permission-denied");
        setFeedback({
          tone: "danger",
          message: t("settings.webPushReminderPermissionDeniedHelp"),
        });
        return;
      }

      if (result.status === "permission-default") {
        setStatus("not-subscribed");
        setFeedback({
          tone: "neutral",
          message: t("settings.webPushReminderPermissionDefaultHelp"),
        });
        return;
      }

      await registerWebPushSubscription(result);
      setStatus("subscribed");
      setFeedback({
        tone: "success",
        message: t("settings.webPushReminderEnableSuccess"),
      });
    } catch (error) {
      setStatus("error");
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : t("settings.webPushReminderEnableError"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const disableWebPush = async () => {
    setPendingAction("disable");
    setFeedback(null);

    try {
      const subscription = await getCurrentPushSubscription();
      if (!subscription) {
        setStatus("not-subscribed");
        setFeedback({
          tone: "neutral",
          message: t("settings.webPushReminderAlreadyDisabled"),
        });
        return;
      }

      await deleteWebPushSubscription({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      setStatus("not-subscribed");
      setFeedback({
        tone: "success",
        message: t("settings.webPushReminderDisableSuccess"),
      });
    } catch (error) {
      setStatus("error");
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : t("settings.webPushReminderDisableError"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const statusKey =
    status === "checking"
      ? "settings.webPushReminderStatusChecking"
      : status === "subscribed"
        ? "settings.webPushReminderStatusSubscribed"
        : status === "not-supported"
          ? "settings.webPushReminderStatusNotSupported"
          : status === "permission-denied"
            ? "settings.webPushReminderStatusPermissionDenied"
            : status === "vapid-missing"
              ? "settings.webPushReminderStatusVapidMissing"
              : status === "error"
                ? "settings.webPushReminderStatusError"
                : "settings.webPushReminderStatusNotSubscribed";

  const statusTone =
    status === "subscribed"
      ? "primary"
      : status === "not-supported" ||
          status === "permission-denied" ||
          status === "vapid-missing" ||
          status === "error" ||
          !canUseRemoteSettings
        ? "warning"
        : "neutral";

  const remoteHelp = !isSupabaseConfigured
    ? t("settings.webPushReminderSupabaseRequired")
    : !isAuthenticated
      ? t("settings.webPushReminderSignInRequired")
      : null;
  const canEnable =
    canUseRemoteSettings &&
    !isBusy &&
    (status === "not-subscribed" || status === "error");
  const canDisable = canUseRemoteSettings && !isBusy && status === "subscribed";

  return (
    <SoftPanel className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <BellRing className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">
              {t("settings.webPushReminderTitle")}
            </span>
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("settings.webPushReminderDescription")}
          </p>
        </div>
        <StatusChip tone={statusTone}>{t(statusKey)}</StatusChip>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {t("settings.webPushReminderCurrentDevice")}
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {remoteHelp ?? t("settings.webPushReminderDeviceHelp")}
        </p>
      </div>

      {feedback ? (
        <p
          role={feedback.tone === "danger" ? "alert" : "status"}
          className={
            feedback.tone === "danger"
              ? "text-sm leading-6 text-destructive"
              : "text-sm leading-6 text-muted-foreground"
          }
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          onClick={() => {
            void enableWebPush();
          }}
          disabled={!canEnable}
        >
          {pendingAction === "enable"
            ? t("settings.webPushReminderEnabling")
            : t("settings.webPushReminderEnable")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void disableWebPush();
          }}
          disabled={!canDisable}
        >
          {pendingAction === "disable"
            ? t("settings.webPushReminderDisabling")
            : t("settings.webPushReminderDisable")}
        </Button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {t("settings.webPushReminderBoundary")}
      </p>
    </SoftPanel>
  );
}
