import { Send, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthSession } from "@/core/auth";
import { getSupabaseSyncConfiguration } from "@/core/sync";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Button,
  Input,
  Select,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import {
  defaultTelegramReminderPreference,
  getBrowserTimeZone,
  getTelegramReminderTimeZoneOptions,
  normalizeTelegramReminderPreference,
  validateTelegramReminderPreference,
  type TelegramReminderPreferenceInput,
} from "../telegramReminderSettings";
import {
  loadTelegramReminderPreference,
  saveTelegramReminderPreference,
  sendTelegramReminderTest,
} from "../telegramReminderSettingsClient";

type PendingAction = "load" | "save" | "test" | null;
type Feedback = Readonly<{
  tone: "success" | "danger" | "neutral";
  message: string;
}> | null;

function createInitialPreference(): TelegramReminderPreferenceInput {
  return {
    ...defaultTelegramReminderPreference,
    timezone: getBrowserTimeZone(),
  };
}

export function TelegramReminderSettings() {
  const { t } = useI18n();
  const authSession = useAuthSession();
  const [draft, setDraft] = useState<TelegramReminderPreferenceInput>(
    createInitialPreference
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isAuthenticated = authSession.status === "authenticated";
  const isSupabaseConfigured = getSupabaseSyncConfiguration() !== null;
  const timeZoneOptions = useMemo(
    () => getTelegramReminderTimeZoneOptions(draft.timezone),
    [draft.timezone]
  );
  const validationKey = validateTelegramReminderPreference(draft) as
    | TranslationKey
    | null;
  const isBusy = pendingAction !== null;
  const canUseRemoteSettings = isAuthenticated && isSupabaseConfigured;
  const canSave = canUseRemoteSettings && !isBusy && validationKey === null;
  const canTest =
    canUseRemoteSettings &&
    !isBusy &&
    draft.telegramChatId.trim().length > 0 &&
    validateTelegramReminderPreference({ ...draft, enabled: true }) === null;

  useEffect(() => {
    if (!canUseRemoteSettings) {
      return;
    }

    let isActive = true;
    setPendingAction("load");
    setFeedback(null);

    void loadTelegramReminderPreference()
      .then((preference) => {
        if (!isActive) return;
        setDraft({
          enabled: preference.enabled,
          channel: "telegram",
          telegramChatId: preference.telegramChatId,
          timezone: preference.timezone,
          morningTime: preference.morningTime,
        });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setFeedback({
          tone: "danger",
          message:
            error instanceof Error
              ? error.message
              : t("settings.telegramReminderLoadError"),
        });
      })
      .finally(() => {
        if (isActive) {
          setPendingAction(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [canUseRemoteSettings, t]);

  const setField = <Key extends keyof TelegramReminderPreferenceInput>(
    key: Key,
    value: TelegramReminderPreferenceInput[Key]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  };

  const saveSettings = async () => {
    const validation = validateTelegramReminderPreference(draft) as
      | TranslationKey
      | null;
    if (validation) {
      setFeedback({ tone: "danger", message: t(validation) });
      return;
    }

    setPendingAction("save");
    setFeedback(null);
    try {
      const saved = await saveTelegramReminderPreference(
        normalizeTelegramReminderPreference(draft)
      );
      setDraft({
        enabled: saved.enabled,
        channel: "telegram",
        telegramChatId: saved.telegramChatId,
        timezone: saved.timezone,
        morningTime: saved.morningTime,
      });
      setFeedback({
        tone: "success",
        message: t("settings.telegramReminderSaveSuccess"),
      });
    } catch (error) {
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : t("settings.telegramReminderSaveError"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const sendTest = async () => {
    const validation = validateTelegramReminderPreference({
      ...draft,
      enabled: true,
    }) as TranslationKey | null;
    if (validation) {
      setFeedback({ tone: "danger", message: t(validation) });
      return;
    }

    setPendingAction("test");
    setFeedback(null);
    try {
      const message = await sendTelegramReminderTest(draft.telegramChatId);
      setFeedback({
        tone: "success",
        message: message || t("settings.telegramReminderTestSuccess"),
      });
    } catch (error) {
      setFeedback({
        tone: "danger",
        message:
          error instanceof Error
            ? error.message
            : t("settings.telegramReminderTestError"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const statusText = !isSupabaseConfigured
    ? t("settings.telegramReminderSupabaseRequired")
    : !isAuthenticated
      ? t("settings.telegramReminderSignInRequired")
      : draft.enabled
        ? t("settings.telegramReminderEnabled")
        : t("settings.telegramReminderDisabled");

  return (
    <SoftPanel className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <Smartphone className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">
              {t("settings.telegramReminderTitle")}
            </span>
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("settings.telegramReminderDescription")}
          </p>
        </div>
        <StatusChip
          tone={
            !canUseRemoteSettings ? "warning" : draft.enabled ? "primary" : "neutral"
          }
        >
          {statusText}
        </StatusChip>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">
            {t("settings.telegramReminderChannel")}
          </span>
          <Input value={t("settings.telegramReminderChannelTelegram")} disabled />
        </label>

        <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-background/80 px-3 py-2">
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={!canUseRemoteSettings || isBusy}
            onChange={(event) => setField("enabled", event.currentTarget.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">
            {t("settings.telegramReminderEnable")}
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">
            {t("settings.telegramReminderChatId")}
          </span>
          <Input
            value={draft.telegramChatId}
            disabled={!canUseRemoteSettings || isBusy}
            inputMode="numeric"
            placeholder="123456789"
            onChange={(event) =>
              setField("telegramChatId", event.currentTarget.value)
            }
          />
          <span className="block text-xs leading-5 text-muted-foreground">
            {t("settings.telegramReminderChatIdHelp")}
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">
            {t("settings.telegramReminderTimezone")}
          </span>
          <Select
            value={draft.timezone}
            disabled={!canUseRemoteSettings || isBusy}
            onChange={(event) => setField("timezone", event.currentTarget.value)}
          >
            {timeZoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-medium">
            {t("settings.telegramReminderMorningTime")}
          </span>
          <Input
            type="time"
            value={draft.morningTime}
            disabled={!canUseRemoteSettings || isBusy}
            onChange={(event) =>
              setField("morningTime", event.currentTarget.value)
            }
          />
          <span className="block text-xs leading-5 text-muted-foreground">
            {t("settings.telegramReminderMorningTimeHelp")}
          </span>
        </label>
      </div>

      {validationKey ? (
        <p className="text-sm leading-6 text-destructive">
          {t(validationKey)}
        </p>
      ) : null}

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
            void saveSettings();
          }}
          disabled={!canSave}
        >
          {pendingAction === "save"
            ? t("settings.telegramReminderSaving")
            : t("settings.telegramReminderSave")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void sendTest();
          }}
          disabled={!canTest}
        >
          <Send className="me-2 h-4 w-4" />
          {pendingAction === "test"
            ? t("settings.telegramReminderTesting")
            : t("settings.telegramReminderTest")}
        </Button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {t("settings.telegramReminderBoundary")}
      </p>
    </SoftPanel>
  );
}
