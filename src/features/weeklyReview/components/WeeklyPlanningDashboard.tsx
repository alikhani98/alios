import { CalendarDays, CircleAlert, CircleCheckBig, ClipboardList, Target } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import type { WeeklyPlan } from "@/shared/types";
import {
  Button,
  CardContent,
  MiniProgressBar,
  PremiumCard,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import type { WeeklyPlanExecution } from "../weeklyPlanExecution";
import type { WeeklyPlanLink } from "../weeklyPlanLinks";
import { WeeklyPlanLinks } from "./WeeklyPlanLinks";

type WeeklyPlanningDashboardProps = {
  plan?: WeeklyPlan;
  links: ReadonlyArray<WeeklyPlanLink>;
  execution: WeeklyPlanExecution;
  reviewQueueCount: number;
};

export function WeeklyPlanningDashboard({
  plan,
  links,
  execution,
  reviewQueueCount,
}: WeeklyPlanningDashboardProps) {
  const { t } = useI18n();
  const progress = execution.total > 0 ? (execution.completed / execution.total) * 100 : 0;
  const executionStatus = execution.state === "completed"
    ? { label: t("common.completed"), tone: "success" as const }
    : execution.state === "active"
      ? { label: t("common.active"), tone: "primary" as const }
      : { label: t("weeklyReview.tasksEmptyTitle"), tone: "neutral" as const };

  return (
    <PremiumCard className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background shadow-md">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:p-8">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="alios-icon-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem]">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("weeklyReview.nextFocusLabel")}
                </p>
                <h2 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
                  {plan?.focusTitle ?? t("weeklyReview.nextFocusTitle")}
                </h2>
              </div>
            </div>
            <StatusChip tone={plan ? "primary" : "neutral"}>
              {plan ? t("common.changesSaved") : t("common.notRecorded")}
            </StatusChip>
          </div>

          <p className="max-w-2xl break-words text-sm leading-7 text-muted-foreground">
            {plan?.intention ?? t("weeklyReview.nextFocusDescription")}
          </p>

          <WeeklyPlanLinks links={links} compact />

          <div className="grid gap-3 sm:grid-cols-3">
            <SoftPanel className="space-y-2 border-primary/15 bg-background/90">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
                </span>
                <StatusChip tone={executionStatus.tone}>{executionStatus.label}</StatusChip>
              </div>
              <p className="text-sm font-semibold">{t("projects.taskProgress")}</p>
              <MiniProgressBar value={progress} label={t("home.completion")} />
            </SoftPanel>

            <SoftPanel className="space-y-2 alios-surface-muted">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                </span>
                <StatusChip tone="primary">{execution.completed} / {execution.total}</StatusChip>
              </div>
              <p className="text-sm font-semibold">{t("weeklyReview.completedTasks")}</p>
            </SoftPanel>

            <SoftPanel className="space-y-2 alios-surface-muted">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                </span>
                <StatusChip tone={reviewQueueCount > 0 ? "warning" : "neutral"}>{reviewQueueCount}</StatusChip>
              </div>
              <p className="text-sm font-semibold">{t("weeklyReview.needsReview")}</p>
            </SoftPanel>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
            <Button asChild className="w-full sm:w-auto">
              <a href="#weekly-plan-editor">
                <Target className="me-2 h-4 w-4" />
                {t("weeklyReview.nextFocusLabel")}
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href="#weekly-review-queue">{t("weeklyReview.needsReview")}</a>
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <SoftPanel className="space-y-3 border-primary/20 bg-background/90 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
              </span>
              <StatusChip tone={executionStatus.tone}>{executionStatus.label}</StatusChip>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t("weeklyReview.openTasks")}</p>
              <p className="text-2xl font-semibold tabular-nums">{execution.open}</p>
              <p className="text-sm text-muted-foreground">{t("weeklyReview.localOnlyNote")}</p>
            </div>
          </SoftPanel>

          <SoftPanel className="space-y-3 alios-surface-muted">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              </span>
              <StatusChip tone="neutral">{execution.total}</StatusChip>
            </div>
            <p className="text-sm font-semibold">{t("weeklyReview.tasksSection")}</p>
          </SoftPanel>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
