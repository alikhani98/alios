import { CheckCircle2, Clock3, Compass, RotateCcw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { Goal } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MiniProgressBar,
  StatusChip,
} from "@/shared/ui";

import {
  GOAL_AREA_LABEL_KEYS,
  GOAL_IMPORTANCE_LABEL_KEYS,
  GOAL_STATUS_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "../constants";
import { createLifeAreaFocusPath } from "../goalAreaNavigation";

type GoalCardProps = {
  goal: Goal;
  isReviewDue: boolean;
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
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
  onMarkCompleted,
  onReactivate,
}: GoalCardProps) {
  const { t } = useI18n();
  const { formatDateTime, formatDate } = useDateFormatter();

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="break-words">{goal.title}</CardTitle>
            <CardDescription className="break-words whitespace-pre-wrap">
              {goal.description}
            </CardDescription>
          </div>
          <StatusChip tone={isReviewDue ? "warning" : "neutral"}>
            {t(GOAL_STATUS_LABEL_KEYS[goal.status])}
          </StatusChip>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
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
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t("goals.progressLabel")}: {goal.progressPercent}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-4">
        <MiniProgressBar
          value={goal.progressPercent}
          label={t("goals.progressLabel")}
        />

        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
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
        ) : null}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
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
