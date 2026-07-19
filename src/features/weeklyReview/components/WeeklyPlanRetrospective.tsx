import { History } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { CardContent, MiniProgressBar, PremiumCard, StatusChip } from "@/shared/ui";
import type { WeeklyPlan } from "@/shared/types";

import type { WeeklyPlanExecution } from "../weeklyPlanExecution";
import type { WeeklyPlanLink } from "../weeklyPlanLinks";
import { WeeklyPlanLinks } from "./WeeklyPlanLinks";

type WeeklyPlanRetrospectiveProps = {
  plan?: WeeklyPlan;
  links: ReadonlyArray<WeeklyPlanLink>;
  execution: WeeklyPlanExecution;
  weekLabel?: string;
};

export function WeeklyPlanRetrospective({
  plan,
  links,
  execution,
  weekLabel,
}: WeeklyPlanRetrospectiveProps) {
  const { t } = useI18n();

  if (!plan) {
    return null;
  }

  const progress = execution.total > 0 ? (execution.completed / execution.total) * 100 : 0;
  const status = execution.state === "completed"
    ? { label: t("common.completed"), tone: "success" as const }
    : execution.state === "active"
      ? { label: t("common.active"), tone: "primary" as const }
      : { label: t("weeklyReview.tasksEmptyTitle"), tone: "neutral" as const };

  return (
    <PremiumCard className="border-border/70 bg-muted/25 shadow-none">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
                <History className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("weeklyReview.title")}
                </p>
                <h2 className="break-words text-lg font-semibold">{t("weeklyReview.last7Days")}</h2>
              </div>
            </div>
            {weekLabel ? <StatusChip tone="neutral">{weekLabel}</StatusChip> : null}
          </div>

          <div className="space-y-2">
            <p className="break-words text-base font-semibold leading-7 sm:text-lg">{plan.focusTitle}</p>
            {plan.intention ? (
              <p className="break-words text-sm leading-7 text-muted-foreground">{plan.intention}</p>
            ) : null}
          </div>

          <WeeklyPlanLinks links={links} compact />
        </div>

        <div className="rounded-2xl border bg-background/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t("projects.taskProgress")}</p>
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          </div>
          <MiniProgressBar value={progress} label={t("home.completion")} className="mt-4" />
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{t("weeklyReview.completedTasks")}: {execution.completed}</span>
            <span>{t("weeklyReview.openTasks")}: {execution.open}</span>
          </div>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
