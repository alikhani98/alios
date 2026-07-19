import { format, startOfWeek, subWeeks } from "date-fns";

export function getWeeklyPlanWeekStart(referenceDate = new Date()): string {
  return format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function getPreviousWeeklyPlanWeekStart(referenceDate = new Date()): string {
  return format(
    subWeeks(startOfWeek(referenceDate, { weekStartsOn: 1 }), 1),
    "yyyy-MM-dd"
  );
}
