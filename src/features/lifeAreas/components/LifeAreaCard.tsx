import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

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
import { GOAL_AREA_LABEL_KEYS } from "@/features/goals";

import {
  LIFE_AREA_ATTENTION_LABEL_KEYS,
  LIFE_AREA_STATUS_LABEL_KEYS,
} from "../constants";
import {
  getLifeAreaAttentionTone,
  isLifeAreaReviewDue,
  type LifeAreaView,
} from "../lifeAreas";

type LifeAreaCardProps = {
  area: LifeAreaView;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkReviewed: () => Promise<void>;
  isFocused?: boolean;
};

export function LifeAreaCard({
  area,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
  isFocused,
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
      <CardHeader className="space-y-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="break-words leading-7">{area.title}</CardTitle>
            <CardDescription className="break-words whitespace-pre-wrap">
              {area.description}
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
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

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t(GOAL_AREA_LABEL_KEYS[area.areaKey])}</Badge>
          <Badge variant="outline">
            {t("lifeAreas.attentionLabel")}: {t(LIFE_AREA_ATTENTION_LABEL_KEYS[area.attentionLevel])}
          </Badge>
          {typeof area.satisfactionScore === "number" ? (
            <Badge variant="outline">
              {t("lifeAreas.satisfactionLabel")}: {area.satisfactionScore}/5
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            {t("lifeAreas.reviewIntervalDaysLabel")}:{" "}
            {area.reviewIntervalDays ?? t("common.notRecorded")}
          </p>
          <p>
            {t("lifeAreas.lastReviewedLabel")}:{" "}
            {area.lastReviewedAt
              ? formatDateTime(area.lastReviewedAt)
              : t("common.notRecorded")}
          </p>
          <p>
            {t("lifeAreas.updatedAtLabel")}:{" "}
            {area.updatedAt ? formatDateTime(area.updatedAt) : t("common.notRecorded")}
          </p>
          <p>
            {t("lifeAreas.createdAtLabel")}:{" "}
            {area.createdAt ? formatDateTime(area.createdAt) : t("common.notRecorded")}
          </p>
        </div>

        {area.focusNote.trim().length > 0 ? (
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("lifeAreas.focusNoteLabel")}</p>
            <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-7">
              {area.focusNote}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/30 px-4 py-3">
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

      <CardFooter className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center">
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
