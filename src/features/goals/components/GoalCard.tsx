import {
  CheckCircle2,
  Clock3,
  Compass,
  FolderKanban,
  ListChecks,
  RotateCcw,
  Target,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { Goal } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  MiniProgressBar,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import {
  GOAL_AREA_LABEL_KEYS,
  GOAL_IMPORTANCE_LABEL_KEYS,
  GOAL_STATUS_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "../constants";
import { createLifeAreaFocusPath } from "../goalAreaNavigation";
import { createGoalProjectsPath, type GoalProjectProgress } from "../goalProjectProgress";
import { createTodayTasksPath } from "@/features/routines/routineTaskLinks";

type GoalCardProps = {
  goal: Goal;
  isReviewDue: boolean;
  projectProgress?: GoalProjectProgress;
  isProjectProgressLoading?: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkReviewed: () => void;
  onMarkCompleted: () => void;
  onReactivate: () => void;
};

export function GoalCard({
  goal,
  isReviewDue,
  projectProgress,
  isProjectProgressLoading,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
  onMarkCompleted,
  onReactivate,
}: GoalCardProps) {
  const { t } = useI18n();
  const { formatDateTime, formatDate } = useDateFormatter();
  const progressLabel = `${goal.progressPercent}%`;
  const linkedProjectSummary = isProjectProgressLoading
    ? t("common.loading")
    : projectProgress && projectProgress.projectCount > 0
      ? `${projectProgress.completedProjectCount}/${projectProgress.projectCount}`
      : t("common.notRecorded");
  const linkedTaskSummary = !isProjectProgressLoading && projectProgress && projectProgress.taskCount > 0
    ? `${projectProgress.completedTaskCount}/${projectProgress.taskCount}`
    : t("common.notRecorded");

  return (
    <Card className={isReviewDue ? "min-w-0 overflow-hidden border-warning/20 bg-warning/5" : "min-w-0 overflow-hidden"}>
      <CardHeader className="space-y-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={isReviewDue ? "warning" : goal.status === "completed" ? "success" : "neutral"}>
                {t(GOAL_STATUS_LABEL_KEYS[goal.status])}
              </StatusChip>
              {isReviewDue ? (
                <StatusChip tone="warning">{t("goals.reviewDue")}</StatusChip>
              ) : null}
            </div>
            <CardTitle className="break-words text-xl leading-8">{goal.title}</CardTitle>
          </div>
          <div className="shrink-0 text-end">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("goals.progressLabel")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{progressLabel}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 border-t border-border/70 pt-3">
          <Badge
            variant="secondary"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t(GOAL_AREA_LABEL_KEYS[goal.area])}
          </Badge>
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t(GOAL_TIMEFRAME_LABEL_KEYS[goal.timeframe])}
          </Badge>
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t(GOAL_IMPORTANCE_LABEL_KEYS[goal.importance])}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-4">
        <SoftPanel className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t("goals.progressLabel")}</p>
            <StatusChip tone={goal.progressPercent >= 100 ? "success" : "primary"}>
              {progressLabel}
            </StatusChip>
          </div>
          <MiniProgressBar
            value={goal.progressPercent}
            label={t("goals.progressLabel")}
          />
        </SoftPanel>

        <CollapsibleSection
          id={`goal-${goal.id}-details`}
          title={t("goals.goalDetails")}
          description={t("goals.goalDetailsDescription")}
          icon={<Target className="h-5 w-5" />}
          status={<StatusChip tone="primary">{progressLabel}</StatusChip>}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          className="rounded-2xl border border-border/70 bg-muted/20 shadow-none"
          contentClassName="space-y-4"
        >
          <SoftPanel className="space-y-2">
            <p className="text-sm font-semibold">{t("goals.descriptionLabel")}</p>
            <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {goal.description}
            </p>
          </SoftPanel>

          <div className="grid gap-3 lg:grid-cols-2">
            <SoftPanel className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                    {t("projects.title")}
                  </p>
                  <p className="break-words text-base font-semibold">{linkedProjectSummary}</p>
                  <p className="break-words text-xs leading-5 text-muted-foreground">
                    {t("projects.taskProgress")}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link to={createGoalProjectsPath(goal.id)}>
                    <FolderKanban className="me-2 h-4 w-4" />
                    {t("projects.title")}
                  </Link>
                </Button>
              </div>
            </SoftPanel>

            <SoftPanel className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                    {t("nav.today")}
                  </p>
                  <p className="break-words text-base font-semibold">{linkedTaskSummary}</p>
                  <p className="break-words text-xs leading-5 text-muted-foreground">
                    {t("projects.openTodayTasks")}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0">
                  <Link to={createTodayTasksPath({ goalId: goal.id })}>
                    <ListChecks className="me-2 h-4 w-4" />
                    {t("nav.today")}
                  </Link>
                </Button>
              </div>
            </SoftPanel>
          </div>

          <div className="grid gap-2 border-t border-border/70 pt-4 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="min-w-0 break-words">
              {t("goals.targetDateLabel")}:{" "}
              {goal.targetDate ? formatDate(goal.targetDate) : t("common.notRecorded")}
            </p>
            <p className="min-w-0 break-words">
              {t("goals.reviewIntervalDaysLabel")}:{" "}
              {goal.reviewIntervalDays ?? t("common.notRecorded")}
            </p>
            <p className="min-w-0 break-words">
              {t("goals.lastReviewedLabel")}:{" "}
              {goal.lastReviewedAt
                ? formatDateTime(goal.lastReviewedAt)
                : t("common.notRecorded")}
            </p>
            <p className="min-w-0 break-words">
              {t("goals.updatedAtLabel")}: {formatDateTime(goal.updatedAt)}
            </p>
          </div>

          {goal.tags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("goals.tagsLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {goal.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="max-w-full break-words whitespace-normal text-start"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CollapsibleSection>

        <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <Link to={createLifeAreaFocusPath(goal.area)}>
              <Compass className="me-2 h-4 w-4" />
              {t("goals.openLifeArea")}
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onEdit}
          >
            <Target className="me-2 h-4 w-4" />
            {t("common.edit")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isDeleting}
            onClick={onDelete}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {t("common.delete")}
          </Button>
          {goal.status === "active" && isReviewDue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onMarkReviewed}
            >
              <Clock3 className="me-2 h-4 w-4" />
              {t("goals.markReviewed")}
            </Button>
          ) : null}
          {goal.status !== "completed" ? (
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={onMarkCompleted}
            >
              <CheckCircle2 className="me-2 h-4 w-4" />
              {t("goals.markCompleted")}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onReactivate}
            >
              <RotateCcw className="me-2 h-4 w-4" />
              {t("goals.reactivate")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
