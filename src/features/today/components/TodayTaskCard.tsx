import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  FolderKanban,
  PauseCircle,
  Pencil,
  Repeat2,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PROJECT_STATUS_LABEL_KEYS } from "@/features/projects/constants";
import type { Project, Task, TaskStatus } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, Card, CardContent, Select, StatusChip } from "@/shared/ui";
import {
  TASK_PRIORITY_LABEL_KEYS,
  TASK_STATUS_OPTIONS,
} from "../constants";
import { createLinkedProjectPath } from "../taskProjectLinks";

type TodayTaskCardProps = {
  task: Task;
  linkedProject?: Project;
  isLinkedProjectLoading: boolean;
  isBusy: boolean;
  contextLabel?: string;
  allowMit?: boolean;
  onEdit: () => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onSelectMit: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TodayTaskCard({
  task,
  linkedProject,
  isLinkedProjectLoading,
  isBusy,
  contextLabel,
  allowMit = true,
  onEdit,
  onStatusChange,
  onSelectMit,
  onDelete,
}: TodayTaskCardProps) {
  const { t } = useI18n();
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
    <Card
      className={
        completed
          ? "min-w-0 overflow-hidden border-border/70 bg-muted/40"
          : task.isMit
            ? "min-w-0 overflow-hidden border-primary/25 bg-primary/5 shadow-sm"
            : "min-w-0 overflow-hidden border-border/70"
      }
    >
      <CardContent className="grid min-w-0 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
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
                <Badge>
                  <Star className="me-1 h-3.5 w-3.5 fill-current" />
                  {t("today.mit")}
                </Badge>
              ) : null}
              {contextLabel ? <Badge variant="secondary">{contextLabel}</Badge> : null}
            </div>
            <h3
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
            <div className="flex flex-wrap items-center gap-2">
              {task.recurrence ? (
                <Badge variant="secondary">
                  <Repeat2 className="me-1 h-3.5 w-3.5" />
                  {task.recurrence.frequency === "daily"
                    ? t("today.recurrenceDaily")
                    : t("today.recurrenceWeekly")}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className="max-w-full break-words whitespace-normal text-start"
              >
                {t("today.priority", {
                  value: t(TASK_PRIORITY_LABEL_KEYS[task.priority]),
                })}
              </Badge>
            </div>
          </div>
          {task.description ? (
            <div className="alios-surface-muted px-4 py-3">
              <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {task.description}
              </p>
            </div>
          ) : null}
          {task.projectId ? (
            <div className="alios-surface-muted min-w-0 border-primary/15 bg-primary/5 p-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
                    <span className="break-words">{t("today.linkedProject")}</span>
                  </p>
                  {linkedProject ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="min-w-0 break-words text-sm font-medium">
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
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    <Link to={createLinkedProjectPath(linkedProject.id)}>
                      {t("today.openLinkedProject")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end lg:border-t-0 lg:pt-0">
          <Select
            aria-label={t("today.statusFor", { title: task.title })}
            value={task.status}
            disabled={isBusy}
            onChange={(event) =>
              void onStatusChange(event.target.value as TaskStatus)
            }
            className="max-w-full rounded-lg sm:w-auto"
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
              className="w-full sm:w-auto"
              disabled={isBusy}
              onClick={() => void onSelectMit()}
            >
              <Star className="me-2 h-4 w-4" />
              {t("today.makeMitShort")}
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
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onEdit}
              >
                <Pencil className="me-2 h-4 w-4" />
                {t("common.edit")}
              </Button>
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
        </div>
      </CardContent>
    </Card>
  );
}
