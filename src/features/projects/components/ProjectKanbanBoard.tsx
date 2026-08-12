import type { DragEvent } from "react";

import type { Project, ProjectStatus } from "@/shared/types";
import { PROJECT_STATUS_VALUES } from "@/shared/constants/domain";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { PROJECT_STATUS_LABEL_KEYS } from "../constants";

export function groupProjectsByStatus(projects: Project[]) {
  return PROJECT_STATUS_VALUES.map((status) => ({
    status,
    projects: projects.filter((project) => project.status === status),
  }));
}

export function ProjectKanbanBoard({
  draggedProjectId,
  onDragEnd,
  onDragStart,
  onEditProject,
  onStatusChange,
  projects,
}: {
  draggedProjectId: string | null;
  onDragEnd: () => void;
  onDragStart: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onStatusChange: (projectId: string, status: ProjectStatus) => void;
  projects: Project[];
}) {
  const { t } = useI18n();

  const handleDragStart = (event: DragEvent<HTMLElement>, projectId: string) => {
    onDragStart(projectId);
    event.dataTransfer.setData("text/plain", projectId);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="grid gap-4 xl:grid-cols-5" aria-label={t("projects.kanbanBoard")}>
      {groupProjectsByStatus(projects).map(({ status, projects: columnProjects }) => (
        <section
          key={status}
          className="min-w-0 rounded-2xl border bg-card/90 p-3 shadow-sm"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const projectId = event.dataTransfer.getData("text/plain") || draggedProjectId;
            if (projectId) {
              onStatusChange(projectId, status);
            }
          }}
        >
          <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
            <h2 className="min-w-0 break-words text-sm font-semibold">
              {t(PROJECT_STATUS_LABEL_KEYS[status])}
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-xs tabular-nums text-secondary-foreground">
              {columnProjects.length}
            </span>
          </div>
          <div className="space-y-3">
            {columnProjects.length ? (
              columnProjects.map((project) => (
                <article
                  key={project.id}
                  draggable
                  className={cn(
                    "rounded-2xl border bg-background/95 p-3 shadow-sm transition-[border-color,box-shadow,transform] duration-200 ease-out",
                    draggedProjectId === project.id
                      ? "border-primary/50 shadow-md"
                      : "border-border/70"
                  )}
                  onDragStart={(event) => handleDragStart(event, project.id)}
                  onDragEnd={onDragEnd}
                >
                  <div className="min-w-0 space-y-2">
                    <p className="min-w-0 break-words text-sm font-semibold leading-6">
                      {project.title}
                    </p>
                    {project.nextAction ? (
                      <p className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
                        {t("projects.next")} {project.nextAction}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => onEditProject(project)}
                    >
                      {t("common.edit")}
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed bg-muted/25 px-3 py-4 text-sm text-muted-foreground">
                {t("projects.kanbanEmptyColumn")}
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
