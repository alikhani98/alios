import { formatDisplayDate } from "@/shared/date";
import type { Language } from "@/shared/i18n";

export function getJalaliDatePreview(
  value: string | null | undefined,
  language: Language
): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const formatted = formatDisplayDate(trimmed, {
    language,
    calendar: "jalali",
  });

  return formatted === trimmed ? null : formatted;
}
