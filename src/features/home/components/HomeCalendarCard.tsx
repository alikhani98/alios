import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import {
  ArrowUpLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import {
  Badge,
  Button,
  CollapsibleSection,
  SoftPanel,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  buildMonthGrid,
  buildWeekdayLabels,
  formatDayNumber,
  formatMonthTitle,
  getWeekStartsOn,
  groupTasksByDate,
  shiftMonth,
} from "../calendarMonth";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";

type HomeCalendarCardProps = {
  tasks: Task[];
  sectionId: HomeCollapsibleSectionId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const taskStatusLabelKeys: Record<Task["status"], TranslationKey> = {
  todo: "today.todo",
  doing: "today.doing",
  done: "today.done",
  deferred: "today.deferred",
  cancelled: "today.cancelled",
};

export function HomeCalendarCard({
  tasks,
  sectionId,
  open,
  onOpenChange,
}: HomeCalendarCardProps) {
  const { t, language, direction } = useI18n();
  const { formatDate, resolvedCalendar } = useDateFormatter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const groupedTasks = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const visibleMonth = startOfMonth(selectedDate);
  const today = new Date();
  const weekdayLabels = buildWeekdayLabels(visibleMonth, {
    language,
    calendar: resolvedCalendar,
  });
  const calendarCells = buildMonthGrid(visibleMonth, groupedTasks, {
    today,
    weekStartsOn: getWeekStartsOn(language),
  });
  const selectedIsoDate = format(selectedDate, "yyyy-MM-dd");
  const selectedTasks = groupedTasks[selectedIsoDate] ?? [];
  const monthTitle = formatMonthTitle(visibleMonth, {
    language,
    calendar: resolvedCalendar,
  });
  const selectedDateLabel = formatDate(selectedDate);
  const isTodaySelected = format(today, "yyyy-MM-dd") === selectedIsoDate;
  const PreviousIcon = direction === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = direction === "rtl" ? ChevronLeft : ChevronRight;
  const monthTaskCount = calendarCells.reduce(
    (count, cell) => count + cell.taskCount,
    0
  );
  const weekStart = startOfWeek(selectedDate, {
    weekStartsOn: getWeekStartsOn(language),
  });
  const weekDates = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index)
  );
  const weekLabels = buildWeekdayLabels(weekStart, {
    language,
    calendar: resolvedCalendar,
  });

  return (
    <CollapsibleSection
      id={`home-${sectionId}`}
      title={t("home.calendar")}
      description={calendarMode === "week" ? formatDate(weekStart) : monthTitle}
      icon={<CalendarDays className="h-5 w-5" />}
      status={<Badge variant="secondary">{monthTaskCount}</Badge>}
      open={open}
      onOpenChange={onOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
      contentClassName="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            setSelectedDate((currentDate) =>
              calendarMode === "week"
                ? addDays(currentDate, -7)
                : shiftMonth(currentDate, -1)
            )
          }
        >
          <PreviousIcon className="me-2 h-4 w-4" />
          {calendarMode === "week" ? t("home.previousWeek") : t("home.previousMonth")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setSelectedDate(() => new Date())}
        >
          {calendarMode === "week" ? t("home.currentWeek") : t("home.currentMonth")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() =>
            setSelectedDate((currentDate) =>
              calendarMode === "week"
                ? addDays(currentDate, 7)
                : shiftMonth(currentDate, 1)
            )
          }
        >
          {calendarMode === "week" ? t("home.nextWeek") : t("home.nextMonth")}
          <NextIcon className="ms-2 h-4 w-4" />
        </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => setCalendarMode((currentMode) => currentMode === "week" ? "month" : "week")}
        >
          {calendarMode === "week" ? t("home.monthView") : t("home.weekView")}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          {calendarMode === "week" ? (
            <div className="pb-1">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekDates.map((date, index) => {
                  const isoDate = format(date, "yyyy-MM-dd");
                  const taskCount = groupedTasks[isoDate]?.length ?? 0;
                  const isSelected = isoDate === selectedIsoDate;
                  const isToday = isoDate === format(today, "yyyy-MM-dd");

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      aria-pressed={isSelected}
                      aria-label={formatDate(date)}
                      className={cn(
                        "flex min-w-0 min-h-24 flex-col justify-between rounded-xl border p-1.5 text-center transition-[transform,box-shadow,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:rounded-2xl sm:p-3 sm:text-start",
                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-background hover:border-primary/50",
                        isToday && "ring-1 ring-primary/25"
                      )}
                    >
                      <span className="truncate text-[0.625rem] font-medium text-muted-foreground sm:text-xs">
                        {weekLabels[index]}
                      </span>
                      <span className="text-base font-semibold tabular-nums sm:text-xl">
                        {formatDayNumber(date, { language, calendar: resolvedCalendar })}
                      </span>
                      <span className={cn("truncate text-[0.625rem] font-medium sm:text-xs", taskCount > 0 ? "text-primary" : "text-muted-foreground")}>
                        <span className="sm:hidden">{taskCount || "—"}</span>
                        <span className="hidden sm:inline">
                          {taskCount > 0 ? `${taskCount} ${t("home.todayTasks")}` : t("home.noItemsForThisDay")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {weekdayLabels.map((label) => (
                  <div key={label} className="px-1 py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
              const isSelected = cell.isoDate === selectedIsoDate;
              const secondaryLabel =
                resolvedCalendar === "jalali"
                  ? formatDayNumber(cell.date, {
                      language,
                      calendar: "gregorian",
                    })
                  : null;

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() => setSelectedDate(cell.date)}
                  aria-pressed={isSelected}
                  aria-label={formatDate(cell.date)}
                  className={cn(
                    "flex min-h-20 flex-col justify-between rounded-2xl border p-2 text-start transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none hover:-translate-y-0.5 hover:shadow-sm",
                    cell.isCurrentMonth
                      ? "bg-background hover:border-primary/50"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                    cell.isToday && "border-primary/60 ring-1 ring-primary/25",
                    isSelected && "border-primary bg-primary/5 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="block text-sm font-semibold leading-none">
                        {formatDayNumber(cell.date, {
                          language,
                          calendar: resolvedCalendar,
                        })}
                      </span>
                      {secondaryLabel ? (
                        <span className="block text-[0.65rem] leading-none text-muted-foreground">
                          {secondaryLabel}
                        </span>
                      ) : null}
                    </div>
                    {cell.taskCount > 0 ? (
                      <Badge variant="secondary" className="shrink-0 px-2 py-0.5">
                        {cell.taskCount}
                      </Badge>
                    ) : null}
                  </div>
                  {cell.isToday ? (
                    <span className="mt-2 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
                      {t("home.today")}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="mt-2 block text-[0.65rem] text-transparent"
                    >
                      .
                    </span>
                  )}
                </button>
              );
                })}
              </div>
            </>
          )}
        </div>

        <SoftPanel className="space-y-4 border-primary/10 bg-background/85 lg:self-start">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t("home.itemsForThisDay")}</p>
              <p className="text-sm text-muted-foreground">{selectedDateLabel}</p>
            </div>
            {isTodaySelected ? (
              <Badge variant="secondary">{t("home.today")}</Badge>
            ) : null}
          </div>

          {selectedTasks.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("home.tasksOnThisDay")}
              </p>
              <div className="space-y-2">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border bg-background px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-sm font-medium leading-6">
                        {task.title}
                      </p>
                      <Badge
                        variant={task.status === "done" ? "secondary" : "outline"}
                        className="shrink-0"
                      >
                        {t(taskStatusLabelKeys[task.status])}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("home.noItemsForThisDay")}
            </p>
          )}
        </SoftPanel>
      </div>

      <div className="flex flex-col justify-end gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link to="/today">
            {t("home.goToday")}
            <ArrowUpLeft className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </CollapsibleSection>
  );
}
