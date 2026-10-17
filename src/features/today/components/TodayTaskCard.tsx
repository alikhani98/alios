import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  BookOpen,
  BookOpenText,
  FolderKanban,
  GitBranch,
  PauseCircle,
  Pencil,
  Repeat2,
  Star,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PROJECT_STATUS_LABEL_KEYS } from "@/features/projects/constants";
import type {
  DecisionLogEntry,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
  TaskStatus,
} from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { Badge, Button, Card, CardContent, Select, StatusChip, SwipeActionSurface } from "@/shared/ui";
import {
  TASK_PRIORITY_LABEL_KEYS,
  TASK_STATUS_OPTIONS,
} from "../constants";
import { createLinkedProjectPath } from "../taskProjectLinks";

type TodayTaskCardProps = {
  task: Task;
  linkedProject?: Project;
  linkedJournalEntries?: ReadonlyArray<JournalEntry>;
  linkedDecisions?: ReadonlyArray<DecisionLogEntry>;
  linkedKnowledgeItems?: ReadonlyArray<KnowledgeItem>;
  isLinkedProjectLoading: boolean;
  isBusy: boolean;
  contextLabel?: string;
  allowMit?: boolean;
  focusSessionPath?: string;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onSelectMit: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TodayTaskCard({
  task,
  linkedProject,
  linkedJournalEntries = [],
  linkedDecisions = [],
  linkedKnowledgeItems = [],
  isLinkedProjectLoading,
  isBusy,
  contextLabel,
  allowMit = true,
  focusSessionPath,
  onEdit,
  onStatusChange,
  onSelectMit,
  onDelete,
}: TodayTaskCardProps) {
  const { t, language } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const completed = task.status === "done" || task.status === "cancelled";
  const statusOption = TASK_STATUS_OPTIONS.find((option) => option.value === task.status);
  const statusTone =
    task.status === "done"
      ? "success"
      : task.status === "doing"
        ? "primary"
        : task.status === "deferred"
          ? "warning"
          : task.status === "cancelled"
            ? "danger"
            : "neutral";
  const statusIcon =
    task.status === "done"
      ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      : task.status === "doing"
        ? <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        : task.status === "deferred"
          ? <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
          : task.status === "cancelled"
            ? <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            : <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />;

  return (
    <SwipeActionSurface
      processLabel={t("today.done")}
      deleteLabel={t("common.delete")}
      processDisabled={isBusy || completed}
      deleteDisabled={isBusy}
      onProcess={() => void onStatusChange("done")}
      onDeleteIntent={() => setConfirmingDelete(true)}
    >
    <Card
      className={cn(
        "alios-today-task min-w-0 overflow-hidden",
        completed && "alios-today-task-completed",
        task.isMit && "alios-today-task-mit"
      )}
    >
      <CardContent className="alios-today-task-content grid min-w-0 gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={statusTone}>
                <span className="inline-flex items-center gap-1.5">
                  {statusIcon}
                  {t(statusOption?.labelKey ?? "today.todo")}
                </span>
              </StatusChip>
              {task.isMit ? (
                <Badge className="alios-today-mit-label">
                  <Star className="me-1 h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  {t("today.mit")}
                </Badge>
              ) : null}
              {contextLabel ? <Badge variant="secondary">{contextLabel}</Badge> : null}
            </div>
            <h3
              dir="auto"
              className={
                completed
                  ? "min-w-0 break-words text-lg font-semibold leading-7 text-muted-foreground line-through"
                  : task.isMit
                    ? "min-w-0 break-words text-xl font-semibold leading-8"
                    : "min-w-0 break-words text-lg font-semibold leading-7"
              }
            >
              {task.title}
            </h3>
            <div className="alios-today-task-metadata flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {task.scheduledStartTime ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <time className="tabular-nums" dir="ltr">{task.scheduledStartTime}</time>
                </span>
              ) : null}
              {task.estimatedMinutes ? (
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("today.suggestedDurationMinutes", {
                    minutes: task.estimatedMinutes.toLocaleString(language),
                  })}
                </span>
              ) : null}
              {task.recurrence ? (
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="me-1 h-3.5 w-3.5" />
                  {task.recurrence.frequency === "daily"
                    ? t("today.recurrenceDaily")
                    : t("today.recurrenceWeekly")}
                </span>
              ) : null}
              <span className="break-words">
                {t("today.priority", {
                  value: t(TASK_PRIORITY_LABEL_KEYS[task.priority]),
                })}
              </span>
            </div>
          </div>
          {task.description ? (
            <div className="alios-today-task-description">
              <p dir="auto" className="break-words whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {task.description}
              </p>
            </div>
          ) : null}
          {task.projectId ? (
            <div className="alios-today-task-project">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1 basis-48 space-y-1">
                  <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="break-words">{t("today.linkedProject")}</span>
                  </p>
                  {linkedProject ? (
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p dir="auto" className="min-w-0 break-words text-sm">
                        {linkedProject.title}
                      </p>
                      <Badge variant="secondary">
                        {t(PROJECT_STATUS_LABEL_KEYS[linkedProject.status])}
                      </Badge>
                    </div>
                  ) : (
                    <p className="break-words text-sm text-muted-foreground">
                      {isLinkedProjectLoading
                        ? t("today.linkedProjectLoading")
                        : t("today.linkedProjectUnavailable")}
                    </p>
                  )}
                </div>
                {linkedProject ? (
                  <Button
                    asChild
                    size="sm"
                    variant="link"
                    className="min-w-0 px-0 text-xs"
                  >
                    <Link to={createLinkedProjectPath(linkedProject.id)}>
                      {t("today.openLinkedProject")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          {linkedJournalEntries.length > 0 ||
          linkedDecisions.length > 0 ||
          linkedKnowledgeItems.length > 0 ? (
            <div className="alios-today-task-relationships">
              {linkedJournalEntries.length > 0 ? (
                <div className="alios-today-task-relation">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <BookOpenText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t("links.relatedJournalEntries")}
                  </p>
                  <ul className="alios-today-relation-items">
                    {linkedJournalEntries.map((entry) => (
                      <li key={entry.id} dir="auto" className="min-w-0 break-words text-sm">
                        {entry.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {linkedDecisions.length > 0 ? (
                <div className="alios-today-task-relation">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <GitBranch className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t("links.relatedDecisions")}
                  </p>
                  <ul className="alios-today-relation-items">
                    {linkedDecisions.map((decision) => (
                      <li key={decision.id} dir="auto" className="min-w-0 break-words text-sm">
                        {decision.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {linkedKnowledgeItems.length > 0 ? (
                <div className="alios-today-task-relation">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {t("links.relatedKnowledgeItems")}
                  </p>
                  <ul className="alios-today-relation-items">
                    {linkedKnowledgeItems.map((item) => (
                      <li key={item.id} dir="auto" className="min-w-0 break-words text-sm">
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="alios-today-task-actions">
          <Select
            aria-label={t("today.statusFor", { title: task.title })}
            value={task.status}
            disabled={isBusy}
            onChange={(event) =>
              void onStatusChange(event.target.value as TaskStatus)
            }
            className="alios-today-status-control min-h-11 max-w-full rounded-control text-sm"
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>

          {allowMit && !task.isMit ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="alios-today-icon-action h-11 w-11 shrink-0 p-0"
              aria-label={t("today.makeMitShort")}
              title={t("today.makeMitShort")}
              disabled={isBusy}
              onClick={() => void onSelectMit()}
            >
              <Star className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}

          {focusSessionPath ? (
            <Button asChild size="sm" className="alios-today-focus-action min-h-11">
              <Link to={focusSessionPath}>
                <Timer className="me-2 h-4 w-4" aria-hidden="true" />
                {t("today.startFocusSession")}
              </Link>
            </Button>
          ) : null}

          {confirmingDelete ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={isBusy}
                onClick={() => void onDelete()}
              >
                {isBusy ? t("common.deleting") : t("common.confirmDelete")}
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
                type="button"
                size="sm"
                variant="ghost"
                className="alios-today-icon-action h-11 w-11 shrink-0 p-0"
                aria-label={t("common.edit")}
                title={t("common.edit")}
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="alios-today-icon-action h-11 w-11 shrink-0 p-0 text-destructive hover:text-destructive"
                aria-label={t("common.delete")}
                title={t("common.delete")}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    </SwipeActionSurface>
  );
}
