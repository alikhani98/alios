import { addDays, format, parseISO } from "date-fns";

import type { Task } from "./types";

export function getNextTaskRecurrenceDate(task: Task): string | undefined {
  if (!task.recurrence || !task.dueDate) {
    return undefined;
  }

  const daysToAdd = task.recurrence.frequency === "daily" ? 1 : 7;
  return format(addDays(parseISO(task.dueDate), daysToAdd), "yyyy-MM-dd");
}
