import { CheckCircle2, Pencil, RotateCcw, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { GOAL_AREA_LABEL_KEYS } from "@/features/goals/constants";
import { createGoalsForAreaPath } from "@/features/goals/goalAreaNavigation";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatusChip,
} from "@/shared/ui";

import {
  LIFE_AREA_ATTENTION_LABEL_KEYS,
  LIFE_AREA_STATUS_LABEL_KEYS,
} from "../constants";
import {
  getLifeAreaAttentionTone,
  isLifeAreaReviewDue,
  type LifeAreaView,
} from "../lifeAreas";
import type { LifeAreaGoalSummary } from "../lifeAreaGoals";

type LifeAreaCardProps = {
  area: LifeAreaView;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkReviewed: () => Promise<void>;
  isFocused?: boolean;
  goalSummary: LifeAreaGoalSummary;
  isGoalSummaryLoading: boolean;
  isGoalSummaryUnavailable: boolean;
};

export function LifeAreaCard({
  area,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
  isFocused,
  goalSummary,
  isGoalSummaryLoading,
  isGoalSummaryUnavailable,
}: LifeAreaCardProps) {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const reviewDue = isLifeAreaReviewDue(area);

  return (
    <Card
      className={[
        "flex h-full min-w-0 flex-col overflow-hidden border-border/70 bg-background/90 shadow-sm transition-shadow",
        isFocused ? "ring-2 ring-primary/20" : "",
      ].join(" ")}
    >
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="break-words leading-7">{area.title}</CardTitle>
            <CardDescription className="break-words whitespace-pre-wrap">
              {area.description}
            </CardDescription>
          </div>
          <div className="flex w-full min-w-0 flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
            <StatusChip
              tone={
                area.status === "archived"
                  ? "neutral"
                  : area.status === "paused"
                    ? "warning"
                    : "primary"
              }
            >
              {t(LIFE_AREA_STATUS_LABEL_KEYS[area.status])}
            </StatusChip>
            {reviewDue ? <StatusChip tone="warning">{t("lifeAreas.reviewDue")}</StatusChip> : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t(GOAL_AREA_LABEL_KEYS[area.areaKey])}
          </Badge>
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start"
          >
            {t("lifeAreas.attentionLabel")}: {t(LIFE_AREA_ATTENTION_LABEL_KEYS[area.attentionLevel])}
          </Badge>
          {typeof area.satisfactionScore === "number" ? (
            <Badge
              variant="outline"
              className="max-w-full break-words whitespace-normal text-start"
            >
              {t("lifeAreas.satisfactionLabel")}: {area.satisfactionScore}/5
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="min-w-0 break-words">
            {t("lifeAreas.reviewIntervalDaysLabel")}:{" "}
            {area.reviewIntervalDays ?? t("common.notRecorded")}
          </p>
          <p className="min-w-0 break-words">
            {t("lifeAreas.lastReviewedLabel")}:{" "}
            {area.lastReviewedAt
              ? formatDateTime(area.lastReviewedAt)
              : t("common.notRecorded")}
          </p>
          <p className="min-w-0 break-words">
            {t("lifeAreas.updatedAtLabel")}:{" "}
            {area.updatedAt ? formatDateTime(area.updatedAt) : t("common.notRecorded")}
          </p>
          <p className="min-w-0 break-words">
            {t("lifeAreas.createdAtLabel")}:{" "}
            {area.createdAt ? formatDateTime(area.createdAt) : t("common.notRecorded")}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
              <Target className="h-4 w-4 shrink-0 text-primary" />
              <span className="break-words">{t("lifeAreas.linkedGoals")}</span>
            </p>
            <StatusChip tone="neutral">
              {isGoalSummaryLoading
                ? t("common.loading")
                : isGoalSummaryUnavailable
                  ? t("lifeAreas.linkedGoalsUnavailable")
                  : goalSummary.totalCount}
            </StatusChip>
          </div>
          {!isGoalSummaryLoading && !isGoalSummaryUnavailable ? (
            <div className="mt-3 grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <p className="min-w-0 break-words">
                {t("lifeAreas.linkedActiveGoals")}: {goalSummary.activeCount}
              </p>
              <p className="min-w-0 break-words">
                {t("lifeAreas.linkedCompletedGoals")}: {goalSummary.completedCount}
              </p>
              <p className="min-w-0 break-words">
                {t("lifeAreas.linkedAverageProgress")}: {" "}
                {goalSummary.averageActiveProgress === null
                  ? t("common.notRecorded")
                  : `${Math.round(goalSummary.averageActiveProgress)}%`}
              </p>
            </div>
          ) : null}
        </div>

        {area.focusNote.trim().length > 0 ? (
          <div className="rounded-2xl border bg-background/70 px-3 py-3 sm:px-4">
            <p className="text-xs text-muted-foreground">{t("lifeAreas.focusNoteLabel")}</p>
            <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-7">
              {area.focusNote}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/30 px-3 py-3 sm:px-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("lifeAreas.noFocusNote")}
            </p>
          </div>
        )}

        {area.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {area.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="max-w-full break-words whitespace-normal text-start leading-5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t px-4 pb-4 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 sm:pb-6">
        {confirmingDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? t("common.deleting") : t("common.confirmDelete")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              size="sm"
              className="w-full sm:w-auto"
            >
              <Link to={createGoalsForAreaPath(area.areaKey)}>
                <Target className="me-2 h-4 w-4" />
                {t("lifeAreas.openLinkedGoals")}
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={onEdit}>
              <Pencil className="me-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
            {area.status !== "archived" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void onMarkReviewed()}
              >
                <CheckCircle2 className="me-2 h-4 w-4" />
                {t("lifeAreas.markReviewed")}
              </Button>
            ) : null}
            {area.isPersisted ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="w-full text-destructive hover:text-destructive sm:w-auto"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t("lifeAreas.resetArea")}
              </Button>
            ) : null}
            {reviewDue ? (
              <StatusChip tone={getLifeAreaAttentionTone(area.attentionLevel)}>
                {t("lifeAreas.reviewDue")}
              </StatusChip>
            ) : null}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
