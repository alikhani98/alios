import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import {
  buildMonthGrid,
  buildWeekdayLabels,
  formatDayNumber,
  formatMonthTitle,
  getWeekStartsOn,
  groupTasksByDate,
  shiftMonth,
} from "@/features/home/calendarMonth";
import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PremiumCard, SectionHeader } from "@/shared/ui";
import { cn } from "@/shared/utils";

const taskStatusLabelKeys: Record<Task["status"], TranslationKey> = {
  todo: "today.todo",
  doing: "today.doing",
  done: "today.done",
  deferred: "today.deferred",
  cancelled: "today.cancelled",
};

export function CalendarPage() {
  const { tasks: tasksRepository } = useStorageAdapter();
  const { t, language, direction } = useI18n();
  const { formatDate, resolvedCalendar } = useDateFormatter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("month");

  const loadTasks = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      setTasks(await tasksRepository.list());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [tasksRepository]);

  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const today = new Date();
  const visibleMonth = startOfMonth(selectedDate);
  const selectedIsoDate = format(selectedDate, "yyyy-MM-dd");
  const selectedTasks = groupedTasks[selectedIsoDate] ?? [];
  const weekStartsOn = getWeekStartsOn(language);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn });
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthCells = buildMonthGrid(visibleMonth, groupedTasks, { today, weekStartsOn });
  const weekdayLabels = buildWeekdayLabels(visibleMonth, { language, calendar: resolvedCalendar });
  const weekLabels = buildWeekdayLabels(weekStart, { language, calendar: resolvedCalendar });
  const PreviousIcon = direction === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = direction === "rtl" ? ChevronLeft : ChevronRight;
  const todayIsoDate = format(today, "yyyy-MM-dd");

  const movePeriod = (directionOffset: -1 | 1) => {
    setSelectedDate((current) =>
      calendarMode === "week"
        ? addDays(current, directionOffset * 7)
        : shiftMonth(current, directionOffset)
    );
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-primary/5">
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<CalendarDays className="h-5 w-5" />}
            title={t("calendar.title")}
            description={t("calendar.description")}
          />
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{calendarMode === "month" ? formatMonthTitle(visibleMonth, { language, calendar: resolvedCalendar }) : formatDate(weekStart)}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("calendar.tasksForDate", { date: formatDate(selectedDate) })}</p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <Button type="button" size="sm" variant="outline" onClick={() => movePeriod(-1)}>
              <PreviousIcon className="me-2 h-4 w-4" />
              {calendarMode === "week" ? t("home.previousWeek") : t("home.previousMonth")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedDate(new Date())}>
              {calendarMode === "week" ? t("home.currentWeek") : t("home.currentMonth")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => movePeriod(1)}>
              {calendarMode === "week" ? t("home.nextWeek") : t("home.nextMonth")}
              <NextIcon className="ms-2 h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCalendarMode((mode) => mode === "month" ? "week" : "month")}>
              {calendarMode === "week" ? t("home.monthView") : t("home.weekView")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasError ? (
            <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("calendar.loadError")}</p>
              <Button size="sm" variant="outline" onClick={() => void loadTasks()}>
                <RotateCcw className="me-2 h-4 w-4" />
                {t("common.tryAgain")}
              </Button>
            </div>
          ) : isLoading ? (
            <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
          ) : calendarMode === "week" ? (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {weekDates.map((date, index) => {
                const isoDate = format(date, "yyyy-MM-dd");
                const taskCount = groupedTasks[isoDate]?.length ?? 0;
                return (
                  <button key={isoDate} type="button" onClick={() => setSelectedDate(date)} aria-pressed={isoDate === selectedIsoDate} className={cn("flex min-h-28 flex-col justify-between rounded-xl border p-2 text-center transition hover:border-primary/50 hover:shadow-sm sm:min-h-40 sm:rounded-2xl sm:p-4", isoDate === selectedIsoDate && "border-primary bg-primary/5", isoDate === todayIsoDate && "ring-1 ring-primary/25")}>
                    <span className="text-[0.65rem] font-medium text-muted-foreground sm:text-sm">{weekLabels[index]}</span>
                    <span className="text-lg font-semibold tabular-nums sm:text-3xl">{formatDayNumber(date, { language, calendar: resolvedCalendar })}</span>
                    <Badge variant="secondary" className="mx-auto w-fit">{taskCount}</Badge>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-medium text-muted-foreground sm:text-sm">
                {weekdayLabels.map((label) => <span key={label} className="p-1 sm:p-2">{label}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                {monthCells.map((cell) => {
                  const secondaryLabel = resolvedCalendar === "jalali" ? formatDayNumber(cell.date, { language, calendar: "gregorian" }) : null;
                  return (
                    <button key={cell.isoDate} type="button" onClick={() => setSelectedDate(cell.date)} aria-pressed={cell.isoDate === selectedIsoDate} className={cn("flex min-h-20 flex-col justify-between rounded-xl border p-2 text-start transition hover:border-primary/50 hover:shadow-sm sm:min-h-32 sm:rounded-2xl sm:p-3", cell.isCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground", cell.isoDate === selectedIsoDate && "border-primary bg-primary/5", cell.isToday && "ring-1 ring-primary/25")}>
                      <span className="text-sm font-semibold sm:text-lg">{formatDayNumber(cell.date, { language, calendar: resolvedCalendar })}</span>
                      {secondaryLabel ? <span className="text-[0.625rem] text-muted-foreground">{secondaryLabel}</span> : null}
                      {cell.taskCount > 0 ? <Badge variant="secondary" className="w-fit">{cell.taskCount}</Badge> : <span />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("home.itemsForThisDay")}</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link to={`/today?${new URLSearchParams({ date: selectedIsoDate }).toString()}`}>{t("calendar.openSelectedDay")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("calendar.noTasks")}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {selectedTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 font-medium">{task.title}</p>
                    <Badge variant={task.status === "done" ? "secondary" : "outline"}>{t(taskStatusLabelKeys[task.status])}</Badge>
                  </div>
                  {task.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </PremiumCard>
    </section>
  );
}
