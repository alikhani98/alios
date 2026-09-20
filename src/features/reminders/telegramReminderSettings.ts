export type TelegramReminderPreference = Readonly<{
  enabled: boolean;
  channel: "telegram";
  telegramChatId: string;
  timezone: string;
  morningTime: string;
  lastSentLocalDate?: string | null;
}>;

export type TelegramReminderPreferenceInput = Readonly<{
  enabled: boolean;
  channel: "telegram";
  telegramChatId: string;
  timezone: string;
  morningTime: string;
}>;

export const defaultTelegramReminderPreference: TelegramReminderPreference = {
  enabled: false,
  channel: "telegram",
  telegramChatId: "",
  timezone: "UTC",
  morningTime: "08:00",
  lastSentLocalDate: null,
};

const chatIdPattern = /^-?[0-9]+$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function getBrowserTimeZone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof timezone === "string" && timezone.length > 0
      ? timezone
      : "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidReminderTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function validateTelegramReminderPreference(
  input: TelegramReminderPreferenceInput
): string | null {
  if (input.channel !== "telegram") {
    return "settings.telegramReminderChannelValidation";
  }

  const chatId = input.telegramChatId.trim();
  if (input.enabled && chatId.length === 0) {
    return "settings.telegramReminderChatIdRequired";
  }

  if (chatId.length > 0 && !chatIdPattern.test(chatId)) {
    return "settings.telegramReminderChatIdValidation";
  }

  if (!isValidReminderTimeZone(input.timezone)) {
    return "settings.telegramReminderTimezoneValidation";
  }

  if (!timePattern.test(input.morningTime)) {
    return "settings.telegramReminderMorningTimeValidation";
  }

  return null;
}

export function normalizeTelegramReminderPreference(
  input: TelegramReminderPreferenceInput
): TelegramReminderPreferenceInput {
  return {
    enabled: input.enabled,
    channel: "telegram",
    telegramChatId: input.telegramChatId.trim(),
    timezone: input.timezone.trim() || "UTC",
    morningTime: input.morningTime,
  };
}

export function getTelegramReminderTimeZoneOptions(
  browserTimeZone = getBrowserTimeZone()
): string[] {
  return Array.from(
    new Set([
      browserTimeZone,
      "Asia/Tehran",
      "UTC",
      "Europe/London",
      "Europe/Berlin",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Dubai",
      "Asia/Tokyo",
    ])
  ).filter(isValidReminderTimeZone);
}
