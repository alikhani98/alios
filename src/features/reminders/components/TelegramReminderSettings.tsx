import { Send, Smartphone } from "lucide-react";
import { useMemo } from "react";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Button,
  Input,
  Select,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import {
  getTelegramReminderTimeZoneOptions,
  validateTelegramReminderPreference,
} from "../telegramReminderSettings";
import {
  useTelegramReminderSettings,
  type TelegramReminderSettingsController,
} from "../useTelegramReminderSettings";

function StandaloneTelegramReminderSettings({ active }: { active: boolean }) {
  const settings = useTelegramReminderSettings(active);
  return <TelegramReminderSettingsForm settings={settings} active={active} />;
}

export function TelegramReminderSettings({ settings, active = true }: {
  settings?: TelegramReminderSettingsController;
  active?: boolean;
}) {
  return settings
    ? <TelegramReminderSettingsForm settings={settings} active={active} />
    : <StandaloneTelegramReminderSettings active={active} />;
}

function TelegramReminderSettingsForm({ settings, active }: { settings: TelegramReminderSettingsController; active: boolean }) {
  const { t } = useI18n();
  const {
    draft, preference, pendingAction, feedback, isBusy, isSupabaseConfigured,
    canUseRemoteSettings, setField, saveSettings, sendTest, retry,
  } = settings;
  const timeZoneOptions = useMemo(
    () => getTelegramReminderTimeZoneOptions(draft.timezone), [draft.timezone]
  );
  const validationKey = (draft.channel === "both"
    ? "reminders.channelSelector.legacyBoth"
    : validateTelegramReminderPreference({ ...draft, channel: draft.channel })) as TranslationKey | null;
  const canSave = active && canUseRemoteSettings && preference !== null && !isBusy && validationKey === null;
  const canTest = active && canUseRemoteSettings && preference !== null && !isBusy &&
    draft.telegramChatId.trim().length > 0 &&
    validateTelegramReminderPreference({ ...draft, channel: "telegram", enabled: true }) === null;
  const statusText = !isSupabaseConfigured
    ? t("settings.telegramReminderSupabaseRequired")
    : !canUseRemoteSettings
      ? t("settings.telegramReminderSignInRequired")
      : !preference
        ? t(pendingAction === "load" ? "common.loading" : "settings.telegramReminderLoadError")
        : t(preference.enabled ? "settings.telegramReminderEnabled" : "settings.telegramReminderDisabled");

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
            !canUseRemoteSettings ? "warning" : preference?.enabled ? "primary" : "neutral"
          }
        >
          {statusText}
        </StatusChip>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-background/80 px-3 py-2">
          <input
            type="checkbox"
            checked={draft.enabled}
            disabled={!active || !canUseRemoteSettings || !preference || isBusy}
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
            disabled={!active || !canUseRemoteSettings || !preference || isBusy}
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
            disabled={!active || !canUseRemoteSettings || !preference || isBusy}
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
            disabled={!active || !canUseRemoteSettings || !preference || isBusy}
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
          {t(feedback.key)}
        </p>
      ) : null}

      {active && canUseRemoteSettings && !preference && !isBusy ? (
        <Button type="button" variant="outline" onClick={retry}>{t("common.tryAgain")}</Button>
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
