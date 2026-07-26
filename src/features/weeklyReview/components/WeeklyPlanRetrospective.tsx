import { History } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { CardContent, MiniProgressBar, PremiumCard, SoftPanel, StatusChip } from "@/shared/ui";
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
    <PremiumCard className="alios-surface-muted border-border/70 shadow-none">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1.15rem] border bg-muted text-muted-foreground">
                <History className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("weeklyReview.last7Days")}
                </p>
                <h2 className="break-words text-lg font-semibold">{plan.focusTitle}</h2>
              </div>
            </div>
            {weekLabel ? <StatusChip tone="neutral">{weekLabel}</StatusChip> : null}
          </div>

          {plan.intention ? (
            <p className="break-words text-sm leading-7 text-muted-foreground">{plan.intention}</p>
          ) : null}

          <WeeklyPlanLinks links={links} compact />
        </div>

        <SoftPanel className="alios-surface-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t("projects.taskProgress")}</p>
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          </div>
          <MiniProgressBar value={progress} label={t("home.completion")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs text-muted-foreground">{t("weeklyReview.completedTasks")}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{execution.completed}</p>
            </SoftPanel>
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs text-muted-foreground">{t("weeklyReview.openTasks")}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{execution.open}</p>
            </SoftPanel>
          </div>
        </SoftPanel>
      </CardContent>
    </PremiumCard>
  );
}
