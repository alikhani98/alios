import { FolderKanban, Target } from "lucide-react";
import { Link } from "react-router-dom";

import {
  createGoalFocusPath,
  createProjectFocusPath,
} from "@/shared/entityLinks";
import { useI18n } from "@/shared/i18n";
import type { Goal, Project } from "@/shared/types";
import { cn } from "@/shared/utils";
import { Button } from "./button";

type LinkedEntitySummaryProps = {
  projectId?: string;
  goalId?: string;
  project?: Project;
  goal?: Goal;
  className?: string;
};

export function LinkedEntitySummary({
  projectId,
  goalId,
  project,
  goal,
  className,
}: LinkedEntitySummaryProps) {
  const { t } = useI18n();

  if (!projectId && !goalId) {
    return null;
  }

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {projectId ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FolderKanban className="h-4 w-4 shrink-0 text-primary" />
            {t("links.projectLabel")}
          </p>
          {project ? (
            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-words text-sm font-medium">
                {project.title}
              </p>
              <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
                <Link to={createProjectFocusPath(project.id)}>
                  {t("links.openProject")}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {t("links.projectUnavailable")}
            </p>
          )}
        </div>
      ) : null}

      {goalId ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Target className="h-4 w-4 shrink-0 text-primary" />
            {t("links.goalLabel")}
          </p>
          {goal ? (
            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-words text-sm font-medium">
                {goal.title}
              </p>
              <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
                <Link to={createGoalFocusPath(goal.id)}>
                  {t("links.openGoal")}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {t("links.goalUnavailable")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
