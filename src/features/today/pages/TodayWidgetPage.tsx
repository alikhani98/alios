import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { formatDisplayDate } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
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

function getClockLabel(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getTopPriorityTask(tasks: Task[]): Task | undefined {
  const openTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  );

  return (
    openTasks.find((task) => task.isMit) ??
    openTasks.find((task) => task.status === "doing") ??
    openTasks.find((task) => task.status === "todo")
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
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
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [clockLabel, setClockLabel] = useState(() => getClockLabel(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockLabel(getClockLabel(new Date()));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const mainTask = useMemo(() => getTopPriorityTask(tasks), [tasks]);
  const remainingOpenCount = Math.max(
    0,
    tasks.filter((task) => task.status === "todo" || task.status === "doing")
      .length - (mainTask ? 1 : 0)
  );

  const markDone = async (task: Task) => {
    setBusyTaskId(task.id);
    try {
      await updateTaskStatus(task.id, "done");
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#101820] p-4 font-sans text-white"
      aria-busy={isLoading}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col gap-6">
        <header className="space-y-3 pt-8 text-center">
          <p className="text-6xl font-semibold tabular-nums leading-none tracking-normal text-white">
            {clockLabel}
          </p>
          <p className="text-xs font-semibold leading-6 text-[#E7A928]">
            {dateLabel}
          </p>
        </header>

        <section className="flex flex-1 items-center">
          {mainTask ? (
            <div className="w-full rounded-3xl border border-white/10 bg-[#172033] p-5 shadow-sm">
              <p className="break-words text-center text-2xl font-semibold leading-10 text-white">
                {mainTask.title}
              </p>
              <button
                type="button"
                disabled={busyTaskId === mainTask.id}
                onClick={() => void markDone(mainTask)}
                aria-label={`انجام شد: ${mainTask.title}`}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#E7A928] px-4 text-lg font-bold text-[#101820] transition hover:bg-[#f0bd4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60"
              >
                ✓
              </button>
            </div>
          ) : !isLoading ? (
            <div className="w-full text-center text-sm font-medium leading-6 text-white/85">
              {t("todayWidget.emptyState")}
            </div>
          ) : null}
        </section>

        {mainTask ? (
          <p className="text-center text-sm font-semibold text-white/55">
            {formatCount(remainingOpenCount)} {t("todayWidget.remainingTasks")}
          </p>
        ) : null}

        <a
          href="/"
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-4 text-sm font-bold text-[#101820] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7A928]"
        >
          {t("todayWidget.openApp")}
        </a>
      </div>
    </main>
  );
}
