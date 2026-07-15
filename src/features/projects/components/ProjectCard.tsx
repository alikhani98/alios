import { CalendarDays, CheckCircle2, Pencil, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { GOAL_STATUS_LABEL_KEYS } from "@/features/goals/constants";
import type { Goal, Project } from "@/shared/types";
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
} from "@/shared/ui";
import {
  PROJECT_PRIORITY_LABEL_KEYS,
  PROJECT_STATUS_LABEL_KEYS,
} from "../constants";
import { createLinkedGoalPath } from "../projectGoalLinks";

type ProjectCardProps = {
  project: Project;
  linkedGoal?: Goal;
  isLinkedGoalLoading: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function ProjectCard({
  project,
  linkedGoal,
  isLinkedGoalLoading,
  isDeleting,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <CardTitle className="min-w-0 break-words leading-7">
            {project.title}
          </CardTitle>
          <div className="flex w-full min-w-0 flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
            <Badge
              variant="secondary"
              className="max-w-full break-words whitespace-normal text-start"
            >
              {t(PROJECT_STATUS_LABEL_KEYS[project.status])}
            </Badge>
            <Badge
              variant="outline"
              className="max-w-full break-words whitespace-normal text-start"
            >
              {t(PROJECT_PRIORITY_LABEL_KEYS[project.priority])}
            </Badge>
          </div>
        </div>
        {project.description ? (
          <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {project.description}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="min-w-0 flex-1 space-y-3">
        {project.goalId ? (
          <div className="min-w-0 rounded-2xl border border-primary/15 bg-primary/5 p-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Target className="h-4 w-4 shrink-0 text-primary" />
                  <span className="break-words">{t("projects.linkedGoal")}</span>
                </p>
                {linkedGoal ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="min-w-0 break-words text-sm font-medium">
                      {linkedGoal.title}
                    </p>
                    <Badge variant="secondary">
                      {t(GOAL_STATUS_LABEL_KEYS[linkedGoal.status])}
                    </Badge>
                  </div>
                ) : (
                  <p className="break-words text-sm text-muted-foreground">
                    {isLinkedGoalLoading
                      ? t("projects.linkedGoalLoading")
                      : t("projects.linkedGoalUnavailable")}
                  </p>
                )}
              </div>
              {linkedGoal ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Link to={createLinkedGoalPath(linkedGoal.id)}>
                    {t("projects.openLinkedGoal")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {project.nextAction ? (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">
              <span className="font-medium">{t("projects.next")} </span>
              {project.nextAction}
            </span>
          </div>
        ) : null}
        {project.reviewDate ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span className="min-w-0 break-words">
              {t("projects.review", { date: formatDate(project.reviewDate) })}
            </span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
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
      </CardFooter>
    </Card>
  );
}
