import type { Routine, Task } from "@/shared/types";

export function getRoutineSuggestions(routines: ReadonlyArray<Routine>, tasks: ReadonlyArray<Task>, date: string, weekday: number): Routine[] {
  const created = new Set(tasks.filter((task) => task.dueDate === date && task.routineId).map((task) => task.routineId));
  return routines.filter((routine) => routine.isActive && routine.weekdays.includes(weekday) && !created.has(routine.id));
}

export function createRoutineTaskInput(routine: Routine, dueDate: string) {
  return { title: routine.title, description: routine.description, status: "todo" as const, priority: routine.priority, dueDate, isMit: false, routineId: routine.id };
}
