import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
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
import { downloadCalendarIcs, getCalendarExportTasks } from "../calendarIcsExport";
import "../calendar-presentation.css";

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
  const narrowWeekdayFormatter = new Intl.DateTimeFormat(
    language === "fa" ? "fa-IR" : "en-US",
    { weekday: "narrow" }
  );
  const PreviousIcon = direction === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = direction === "rtl" ? ChevronLeft : ChevronRight;
  const todayIsoDate = format(today, "yyyy-MM-dd");
  const exportableTaskCount = getCalendarExportTasks(tasks).length;

  const movePeriod = (directionOffset: -1 | 1) => {
    setSelectedDate((current) =>
      calendarMode === "week"
        ? addDays(current, directionOffset * 7)
        : shiftMonth(current, directionOffset)
    );
  };

  return (
    <section className="alios-page alios-calendar space-y-5 px-0 sm:px-6">
      <PremiumCard className="alios-now-surface alios-page-entry">
        <CardContent className="p-0 pb-4 sm:p-0 sm:pb-5">
          <SectionHeader
            variant="page"
            icon={<CalendarDays className="h-5 w-5" />}
            title={t("calendar.title")}
            description={t("calendar.description")}
            actions={<Button type="button" size="sm" variant="outline" disabled={exportableTaskCount === 0} onClick={() => downloadCalendarIcs(tasks)}><Download className="me-2 h-4 w-4" />{t("calendar.exportIcs")}</Button>}
          />
        </CardContent>
      </PremiumCard>

      <p className="calendar-export-note text-xs leading-6 text-muted-foreground">{t("calendar.exportIcsHint", { count: exportableTaskCount })}</p>

      <div className="calendar-layout">
        <PremiumCard className="calendar-workspace">
          <CardHeader className="calendar-toolbar gap-3">
            <div className="calendar-period space-y-1">
              <CardTitle>{calendarMode === "month" ? formatMonthTitle(visibleMonth, { language, calendar: resolvedCalendar }) : formatDate(weekStart)}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("calendar.tasksForDate", { date: formatDate(selectedDate) })}</p>
            </div>
            <div className="calendar-controls">
              <div className="calendar-period-controls">
                <Button type="button" size="icon" variant="outline" title={calendarMode === "week" ? t("home.previousWeek") : t("home.previousMonth")} onClick={() => movePeriod(-1)}>
                  <PreviousIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{calendarMode === "week" ? t("home.previousWeek") : t("home.previousMonth")}</span>
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedDate(new Date())}>
                  {calendarMode === "week" ? t("home.currentWeek") : t("home.currentMonth")}
                </Button>
                <Button type="button" size="icon" variant="outline" title={calendarMode === "week" ? t("home.nextWeek") : t("home.nextMonth")} onClick={() => movePeriod(1)}>
                  <span className="sr-only">{calendarMode === "week" ? t("home.nextWeek") : t("home.nextMonth")}</span>
                  <NextIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setCalendarMode((mode) => mode === "month" ? "week" : "month")}>
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                {calendarMode === "week" ? t("home.monthView") : t("home.weekView")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="calendar-grid-content space-y-3">
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
              <div className="calendar-week-grid">
                {weekDates.map((date, index) => {
                  const isoDate = format(date, "yyyy-MM-dd");
                  const taskCount = groupedTasks[isoDate]?.length ?? 0;
                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      aria-label={`${formatDate(date)}, ${t("settings.tasksCount")}: ${taskCount.toLocaleString(language)}`}
                      aria-current={isoDate === todayIsoDate ? "date" : undefined}
                      aria-pressed={isoDate === selectedIsoDate}
                      className={cn(
                        "calendar-date calendar-week-date transition-colors motion-reduce:transition-none",
                        isoDate === selectedIsoDate && "border-primary bg-primary/10",
                        isoDate === todayIsoDate && "ring-1 ring-primary/35"
                      )}
                    >
                      <span className="calendar-weekday-label">{weekLabels[index]}</span>
                      <span className="calendar-day-number">{formatDayNumber(date, { language, calendar: resolvedCalendar })}</span>
                      <Badge variant="secondary" className="calendar-count">{taskCount.toLocaleString(language)}</Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="calendar-weekday-grid text-center text-xs font-medium text-muted-foreground">
                  {weekdayLabels.map((label, index) => (
                    <span key={label} title={label} aria-label={label} className="min-w-0 py-1 sm:p-2">
                      <span aria-hidden="true" className="calendar-weekday-narrow">{narrowWeekdayFormatter.format(monthCells[index].date)}</span>
                      <span className="calendar-weekday-full">{label}</span>
                    </span>
                  ))}
                </div>
                <div className="calendar-month-grid">
                  {monthCells.map((cell) => {
                    const secondaryLabel = resolvedCalendar === "jalali" ? formatDayNumber(cell.date, { language, calendar: "gregorian" }) : null;
                    return (
                      <button
                        key={cell.isoDate}
                        type="button"
                        onClick={() => setSelectedDate(cell.date)}
                        aria-label={`${formatDate(cell.date)}, ${t("settings.tasksCount")}: ${cell.taskCount.toLocaleString(language)}`}
                        aria-current={cell.isToday ? "date" : undefined}
                        aria-pressed={cell.isoDate === selectedIsoDate}
                        className={cn(
                          "calendar-date calendar-month-date transition-colors motion-reduce:transition-none",
                          cell.isCurrentMonth ? "bg-card" : "calendar-adjacent",
                          cell.isoDate === selectedIsoDate && "border-primary bg-primary/10",
                          cell.isToday && "ring-1 ring-primary/35"
                        )}
                      >
                        <span className="calendar-day-number">{formatDayNumber(cell.date, { language, calendar: resolvedCalendar })}</span>
                        {secondaryLabel ? <span className="calendar-secondary-date">{secondaryLabel}</span> : null}
                        {cell.taskCount > 0 ? <Badge variant="secondary" className="calendar-count">{cell.taskCount.toLocaleString(language)}</Badge> : <span />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </PremiumCard>

        <PremiumCard className="calendar-details">
          <CardHeader className="calendar-details-header gap-3">
            <div className="space-y-1">
              <CardTitle>{t("home.itemsForThisDay")}</CardTitle>
              <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
              <Link to={`/today?${new URLSearchParams({ date: selectedIsoDate }).toString()}`}>{t("calendar.openSelectedDay")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="calendar-details-content">
            {selectedTasks.length === 0 ? (
              <p className="calendar-empty text-sm leading-7 text-muted-foreground">{t("calendar.noTasks")}</p>
            ) : (
              <ul className="calendar-task-list">
                {selectedTasks.map((task) => (
                  <li key={task.id} className="calendar-task">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 basis-40 break-words text-sm font-semibold leading-7">{task.title}</p>
                      <Badge variant={task.status === "done" ? "secondary" : "outline"}>{t(taskStatusLabelKeys[task.status])}</Badge>
                    </div>
                    {task.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </PremiumCard>
      </div>
    </section>
  );
}
