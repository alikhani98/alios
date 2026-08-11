import { ArrowUpLeft, CheckSquare2, Inbox, Plus, Repeat2, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import {
  Button,
  CardContent,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import type { HomeDashboardData } from "../types";

function findCurrentFocus(data: HomeDashboardData): Task | undefined {
  return data.today.mitTask
    ?? data.today.tasks.find((task) => task.status === "doing")
    ?? data.today.tasks.find((task) => task.status === "todo");
}

function findUrgentTask(data: HomeDashboardData): Task | undefined {
  const today = new Date().toISOString().slice(0, 10);

  return data.tasks
    .filter(
      (task) =>
        (task.status === "todo" || task.status === "doing") &&
        task.dueDate &&
        task.dueDate <= today
    )
    .sort((first, second) => {
      const dateComparison = (first.dueDate ?? "").localeCompare(second.dueDate ?? "");
      return dateComparison === 0
        ? second.updatedAt.localeCompare(first.updatedAt)
        : dateComparison;
    })[0];
}

function createTodayTaskFocusPath(task: Task): string {
  const searchParams = new URLSearchParams({ focusId: task.id });
  if (task.dueDate) {
    searchParams.set("date", task.dueDate);
  }
  return `/today?${searchParams.toString()}`;
}

export function ClearStartCard({
  data,
}: {
  data: HomeDashboardData;
}) {
  const { t } = useI18n();
  const currentFocus = findCurrentFocus(data);
  const urgentTask = currentFocus ? undefined : findUrgentTask(data);
  const activeTaskCount = data.today.tasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  ).length;
  const inboxBacklogCount = data.inbox.unprocessedCount;
  const suggestedInboxBatchCount = Math.min(3, inboxBacklogCount);
  const routineSuggestion = activeTaskCount === 0 && !urgentTask && inboxBacklogCount === 0
    ? data.routineSuggestion
    : undefined;
  const shouldStartWithInbox = activeTaskCount === 0 && !urgentTask && inboxBacklogCount > 0;
  const shouldStartWithRoutine = Boolean(routineSuggestion);
  const suggestedTask = currentFocus ?? urgentTask;
  const primaryActionHref = shouldStartWithInbox
    ? "/inbox"
    : routineSuggestion
      ? `/today?${new URLSearchParams({ routineId: routineSuggestion.id }).toString()}`
      : suggestedTask
        ? createTodayTaskFocusPath(suggestedTask)
        : "/today";
  const primaryActionLabel = shouldStartWithInbox
    ? t("home.clearStartProcessInbox")
    : routineSuggestion
      ? t("home.clearStartAddRoutine")
    : t("home.clearStartAddTask");
  const primaryActionIcon = shouldStartWithInbox ? (
    <Inbox className="me-2 h-4 w-4" aria-hidden="true" />
  ) : routineSuggestion ? (
    <Repeat2 className="me-2 h-4 w-4" aria-hidden="true" />
  ) : (
    <Plus className="me-2 h-4 w-4" aria-hidden="true" />
  );
  const emptyActionTitle = shouldStartWithInbox
    ? t("home.clearStartInboxBacklogTitle", {
        count: inboxBacklogCount,
      })
    : routineSuggestion
      ? t("home.clearStartRoutineTitle", { title: routineSuggestion.title })
      : t("today.noTasks");
  const emptyActionDescription = shouldStartWithInbox
    ? t("home.clearStartInboxBacklogDescription", {
        count: suggestedInboxBatchCount,
      })
    : routineSuggestion
      ? t("home.clearStartRoutineDescription")
      : t("today.noTasksDescription");

  return (
    <PremiumCard className="alios-home-now-surface">
      <CardContent className="relative z-10 grid gap-5 p-5 ps-12 sm:p-6 sm:ps-14 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-5">
          <SectionHeader
            eyebrow={t("home.title")}
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            title={t("home.clearStartTitle")}
            description={t("home.clearStartDescription")}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SoftPanel className="gap-2 border-border/70 bg-background/90">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("home.todayTasks")}
              </p>
              <p className="font-mono text-2xl font-semibold tabular-nums">{activeTaskCount}</p>
              <p className="text-sm text-muted-foreground">{t("common.active")}</p>
            </SoftPanel>

            <SoftPanel className="alios-home-thread-anchor gap-2 border-alios-herb/30 bg-background/90">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("home.unprocessedInbox")}
              </p>
              <p className="font-mono text-2xl font-semibold tabular-nums">
                {inboxBacklogCount}
              </p>
              <p className="text-sm text-muted-foreground">{t("inbox.unprocessed")}</p>
            </SoftPanel>
          </div>
        </div>

        <SoftPanel className="alios-home-thread-panel flex h-full flex-col justify-between gap-5">
          <div className="alios-home-thread-anchor alios-home-thread-item flex items-start gap-3">
            <span className="alios-icon-primary alios-home-thread-node flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              {currentFocus ? (
                <Target className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CheckSquare2 className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {suggestedTask
                  ? urgentTask
                    ? t("home.clearStartUrgentLabel")
                    : t("home.clearStartFocusLabel")
                  : t("home.clearStartEmptyLabel")}
              </p>
              <p className="break-words text-xl font-semibold leading-8">
                {suggestedTask?.title ?? emptyActionTitle}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {suggestedTask
                  ? urgentTask
                    ? t("home.clearStartUrgentDescription")
                    : t("today.tasksDescription")
                  : emptyActionDescription}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Button asChild className="alios-home-thread-item w-full bg-alios-caspian text-white hover:bg-alios-caspian/90 dark:bg-alios-paper dark:text-alios-night dark:hover:bg-alios-paper/90">
              <Link to={primaryActionHref}>
                {primaryActionIcon}
                {primaryActionLabel}
              </Link>
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="alios-home-thread-item w-full border-alios-herb/35">
                <Link to="/inbox">
                  <Inbox className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("inbox.captureItem")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="alios-home-thread-anchor alios-home-thread-item w-full text-alios-caspian hover:bg-alios-saffron/10 dark:text-alios-paper">
                <Link to="/weekly-review">
                  {t("weeklyReview.title")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <StatusChip tone={activeTaskCount > 0 || urgentTask ? "primary" : shouldStartWithInbox ? "warning" : shouldStartWithRoutine ? "success" : "neutral"} className="alios-home-thread-item w-fit">
            {shouldStartWithInbox ? (
              t("home.clearStartInboxBacklogStatus", { count: suggestedInboxBatchCount })
            ) : routineSuggestion ? (
              t("home.clearStartRoutineStatus")
            ) : urgentTask ? (
              t("home.clearStartUrgentStatus")
            ) : (
              <>
                <span className="font-mono tabular-nums">{activeTaskCount}</span> {t("common.active")}
              </>
            )}
          </StatusChip>
        </SoftPanel>
      </CardContent>
    </PremiumCard>
  );
}
