import { format, getDay, parseISO, subDays } from "date-fns";

import type { Routine, Task } from "@/shared/types";

function getTaskCompletionDate(task: Task): string | undefined {
  return task.dueDate ?? task.completedAt?.slice(0, 10);
}

export function getRoutineCurrentStreak(
  routine: Pick<Routine, "id" | "weekdays">,
  tasks: ReadonlyArray<Task>,
  today = format(new Date(), "yyyy-MM-dd")
): number {
  const completedDates = new Set(
    tasks
      .filter((task) => task.routineId === routine.id && task.status === "done")
      .map(getTaskCompletionDate)
      .filter((date): date is string => Boolean(date))
  );
  let cursor = parseISO(today);
  let streak = 0;

  for (let lookback = 0; lookback < 366; lookback += 1) {
    if (routine.weekdays.includes(getDay(cursor))) {
      const date = format(cursor, "yyyy-MM-dd");
      if (!completedDates.has(date)) {
        break;
      }
      streak += 1;
    }
    cursor = subDays(cursor, 1);
  }

  return streak;
}
