import {
  ArrowUpLeft,
  CalendarCheck2,
  CalendarDays,
  FolderKanban,
  Inbox,
  Plus,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { createProjectTodayTasksPath } from "@/features/projects/projectTaskProgress";
import { createLinkedGoalPath } from "@/features/projects/projectGoalLinks";
import { formatFinanceAmount } from "@/features/finance/financeCalculations";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  CardContent,
  MiniProgressBar,
  PremiumCard,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import type { HomeDashboardData } from "../types";

type HomeDashboardHeroProps = {
  data: HomeDashboardData;
  actions?: ReactNode;
};

const levelLabelKeys = {
  low: "common.low",
  medium: "common.medium",
  good: "common.good",
} as const;

const weeklyPlanLinkLabelKeys = {
  goal: "projects.linkedGoal",
  project: "today.linkedProject",
  task: "nav.today",
} as const;

export function HomeDashboardHero({ data, actions }: HomeDashboardHeroProps) {
  const { t, language } = useI18n();
  const { formatDate } = useDateFormatter();
  const financeLocale = language === "fa" ? "fa-IR" : "en-US";
  const todayCount = data.today.tasks.length;
  const completedCount = data.today.completedTaskCount;
  const taskCompletionProgress = todayCount > 0 ? (completedCount / todayCount) * 100 : 0;
  const checkinSummary = data.today.checkin
    ? t("home.checkinSummary", {
        mood: t(levelLabelKeys[data.today.checkin.moodLevel]),
        energy: t(levelLabelKeys[data.today.checkin.energyLevel]),
      })
    : t("home.noCheckin");
  const primaryFocus = data.today.mitTask?.title ?? data.planningFocus?.task?.title ?? t("home.noMit");
  const planningFocus = data.planningFocus;
  const weeklyPlan = data.weeklyPlan;
  const financeStatusTone =
    data.finance.remainingLiquidity < 0
      ? "danger"
      : data.finance.activeObligationCount > 0
        ? "warning"
        : "success";

  return (
<PremiumCard className="overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 shadow-md">
  <CardContent className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="primary">{formatDate(new Date())}</StatusChip>
          <StatusChip tone="neutral">{checkinSummary}</StatusChip>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t("home.todayOverview")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem]">
            {primaryFocus}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {t("home.primaryDashboardDescription")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="min-h-11 w-full sm:w-auto">
              <Link to="/today">
                <CalendarCheck2 className="me-2 h-4 w-4" />
                {t("home.goToday")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
              <Link to="/inbox">
                <Plus className="me-2 h-4 w-4" />
                {t("inbox.captureItem")}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="min-h-11 w-full sm:w-auto">
              <Link to="/weekly-review">
                {t("nav.weeklyReview")}
                <ArrowUpLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <SoftPanel className="space-y-4 border-border/60 bg-background/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("home.dailyPlan")}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("home.dailyPlanDescription")}
                </p>
              </div>
<Badge variant="secondary">
  {completedCount} / {todayCount}
</Badge>
            </div>
            <MiniProgressBar value={taskCompletionProgress} label={t("home.completion")} />
            <div className="grid gap-3 lg:grid-cols-3">
              <SoftPanel className="min-h-44 justify-between gap-4 border-border/60 bg-background/90">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="h-4 w-4 text-primary" />
                    {t("home.goals")}
                  </div>
                  {planningFocus ? (
                    <>
                      <p className="break-words text-base font-semibold">{planningFocus.goal.title}</p>
                      {planningFocus.project ? (
                        <p className="break-words text-sm leading-6 text-muted-foreground">
                          {planningFocus.project.title}
                        </p>
                      ) : null}
                      {planningFocus.task ? (
                        <p className="break-words text-sm leading-6 text-muted-foreground">
                          {planningFocus.task.title}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground">{t("home.goalsNoProgress")}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                    <Link to={planningFocus ? createLinkedGoalPath(planningFocus.goal.id) : "/goals"}>
                      {t("nav.goals")}
                    </Link>
                  </Button>
                  {planningFocus?.project ? (
                    <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
                      <Link to={createProjectTodayTasksPath(planningFocus.project.id)}>
                        {t("projects.openTodayTasks")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </SoftPanel>

              <SoftPanel className="min-h-44 justify-between gap-4 border-border/60 bg-background/90">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {t("weeklyReview.nextFocusLabel")}
                  </div>
                  {weeklyPlan ? (
                    <>
                      <p className="break-words text-base font-semibold">{weeklyPlan.focusTitle}</p>
                      {weeklyPlan.intention ? (
                        <p className="break-words text-sm leading-6 text-muted-foreground">
                          {weeklyPlan.intention}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t("weeklyReview.noDataDescription")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {data.weeklyPlanLinks?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {data.weeklyPlanLinks.map((link) =>
                        link.to ? (
                          <Button key={`${link.kind}-${link.id}`} asChild size="sm" variant="outline">
                            <Link to={link.to}>{t(weeklyPlanLinkLabelKeys[link.kind])}</Link>
                          </Button>
                        ) : (
                          <StatusChip key={`${link.kind}-${link.id}`} tone="warning">
                            {t("lifeAreas.linkedGoalsUnavailable")}
                          </StatusChip>
                        )
                      )}
                    </div>
                  ) : null}
                  <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
                    <Link to="/weekly-review">{t("nav.weeklyReview")}</Link>
                  </Button>
                </div>
              </SoftPanel>

              <SoftPanel className="min-h-44 justify-between gap-4 border-primary/10 bg-primary/5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    {t("nav.finance")}
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatFinanceAmount(data.finance.remainingLiquidity, financeLocale)} {t("finance.currency")}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("finance.remainingLiquidity")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone={financeStatusTone}>
                    {t("finance.activeObligations")}: {data.finance.activeObligationCount}
                  </StatusChip>
                  <StatusChip tone="neutral">
                    {t("finance.remainingObligationTotal")}:{" "}
                    {formatFinanceAmount(data.finance.remainingObligationTotal, financeLocale)}
                  </StatusChip>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                  <Link to="/finance">{t("nav.finance")}</Link>
                </Button>
              </SoftPanel>
            </div>
          </SoftPanel>

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="space-y-4">
          <SoftPanel className="space-y-4 border-border/60 bg-background/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("home.localSnapshot")}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("home.description")}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost" className="shrink-0">
                <Link to="/settings">
                  {t("nav.settings")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SoftPanel className="space-y-2 border-border/60 bg-background/90">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("home.todayTasks")}
                </p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">{todayCount}</p>
                <StatusChip tone={todayCount > 0 ? "primary" : "neutral"}>
                  {t("home.completedTasks")}: {completedCount}
                </StatusChip>
              </SoftPanel>
              <SoftPanel className="space-y-2 border-border/60 bg-background/90">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("home.unprocessedInbox")}
                </p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.inbox.unprocessedCount}
                </p>
                <StatusChip tone={data.inbox.unprocessedCount > 0 ? "warning" : "neutral"}>
                  {t("home.inboxItems")}
                </StatusChip>
              </SoftPanel>
              <SoftPanel className="space-y-2 border-border/60 bg-background/90">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("home.goals")}
                </p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.goals.activeCount}
                </p>
                <StatusChip tone={data.goals.reviewDueCount > 0 ? "warning" : "neutral"}>
                  {t("home.goalsReviewDue")}: {data.goals.reviewDueCount}
                </StatusChip>
              </SoftPanel>
              <SoftPanel className="space-y-2 border-border/60 bg-background/90">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("home.manualOverview")}
                </p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  {data.manual.reviewDueCount}
                </p>
                <StatusChip tone={data.manual.reviewDueCount > 0 ? "warning" : "neutral"}>
                  {t("manual.reviewDue")}
                </StatusChip>
              </SoftPanel>
            </div>
          </SoftPanel>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
