import {
  BookOpenText,
  Brain,
  CalendarCheck2,
  Compass,
  FolderKanban,
  Inbox,
  Target,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  MetricCard,
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
      icon: <Brain className="h-5 w-5" />,
      label: t("home.knowledgeItems"),
      value: String(data.knowledge.totalCount),
      description: t("home.knowledgeOverview"),
      status: <StatusChip tone="neutral">{t("home.knowledgeItems")}</StatusChip>,
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
    {
      icon: <Compass className="h-5 w-5" />,
      label: t("home.lifeAreas"),
      value: String(data.lifeAreas.activeCount),
      description:
        data.lifeAreas.averageSatisfactionScore === null
          ? t("home.lifeAreasNoSatisfaction")
          : `${t("home.lifeAreasAverageSatisfaction")}: ${data.lifeAreas.averageSatisfactionScore.toFixed(1)}/5`,
      status: (
        <StatusChip tone={data.lifeAreas.reviewDueCount > 0 ? "warning" : "neutral"}>
          {t("home.lifeAreasReviewDue")}: {data.lifeAreas.reviewDueCount}
        </StatusChip>
      ),
    },
  ];

  return (
    <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
      <CardContent className="relative p-5 sm:p-6 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-secondary/40 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {formatDate(new Date())}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("home.title")}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
                {t("home.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                {t("home.todayTasks")}: {todayCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Inbox className="h-3.5 w-3.5" />
                {t("home.unprocessedInbox")}: {data.inbox.unprocessedCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                {t("home.activeProjects")}: {data.projects.activeCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <BookOpenText className="h-3.5 w-3.5" />
                {t("home.journalEntries")}: {data.journal.totalCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Target className="h-3.5 w-3.5" />
                {t("home.goals")}: {data.goals.activeCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Compass className="h-3.5 w-3.5" />
                {t("home.lifeAreas")}: {data.lifeAreas.activeCount}
              </Badge>
            </div>

            <SoftPanel className="space-y-3 border-primary/10 bg-background/85">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("home.todayOverview")}
                  </p>
                  <p className="text-sm font-medium">{t("home.mit")}</p>
                </div>
                <Badge variant={data.today.checkin ? "secondary" : "outline"}>
                  {completedCount} / {todayCount}
                </Badge>
              </div>

              <p className="text-sm leading-7 text-muted-foreground">
                {mitLabel}
              </p>
              <MiniProgressBar
                value={taskCompletionProgress}
                label={t("home.completion")}
              />
              <div className="flex flex-wrap gap-2">
                <StatusChip tone={data.today.checkin ? "primary" : "neutral"}>
                  {checkinSummary}
                </StatusChip>
                <StatusChip tone="neutral">
                  {t("home.completedTasks")}: {completedCount}
                </StatusChip>
              </div>
            </SoftPanel>

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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroMetrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
