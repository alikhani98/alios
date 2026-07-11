import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, CardTitle, StatusChip } from "@/shared/ui";
import type { ManualEntry } from "@/shared/types";

import {
  MANUAL_CATEGORY_LABEL_KEYS,
  MANUAL_IMPORTANCE_LABEL_KEYS,
  MANUAL_STATUS_LABEL_KEYS,
} from "../constants";
import { isManualEntryReviewDue } from "../manualEntries";

type ManualEntryCardProps = {
  entry: ManualEntry;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkReviewed: () => Promise<void>;
};

function previewText(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}…` : trimmed;
}

export function ManualEntryCard({
  entry,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
}: ManualEntryCardProps) {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const reviewDue = isManualEntryReviewDue(entry);

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader className="min-w-0 gap-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <CardTitle className="break-words leading-7">{entry.title}</CardTitle>
          <div className="flex min-w-0 flex-wrap justify-end gap-2">
            <StatusChip
              tone={
                entry.status === "archived"
                  ? "neutral"
                  : entry.status === "draft"
                    ? "warning"
                    : "primary"
              }
            >
              {t(MANUAL_STATUS_LABEL_KEYS[entry.status])}
            </StatusChip>
            {reviewDue ? (
              <StatusChip tone="warning">{t("manual.reviewDue")}</StatusChip>
            ) : null}
          </div>
        </div>
        <p className="break-words text-sm leading-7 whitespace-pre-wrap text-muted-foreground">
          {previewText(entry.body, t("manual.noBodyPreview"))}
        </p>
      </CardHeader>

      <CardContent className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="max-w-full break-words whitespace-normal text-start leading-5"
          >
            {t(MANUAL_CATEGORY_LABEL_KEYS[entry.category])}
          </Badge>
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start leading-5"
          >
            {t(MANUAL_IMPORTANCE_LABEL_KEYS[entry.importance])}
          </Badge>
          {entry.reviewIntervalDays ? (
            <Badge
              variant="outline"
              className="max-w-full break-words whitespace-normal text-start leading-5"
            >
              {t("manual.reviewIntervalDays")}: {entry.reviewIntervalDays}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("manual.updatedAt")}</p>
            <p className="mt-1 text-sm font-medium">{formatDateTime(entry.updatedAt)}</p>
          </div>
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("manual.lastReviewedAt")}</p>
            <p className="mt-1 text-sm font-medium">
              {entry.lastReviewedAt ? formatDateTime(entry.lastReviewedAt) : t("common.notRecorded")}
            </p>
          </div>
        </div>

        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
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
            {entry.status !== "archived" ? (
              <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => void onMarkReviewed()}>
                <CheckCircle2 className="me-2 h-4 w-4" />
                {t("manual.markReviewed")}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive sm:w-auto"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("common.delete")}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
