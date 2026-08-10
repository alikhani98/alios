import { BookText, CheckCircle2, Pencil, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
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
    <Card
      className={reviewDue
        ? "flex h-full min-w-0 flex-col overflow-hidden border-warning/20 bg-warning/5"
        : "flex h-full min-w-0 flex-col overflow-hidden"}
    >
      <CardHeader className="min-w-0 gap-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex min-w-0 flex-wrap gap-2">
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
            <div className="space-y-1">
              <CardTitle className="break-words text-xl leading-8">{entry.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(MANUAL_CATEGORY_LABEL_KEYS[entry.category])}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="max-w-full break-words whitespace-normal text-start leading-5"
          >
            {t(MANUAL_IMPORTANCE_LABEL_KEYS[entry.importance])}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 flex-1 space-y-4">
        <CollapsibleSection
          id={`manual-entry-${entry.id}-details`}
          title={t("manual.entryDetails")}
          description={t("manual.entryDetailsDescription")}
          icon={<BookText className="h-5 w-5" />}
          status={entry.reviewIntervalDays ? <StatusChip tone="neutral">{entry.reviewIntervalDays}</StatusChip> : null}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          className="rounded-2xl border border-border/70 bg-muted/20 shadow-none"
          contentClassName="space-y-4"
        >
          <SoftPanel className="space-y-2">
            <p className="text-sm font-semibold">{t("common.content")}</p>
            <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {entry.body}
            </p>
          </SoftPanel>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="max-w-full break-words whitespace-normal text-start leading-5"
            >
              {t(MANUAL_CATEGORY_LABEL_KEYS[entry.category])}
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
            <SoftPanel className="rounded-surface space-y-1 px-4 py-3">
              <p className="text-xs text-muted-foreground">{t("manual.updatedAt")}</p>
              <p className="mt-1 text-sm font-medium">{formatDateTime(entry.updatedAt)}</p>
            </SoftPanel>
            <SoftPanel className="rounded-surface space-y-1 px-4 py-3">
              <p className="text-xs text-muted-foreground">{t("manual.lastReviewedAt")}</p>
              <p className="mt-1 text-sm font-medium">
                {entry.lastReviewedAt ? formatDateTime(entry.lastReviewedAt) : t("common.notRecorded")}
              </p>
            </SoftPanel>
          </div>

          {entry.tags.length > 0 ? (
            <SoftPanel className="space-y-3 bg-muted/60">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                {t("manual.tags")}
              </p>
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
            </SoftPanel>
          ) : (
            <SoftPanel className="space-y-2 bg-muted/60">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                {t("manual.tags")}
              </p>
              <p className="text-sm text-muted-foreground">{t("common.notRecorded")}</p>
            </SoftPanel>
          )}
        </CollapsibleSection>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
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
