import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { SoftPanel } from "@/shared/ui";

export type ReminderChannel = "telegram" | "web_push";

export interface ReminderChannelSelectorProps {
  currentChannel: ReminderChannel;
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
  const { t } = useI18n();
  const [pendingChannel, setPendingChannel] = useState<ReminderChannel | null>(
    null
  );

  if (!hasTelegram || !hasWebPush) {
    return null;
  }

  const isBusy = pendingChannel !== null;

  const selectChannel = async (channel: ReminderChannel) => {
    if (disabled || isBusy || channel === currentChannel) {
      return;
    }

    setPendingChannel(channel);
    try {
      await onChannelChange(channel);
    } finally {
      setPendingChannel(null);
    }
  };

  return (
    <SoftPanel className="space-y-3 alios-surface-muted">
      <p className="text-sm font-semibold text-alios-caspian dark:text-alios-paper">
        {t("reminders.channelSelector.label")}
      </p>
      <div
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
              aria-checked={isSelected}
              disabled={disabled || isBusy}
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
    </SoftPanel>
  );
}
