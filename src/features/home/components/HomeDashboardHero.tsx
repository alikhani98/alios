import {
  ArrowUpLeft,
  CalendarCheck2,
  FolderKanban,
  Inbox,
  Plus,
  Target,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  MiniProgressBar,
  PremiumCard,
  SoftPanel,
  StatusChip,
  CardContent,
  Button,
} from "@/shared/ui";
import { createLinkedGoalPath } from "@/features/projects/projectGoalLinks";
import { createProjectTodayTasksPath } from "@/features/projects/projectTaskProgress";
import type { HomeDashboardData } from "../types";
import type { ReactNode } from "react";

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
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const todayCount = data.today.tasks.length;
  const completedCount = data.today.completedTaskCount;
  const taskCompletionProgress =
    todayCount > 0 ? (completedCount / todayCount) * 100 : 0;
  const checkinSummary = data.today.checkin
    ? t("home.checkinSummary", {
        mood: t(levelLabelKeys[data.today.checkin.moodLevel]),
        energy: t(levelLabelKeys[data.today.checkin.energyLevel]),
      })
    : t("home.noCheckin");
  const mitLabel = data.today.mitTask?.title ?? t("home.noMit");
  const planningFocus = data.planningFocus;
  const weeklyPlan = data.weeklyPlan;

  const heroMetrics = [
    {
      icon: <CalendarCheck2 className="h-5 w-5" />,
      label: t("home.todayTasks"),
      value: String(todayCount),
      description:
        todayCount > 0
          ? `${t("home.completedTasks")}: ${completedCount}`
          : t("home.keepUsingAliOSToSeeMoreInsights"),
      status:
        todayCount > 0 ? (
          <StatusChip tone="primary">
            {Math.round(taskCompletionProgress)}%
          </StatusChip>
        ) : (
          <StatusChip tone="neutral">
            {t("home.keepUsingAliOSToSeeMoreInsights")}
          </StatusChip>
        ),
    },
    {
      icon: <Inbox className="h-5 w-5" />,
      label: t("home.unprocessedInbox"),
      value: String(data.inbox.unprocessedCount),
      description: t("home.inboxItems"),
      status: <StatusChip tone="neutral">{t("home.inboxItems")}</StatusChip>,
    },
    {
      icon: <FolderKanban className="h-5 w-5" />,
      label: t("home.activeProjects"),
      value: String(data.projects.activeCount),
      description:
        data.projects.totalCount > 0
          ? `${t("home.totalProjects")}: ${data.projects.totalCount}`
          : t("home.noRecentProjects"),
      status: <StatusChip tone="neutral">{t("home.activeProjects")}</StatusChip>,
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: t("home.goals"),
      value: String(data.goals.activeCount),
      description:
        data.goals.averageActiveProgress === null
          ? t("home.goalsNoProgress")
          : `${t("home.averageProgress")}: ${Math.round(
              data.goals.averageActiveProgress
            )}%`,
      status: (
        <StatusChip tone={data.goals.reviewDueCount > 0 ? "warning" : "neutral"}>
          {t("home.goalsReviewDue")}: {data.goals.reviewDueCount}
        </StatusChip>
      ),
    },
  ];

  return (
    <PremiumCard className="overflow-hidden border-primary/20 bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
          <div className="border-b border-primary/10 p-5 sm:p-6 xl:border-b-0 xl:border-e">
            <div className="rounded-[1.75rem] bg-primary p-5 text-primary-foreground shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs font-semibold text-primary-foreground/75">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(new Date())}
                  </p>
                  <p className="text-base font-semibold">{t("home.mit")}</p>
                </div>
                <Badge
                  className="border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15"
                  variant="outline"
                >
                  {completedCount} / {todayCount}
                </Badge>
              </div>

              <p className="mt-5 break-words text-xl font-semibold leading-8 sm:text-2xl">
                {mitLabel}
              </p>
              <div className="mt-5 space-y-3">
                <MiniProgressBar
                  value={taskCompletionProgress}
                  label={t("home.completion")}
                />
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
                    {checkinSummary}
                  </span>
                  <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
                  {t("home.completedTasks")}: {completedCount}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="secondary" className="min-h-11 w-full sm:w-auto">
                  <Link to="/today">
                    <CalendarCheck2 className="me-2 h-4 w-4" />
                    {t("home.goToday")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="min-h-11 w-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                >
                  <Link to="/inbox">
                    <Plus className="me-2 h-4 w-4" />
                    {t("nav.inbox")}
                  </Link>
                </Button>
              </div>
              {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {planningFocus ? (
                <SoftPanel className="space-y-3 border-primary/10 bg-background/85">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="h-4 w-4 text-primary" />
                    {t("home.goals")}
                  </div>
                  <StatusChip tone="neutral">{t("nav.projects")}</StatusChip>
                </div>
                <div className="space-y-1">
                  <p className="break-words text-sm font-semibold">{planningFocus.goal.title}</p>
                  {planningFocus.project ? (
                    <p className="break-words text-sm text-muted-foreground">
                      {planningFocus.project.title}
                    </p>
                  ) : null}
                  {planningFocus.task ? (
                    <p className="break-words text-xs leading-6 text-muted-foreground">
                      {planningFocus.task.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                    <Link to={createLinkedGoalPath(planningFocus.goal.id)}>{t("nav.goals")}</Link>
                  </Button>
                  {planningFocus.project ? (
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                      <Link to={createProjectTodayTasksPath(planningFocus.project.id)}>
                        {t("projects.openTodayTasks")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
                </SoftPanel>
              ) : null}

              {weeklyPlan ? (
                <SoftPanel className="space-y-3 border-primary/10 bg-background/85">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t("weeklyReview.nextFocusLabel")}</p>
                  <Button asChild size="sm" variant="ghost"><Link to="/weekly-review">{t("nav.weeklyReview")}</Link></Button>
                </div>
                <p className="break-words text-sm font-semibold">{weeklyPlan.focusTitle}</p>
                {weeklyPlan.intention ? <p className="break-words text-sm leading-7 text-muted-foreground">{weeklyPlan.intention}</p> : null}
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
                </SoftPanel>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("home.quickActions")}</p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("home.description")}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost" className="shrink-0">
                <Link to="/weekly-review">
                  {t("nav.weeklyReview")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {heroMetrics.map((metric) => (
                <SoftPanel
                  key={metric.label}
                  className="min-w-0 space-y-2 border-primary/10 bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-muted-foreground">
                    {metric.icon}
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      {metric.value}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-5">{metric.label}</p>
                  <div className="hidden xl:block">{metric.status}</div>
                </SoftPanel>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
