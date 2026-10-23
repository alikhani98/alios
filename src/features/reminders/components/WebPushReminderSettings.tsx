import { BellRing } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  | "subscription-unverified"
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

export function WebPushReminderSettings({ active = true, onSubscriptionChange }: {
  active?: boolean;
  onSubscriptionChange?: (available: boolean) => void;
}) {
  const { t } = useI18n();
  const authSession = useAuthSession();
  const accountScope = `${authSession.status}:${authSession.provider}:${authSession.user?.userId ?? ""}`;
  const currentScope = useRef(accountScope);
  currentScope.current = accountScope;
  const mounted = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  const generation = useRef(0);
  const checking = useRef(false);
  const operationPending = useRef(false);
  const registeredSubscription = useRef<{ scope: string; endpoint: string } | null>(null);
  const [permission, setPermission] = useState<ReturnType<typeof getWebPushPermissionState>>("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [status, setStatus] = useState<WebPushDeviceStatus>("checking");
  const [pendingAction, setPendingAction] = useState<PendingAction>("check");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isAuthenticated = authSession.status === "authenticated";
  const isSupabaseConfigured = getSupabaseSyncConfiguration() !== null;
  const canUseRemoteSettings = isAuthenticated && isSupabaseConfigured;
  const isBusy = pendingAction !== null;

  const refreshStatus = useCallback(async () => {
    const request = generation.current;
    const isCurrent = () => activeRef.current && mounted.current && generation.current === request && currentScope.current === accountScope;
    if (!activeRef.current || operationPending.current || checking.current) return;
    const capabilities = getWebPushCapabilities();
    if (!capabilities.supported) {
      setHasSubscription(false);
      setPermission("unsupported");
      registeredSubscription.current = null;
      setStatus("not-supported");
      setPendingAction(null);
      return;
    }

    const permission = getWebPushPermissionState();
    setPermission(permission);
    checking.current = true;
    setPendingAction("check");
    try {
      const subscription = await getCurrentPushSubscription();
      if (!isCurrent()) return;
      setHasSubscription(subscription !== null);
      if (permission === "denied") {
        registeredSubscription.current = null;
        setStatus("permission-denied");
        return;
      }
      if (subscription) {
        const registered = registeredSubscription.current;
        setStatus(registered?.scope === accountScope && registered.endpoint === subscription.endpoint
          ? "subscribed" : "subscription-unverified");
        return;
      }

      registeredSubscription.current = null;
      setStatus(getVapidPublicKey() ? "not-subscribed" : "vapid-missing");
    } catch {
      if (!isCurrent()) return;
      setStatus("error");
      setFeedback({
        tone: "danger",
        message: t("settings.webPushReminderStatusError"),
      });
    } finally {
      if (isCurrent()) {
        checking.current = false;
        setPendingAction(null);
      }
    }
  }, [t, accountScope]);

  useEffect(() => {
    mounted.current = active;
    operationPending.current = false;
    checking.current = false;
    registeredSubscription.current = null;
    setFeedback(null);
    if (!active) {
      setPendingAction(null);
      return;
    }
    void refreshStatus();
    const handleFocus = () => { void refreshStatus(); };
    window.addEventListener("focus", handleFocus);
    const interval = window.setInterval(handleFocus, 5000);
    return () => {
      generation.current += 1;
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [active, refreshStatus]);

  useEffect(() => {
    if (active) onSubscriptionChange?.(permission === "granted" && hasSubscription);
  }, [active, hasSubscription, permission, onSubscriptionChange]);

  const enableWebPush = async () => {
    if (!activeRef.current || !canUseRemoteSettings || operationPending.current || checking.current || pendingAction !== null) return;
    const request = generation.current;
    const isCurrent = () => activeRef.current && mounted.current && generation.current === request && currentScope.current === accountScope;
    if (!getVapidPublicKey()) {
      setStatus("vapid-missing");
      setFeedback({
        tone: "danger",
        message: t("settings.webPushReminderVapidMissing"),
      });
      return;
    }

    operationPending.current = true;
    setPendingAction("enable");
    setFeedback(null);

    try {
      const result = await requestWebPushSubscription();
      if (!isCurrent()) return;
      setPermission(getWebPushPermissionState());

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

      if (result.status === "subscribed") {
        setHasSubscription(true);
        await registerWebPushSubscription(result);
        if (!isCurrent()) return;
        registeredSubscription.current = { scope: accountScope, endpoint: result.subscription.endpoint };
        setStatus("subscribed");
        setFeedback({
          tone: "success",
          message: t("settings.webPushReminderEnableSuccess"),
        });
      }
    } catch {
      if (!isCurrent()) return;
      registeredSubscription.current = null;
      setStatus("error");
      setFeedback({
        tone: "danger",
        message: t("settings.webPushReminderEnableError"),
      });
    } finally {
      if (isCurrent()) {
        operationPending.current = false;
        setPendingAction(null);
      }
    }
  };

  const disableWebPush = async () => {
    if (!activeRef.current || !canUseRemoteSettings || operationPending.current || checking.current || pendingAction !== null) return;
    const request = generation.current;
    const isCurrent = () => activeRef.current && mounted.current && generation.current === request && currentScope.current === accountScope;
    operationPending.current = true;
    setPendingAction("disable");
    setFeedback(null);

    try {
      const subscription = await getCurrentPushSubscription();
      if (!isCurrent()) return;
      if (!subscription) {
        setHasSubscription(false);
        registeredSubscription.current = null;
        setStatus("not-subscribed");
        setFeedback({
          tone: "neutral",
          message: t("settings.webPushReminderAlreadyDisabled"),
        });
        return;
      }

      await deleteWebPushSubscription({ endpoint: subscription.endpoint });
      if (!isCurrent()) return;
      const unsubscribed = await subscription.unsubscribe();
      if (!isCurrent()) return;
      if (!unsubscribed && (await getCurrentPushSubscription()) !== null) {
        throw new Error("Browser subscription remains active.");
      }
      if (!isCurrent()) return;
      setHasSubscription(false);
      registeredSubscription.current = null;
      setStatus("not-subscribed");
      setFeedback({
        tone: "success",
        message: t("settings.webPushReminderDisableSuccess"),
      });
    } catch {
      if (!isCurrent()) return;
      registeredSubscription.current = null;
      setStatus("error");
      setFeedback({
        tone: "danger",
        message: t("settings.webPushReminderDisableError"),
      });
    } finally {
      if (isCurrent()) {
        operationPending.current = false;
        setPendingAction(null);
      }
    }
  };

  const statusKey =
    status === "checking"
      ? "settings.webPushReminderStatusChecking"
      : status === "subscribed"
        ? "settings.webPushReminderStatusSubscribed"
        : status === "subscription-unverified"
          ? "settings.webPushReminderStatusUnverified"
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
    active && canUseRemoteSettings &&
    !isBusy &&
    (status === "not-subscribed" || status === "subscription-unverified" || status === "error");
  const canDisable = active && canUseRemoteSettings && !isBusy && hasSubscription;

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
        <p className="text-sm leading-6 text-muted-foreground">
          {t(permission === "granted" ? "settings.webPushPermissionGranted"
            : permission === "denied" ? "settings.webPushReminderStatusPermissionDenied"
            : permission === "unsupported" ? "settings.webPushReminderStatusNotSupported"
            : "settings.webPushPermissionDefault")}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">{t("settings.webPushDeliveryUnverified")}</p>
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
