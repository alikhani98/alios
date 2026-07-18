import { CalendarDays, FolderKanban, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { Button, CardContent, MiniProgressBar, PremiumCard, StatusChip } from "@/shared/ui";

import type { TodayWeeklyPlanFocus } from "../todayWeeklyPlan";

type TodayWeeklyPlanCardProps = {
  focus: TodayWeeklyPlanFocus;
  isLoading: boolean;
};

export function TodayWeeklyPlanCard({ focus, isLoading }: TodayWeeklyPlanCardProps) {
  const { t } = useI18n();
  const progress = focus.linkedTaskTotal > 0
    ? (focus.linkedTaskCompleted / focus.linkedTaskTotal) * 100
    : 0;

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-[1.75rem] border bg-muted/60" />;
  }

  if (!focus.plan) {
    return null;
  }

  return (
    <PremiumCard className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("weeklyReview.title")}
                </p>
                <h2 className="break-words text-lg font-semibold">{focus.plan.focusTitle}</h2>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/weekly-review">{t("nav.weeklyReview")}</Link>
            </Button>
          </div>

          {focus.plan.intention ? (
            <p className="break-words text-sm leading-7 text-muted-foreground">{focus.plan.intention}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {focus.goal ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/goals?${new URLSearchParams({ focusId: focus.goal.id }).toString()}`}>
                  <Target className="me-2 h-4 w-4" />
                  {t("projects.linkedGoal")}
                </Link>
              </Button>
            ) : null}
            {focus.project ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/projects?${new URLSearchParams({ focusId: focus.project.id }).toString()}`}>
                  <FolderKanban className="me-2 h-4 w-4" />
                  {t("today.linkedProject")}
                </Link>
              </Button>
            ) : null}
            {focus.task ? (
              <StatusChip tone={focus.task.status === "done" ? "primary" : "neutral"}>
                {focus.task.title}
              </StatusChip>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t("projects.taskProgress")}</p>
            <StatusChip tone="primary">
              {focus.linkedTaskCompleted} / {focus.linkedTaskTotal}
            </StatusChip>
          </div>
          <MiniProgressBar value={progress} label={t("home.completion")} className="mt-4" />
        </div>
      </CardContent>
    </PremiumCard>
  );
}
