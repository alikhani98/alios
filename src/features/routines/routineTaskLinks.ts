import type { Routine } from "@/shared/types";

export type TodayTaskFilters = {
  projectId?: string | null;
  routineId?: string | null;
};

export function createTodayTasksPath(filters: TodayTaskFilters = {}): string {
  const searchParams = new URLSearchParams();

  if (filters.projectId) {
    searchParams.set("projectId", filters.projectId);
  }

  if (filters.routineId) {
    searchParams.set("routineId", filters.routineId);
  }

  const query = searchParams.toString();
  return query ? `/today?${query}` : "/today";
}

export function createRoutineTodayTasksPath(routineId: string): string {
  return createTodayTasksPath({ routineId });
}

export function findRoutineFilter(
  routineId: string | null,
  routines: ReadonlyArray<Routine>
): Routine | undefined {
  return routineId
    ? routines.find((routine) => routine.id === routineId)
    : undefined;
}
