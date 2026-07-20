import { useContext } from "react";

import {
  DateDisplayContext,
  DEFAULT_CALENDAR_DISPLAY,
  formatDisplayDate,
  resolveCalendar,
} from "@/shared/date";
import { useI18n } from "@/shared/i18n";

type DateValueHintProps = {
  value?: string;
  className?: string;
};

/**
 * Keeps native date entry ISO-compatible while showing the user-facing calendar
 * representation selected in Settings.
 */
export function DateValueHint({ value, className }: DateValueHintProps) {
  const { language, t } = useI18n();
  const dateDisplay = useContext(DateDisplayContext);

  if (!value) return null;

  const displayedDate = dateDisplay
    ? dateDisplay.formatDate(value)
    : formatDisplayDate(value, {
        language,
        calendar: resolveCalendar(DEFAULT_CALENDAR_DISPLAY, language),
      });

  return (
    <p className={className ?? "text-xs leading-5 text-muted-foreground"}>
      {t("common.dateDisplayPreview", { date: displayedDate })}
    </p>
  );
}
