import { format } from "date-fns";
import { useMemo, useState } from "react";

import { useRoutines } from "@/features/routines/hooks/useRoutines";
import { getRoutineSuggestions } from "@/features/today/routineSuggestions";
import { formatDisplayDate } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import { cn } from "@/shared/utils";
import { useTodayData } from "../hooks/useTodayData";

function getWeekdayLabelKey(weekday: number): TranslationKey {
  switch (weekday) {
    case 0:
      return "routines.weekday0";
    case 1:
      return "routines.weekday1";
    case 2:
      return "routines.weekday2";
    case 3:
      return "routines.weekday3";
    case 4:
      return "routines.weekday4";
    case 5:
      return "routines.weekday5";
    default:
      return "routines.weekday6";
  }
}

function orderWidgetTasks(tasks: Task[]): Task[] {
  const rank = (task: Task) => {
    if (task.isMit) return 0;
    if (task.status === "doing") return 1;
    if (task.status === "todo") return 2;
    if (task.status === "deferred") return 3;
    if (task.status === "done") return 4;
    return 5;
  };

  return [...tasks].sort((left, right) => {
    const rankDiff = rank(left) - rank(right);
    if (rankDiff !== 0) return rankDiff;

    if (left.priority !== right.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[left.priority] - priorityOrder[right.priority];
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function TodayWidgetPage() {
  const { t } = useI18n();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDate = new Date(`${today}T00:00:00`);
  const dateLabel = `${t(getWeekdayLabelKey(todayDate.getDay()))}، ${formatDisplayDate(today, {
    language: "fa",
    calendar: "jalali",
  })}`;
  const { tasks, isLoading, updateTaskStatus } = useTodayData(today);
  const { entries: routines, isLoading: isRoutinesLoading } = useRoutines();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const orderedTasks = useMemo(() => orderWidgetTasks(tasks), [tasks]);
  const routineSuggestions = useMemo(
    () => getRoutineSuggestions(routines, tasks, today, new Date().getDay()),
    [routines, tasks, today]
  );
  const doneCount = orderedTasks.filter((task) => task.status === "done").length;
  const totalCount = orderedTasks.length;
  const hasTasks = orderedTasks.length > 0;
  const hasRoutines = routineSuggestions.length > 0;
  const isInitialLoading = isLoading || isRoutinesLoading;
  const progressMessage = t("todayWidget.progress", {
    done: doneCount,
    total: totalCount,
  });
  const doneCountText = String(doneCount);
  const doneCountIndex = progressMessage.indexOf(doneCountText);

  const toggleTask = async (task: Task) => {
    setBusyTaskId(task.id);
    try {
      await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#101820] p-4 font-sans text-white"
      aria-busy={isInitialLoading}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col gap-5">
        <p className="text-xs font-semibold leading-6 text-[#E7A928]">
          {dateLabel}
        </p>

        {!isInitialLoading && !hasTasks && !hasRoutines ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm font-medium text-white/85">
            {t("todayWidget.emptyState")}
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5">
            {hasTasks ? (
              <section className="space-y-3">
                <h1 className="text-sm font-semibold text-white">
                  {t("todayWidget.tasks")}
                </h1>
                <div className="space-y-2">
                  {orderedTasks.map((task) => {
                    const isDone = task.status === "done";
                    const prefix = task.isMit
                      ? "⭐"
                      : task.priority === "high" && !isDone
                        ? "🔴"
                        : "";

                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={busyTaskId === task.id}
                        onClick={() => void toggleTask(task)}
                        className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#172033] px-3 py-2 text-start text-sm leading-6 text-white transition hover:bg-[#1f2b44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7A928] disabled:cursor-wait disabled:opacity-60"
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold",
                            isDone
                              ? "border-[#5F8D6A] bg-[#5F8D6A] text-[#101820]"
                              : "border-[#E7A928] text-[#E7A928]"
                          )}
                          aria-hidden="true"
                        >
                          {isDone ? "✓" : "○"}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 break-words",
                            isDone && "text-white/45 line-through"
                          )}
                        >
                          {prefix ? `${prefix} ` : ""}
                          {task.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {hasRoutines ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white">
                  {t("todayWidget.routines")}
                </h2>
                <div className="space-y-2">
                  {routineSuggestions.map((routine) => (
                    <div
                      key={routine.id}
                      className="rounded-xl bg-[#172033] px-3 py-2 text-sm leading-6 text-white/85"
                    >
                      {routine.title}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {hasTasks ? (
          <footer className="text-center text-xs font-semibold text-white/55">
            {doneCountIndex >= 0 ? (
              <>
                {progressMessage.slice(0, doneCountIndex)}
                <span className="text-[#5F8D6A]">{doneCountText}</span>
                {progressMessage.slice(doneCountIndex + doneCountText.length)}
              </>
            ) : (
              progressMessage
            )}
          </footer>
        ) : null}
      </div>
    </main>
  );
}
