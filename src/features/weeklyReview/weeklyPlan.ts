import { format, startOfWeek } from "date-fns";

export function getWeeklyPlanWeekStart(referenceDate = new Date()): string {
  return format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
}
