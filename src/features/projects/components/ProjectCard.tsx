import { CalendarDays, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Project } from "@/shared/types";
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

type ProjectCardProps = {
  project: Project;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function ProjectCard({
  project,
  isDeleting,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="leading-7">{project.title}</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="secondary">
              {t(PROJECT_STATUS_LABEL_KEYS[project.status])}
            </Badge>
            <Badge variant="outline">
              {t(PROJECT_PRIORITY_LABEL_KEYS[project.priority])}
            </Badge>
          </div>
        </div>
        {project.description ? (
          <p className="text-sm leading-7 text-muted-foreground">
            {project.description}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {project.nextAction ? (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="font-medium">{t("projects.next")} </span>
              {project.nextAction}
            </span>
          </div>
        ) : null}
        {project.reviewDate ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>
              {t("projects.review", { date: formatDate(project.reviewDate) })}
            </span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t pt-4">
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
