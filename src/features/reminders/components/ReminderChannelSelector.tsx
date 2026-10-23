import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { SoftPanel } from "@/shared/ui";
import type { PersistedReminderDeliveryChannel, ReminderDeliveryChannel } from "../telegramReminderSettings";

export type ReminderChannel = ReminderDeliveryChannel;

export interface ReminderChannelSelectorProps {
  currentChannel: PersistedReminderDeliveryChannel;
  hasTelegram: boolean;
  hasWebPush: boolean;
  onChannelChange: (channel: ReminderChannel) => Promise<void>;
  disabled?: boolean;
}

const options: ReadonlyArray<{
  value: ReminderChannel;
  labelKey:
    | "reminders.channelSelector.telegram"
    | "reminders.channelSelector.webPush";
}> = [
  { value: "telegram", labelKey: "reminders.channelSelector.telegram" },
  { value: "web_push", labelKey: "reminders.channelSelector.webPush" },
];

export function ReminderChannelSelector({
  currentChannel,
  hasTelegram,
  hasWebPush,
  onChannelChange,
  disabled = false,
}: ReminderChannelSelectorProps) {
  const { t, direction } = useI18n();
  const [pendingChannel, setPendingChannel] = useState<ReminderChannel | null>(
    null
  );
  const submitting = useRef(false);
  const group = useRef<HTMLDivElement>(null);
  const [selectionError, setSelectionError] = useState(false);
  useEffect(() => {
    if (pendingChannel !== null || !group.current?.contains(document.activeElement)) return;
    group.current.querySelector<HTMLButtonElement>(`[data-channel="${currentChannel}"]`)?.focus();
  }, [currentChannel, pendingChannel]);

  if (!hasTelegram && !hasWebPush && currentChannel !== "both") {
    return null;
  }

  const isBusy = pendingChannel !== null;
  const availableOptions = options.filter((option) => option.value === "telegram" ? hasTelegram || currentChannel === "both" : hasWebPush);
  const tabStop = availableOptions.find((option) => option.value === currentChannel)?.value ?? availableOptions[0]?.value;

  const selectChannel = async (channel: ReminderChannel) => {
    if (disabled || submitting.current || channel === currentChannel) {
      return;
    }

    setSelectionError(false);
    submitting.current = true;
    setPendingChannel(channel);
    try {
      await onChannelChange(channel);
    } catch {
      setSelectionError(true);
    } finally {
      submitting.current = false;
      setPendingChannel(null);
    }
  };

  return (
    <SoftPanel className="space-y-3 alios-surface-muted">
      <p className="text-sm font-semibold text-alios-caspian dark:text-alios-paper">
        {t("reminders.channelSelector.label")}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("reminders.channelSelector.help")}
      </p>
      {currentChannel === "both" ? (
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {t("reminders.channelSelector.legacyBoth")}
        </p>
      ) : null}
      <div
        ref={group}
        dir={direction}
        role="radiogroup"
        aria-label={t("reminders.channelSelector.label")}
        aria-busy={isBusy}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((option) => {
          const isSelected = currentChannel === option.value;
          const isPending = pendingChannel === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              data-channel={option.value}
              aria-checked={isSelected}
              aria-disabled={disabled || isBusy}
              tabIndex={option.value === tabStop ? 0 : -1}
              onKeyDown={(event) => {
                if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
                event.preventDefault();
                if (disabled || submitting.current) return;
                const enabled = availableOptions;
                const index = enabled.findIndex((item) => item.value === option.value);
                const forward = event.key === "ArrowDown" || event.key === (direction === "rtl" ? "ArrowLeft" : "ArrowRight");
                const next = enabled[(index + (forward ? 1 : -1) + enabled.length) % enabled.length];
                if (!next) return;
                group.current?.querySelector<HTMLButtonElement>(`[data-channel="${next.value}"]`)?.focus();
                void selectChannel(next.value);
              }}
              disabled={(disabled && !isBusy) || !(option.value === "telegram"
                ? hasTelegram || currentChannel === "both"
                : hasWebPush)}
              onClick={() => {
                void selectChannel(option.value);
              }}
              className={`min-w-0 rounded-surface border px-4 py-3 text-start text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                isSelected
                  ? "border-alios-saffron/50 bg-alios-saffron/10 text-alios-caspian shadow-sm dark:text-alios-paper"
                  : "border-border/70 bg-background/70 text-muted-foreground hover:border-alios-saffron/35 hover:bg-alios-saffron/5"
              } ${isPending ? "animate-pulse" : ""}`}
            >
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
      {selectionError ? <p role="alert" className="text-sm text-destructive">{t("settings.telegramReminderSaveError")}</p> : null}
    </SoftPanel>
  );
}
