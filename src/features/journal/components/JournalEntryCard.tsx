import { BatteryMedium, CalendarDays, Heart, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Goal, JournalEntry, Project, Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  LinkedEntitySummary,
} from "@/shared/ui";
import { JOURNAL_TYPE_LABEL_KEYS, LEVEL_LABEL_KEYS } from "../constants";

type JournalEntryCardProps = {
  entry: JournalEntry;
  linkedProject?: Project;
  linkedGoal?: Goal;
  linkedTask?: Task;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function JournalEntryCard({
  entry,
  linkedProject,
  linkedGoal,
  linkedTask,
  isDeleting,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="journal-entry" role="article" aria-labelledby={`journal-${entry.id}-title`}>
      <CardHeader className="journal-entry-heading gap-3">
        <div className="journal-entry-identity">
          <CardTitle id={`journal-${entry.id}-title`} className="min-w-0 break-words leading-8">{entry.title}</CardTitle>
          <div className="journal-entry-date flex min-w-0 flex-wrap items-center gap-3">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            </span>
            <Badge variant="secondary">
              {t(JOURNAL_TYPE_LABEL_KEYS[entry.type])}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="journal-entry-content space-y-4">
        <p className="journal-prose whitespace-pre-wrap text-foreground">
          {entry.content}
        </p>
        {entry.moodLevel || entry.energyLevel ? (
          <div className="journal-entry-levels flex flex-wrap gap-4 text-sm text-muted-foreground">
            {entry.moodLevel ? (
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("journal.mood")}: {t(LEVEL_LABEL_KEYS[entry.moodLevel])}
              </span>
            ) : null}
            {entry.energyLevel ? (
              <span className="flex items-center gap-2">
                <BatteryMedium className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("journal.energy")}: {t(LEVEL_LABEL_KEYS[entry.energyLevel])}
              </span>
            ) : null}
          </div>
        ) : null}
        <LinkedEntitySummary
          className="journal-entry-links"
          projectId={entry.projectId}
          goalId={entry.goalId}
          taskId={entry.taskId}
          project={linkedProject}
          goal={linkedGoal}
          task={linkedTask}
        />
      </CardContent>

      <CardFooter className="journal-entry-actions flex-wrap gap-2 border-t">
        {confirmingDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? t("common.deleting") : t("common.confirmDelete")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="me-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
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
