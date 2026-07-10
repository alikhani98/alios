import { Archive, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { DecisionLogEntry } from "@/shared/types";
import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  StatusChip,
} from "@/shared/ui";
import { decisionLogStatusValues } from "@/shared/types";

import { isDecisionNeedsReview } from "../decisionLog";

const statusLabelKeys: Record<
  (typeof decisionLogStatusValues)[number],
  TranslationKey
> = {
  open: "decisions.statusOpen",
  decided: "decisions.statusDecided",
  reviewed: "decisions.statusReviewed",
  archived: "decisions.statusArchived",
};

type DecisionLogCardProps = {
  decision: DecisionLogEntry;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkReviewed: () => Promise<void>;
  onArchive: () => Promise<void>;
};

function previewText(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
}

export function DecisionLogCard({
  decision,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
  onArchive,
}: DecisionLogCardProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const needsReview = isDecisionNeedsReview(decision);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="leading-7">{decision.title}</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusChip
              tone={
                decision.status === "archived"
                  ? "neutral"
                  : decision.status === "reviewed"
                    ? "success"
                    : decision.status === "decided"
                      ? "primary"
                      : "warning"
              }
            >
              {t(statusLabelKeys[decision.status])}
            </StatusChip>
            {needsReview ? <StatusChip tone="warning">{t("decisions.reviewDue")}</StatusChip> : null}
          </div>
        </div>
        <p className="text-sm leading-7 text-muted-foreground">
          {previewText(decision.context, t("decisions.noContext"))}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("decisions.decisionDate")}</p>
            <p className="mt-1 text-sm font-medium">{formatDate(decision.decisionDate)}</p>
          </div>
          <div className="rounded-2xl border bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("decisions.reviewDate")}</p>
            <p className="mt-1 text-sm font-medium">
              {decision.reviewDate ? formatDate(decision.reviewDate) : t("common.notRecorded")}
            </p>
          </div>
        </div>

        {decision.category || decision.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {decision.category ? <Badge variant="secondary">{decision.category}</Badge> : null}
            {decision.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {decision.chosenOption ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{t("decisions.chosenOption")}</p>
            <p className="text-muted-foreground">{decision.chosenOption}</p>
          </div>
        ) : null}

        {decision.reasoning ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{t("decisions.reasoning")}</p>
            <p className="text-muted-foreground">
              {previewText(decision.reasoning, t("common.notRecorded"))}
            </p>
          </div>
        ) : null}

        {decision.expectedOutcome ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{t("decisions.expectedOutcome")}</p>
            <p className="text-muted-foreground">
              {previewText(decision.expectedOutcome, t("common.notRecorded"))}
            </p>
          </div>
        ) : null}

        {decision.actualOutcome || decision.lesson ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {decision.actualOutcome ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{t("decisions.actualOutcome")}</p>
                <p className="text-muted-foreground">
                  {previewText(decision.actualOutcome, t("common.notRecorded"))}
                </p>
              </div>
            ) : null}
            {decision.lesson ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{t("decisions.lesson")}</p>
                <p className="text-muted-foreground">
                  {previewText(decision.lesson, t("common.notRecorded"))}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {decision.confidence ? (
            <StatusChip tone="neutral">
              {t("decisions.confidence")}: {decision.confidence}/5
            </StatusChip>
          ) : null}
          {decision.importance ? (
            <StatusChip tone="neutral">
              {t("decisions.importance")}: {decision.importance}/5
            </StatusChip>
          ) : null}
        </div>
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
              {isDeleting ? t("common.deleting") : t("decisions.deleteAction")}
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
            {decision.status !== "reviewed" && decision.status !== "archived" ? (
              <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => void onMarkReviewed()}>
                <CheckCircle2 className="me-2 h-4 w-4" />
                {t("decisions.markReviewed")}
              </Button>
            ) : null}
            {decision.status !== "archived" ? (
              <Button type="button" size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => void onArchive()}>
                <Archive className="me-2 h-4 w-4" />
                {t("decisions.archive")}
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
