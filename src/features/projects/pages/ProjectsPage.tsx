import { AlertCircle, FolderKanban, KanbanSquare, List, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type { CreateProjectInput } from "@/core/repositories";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { useStorageAdapter } from "@/core/storage";
import type {
  DecisionLogEntry,
  JournalEntry,
  KnowledgeItem,
  Project,
  ProjectStatus,
  Task,
} from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectForm } from "../components/ProjectForm";
import { ProjectKanbanBoard } from "../components/ProjectKanbanBoard";
import { useProjects } from "../hooks/useProjects";
import { findGoalProjectFilter, findLinkedGoal } from "../projectGoalLinks";
import { getProjectTaskProgress } from "../projectTaskProgress";
import { clearDueProjectReviewDate, isProjectReviewDue } from "../projectReviews";
import type { ProjectFormValues } from "../types";

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  const parsed = Number(value ?? "");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function createMilestoneId(title: string, index: number): string {
  return `milestone-${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "item"}`;
}

function parseMilestones(value: string | undefined): Project["milestones"] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const done = /^\[(x|X)\]/.test(line);
      const withoutCheckbox = line.replace(/^\[\s?\]|\[(x|X)\]/, "").trim();
      const [rawTitle, rawDate] = withoutCheckbox.split("|").map((part) => part.trim());
      const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined;

      return {
        id: createMilestoneId(rawTitle, index),
        title: rawTitle,
        done,
        date,
      };
    })
    .filter((milestone) => milestone.title.length > 0);
}

export function ProjectsPage() {
  const { t } = useI18n();
  const {
    tasks: tasksRepository,
    journal: journalRepository,
    decisions: decisionsRepository,
    knowledge: knowledgeRepository,
  } = useStorageAdapter();
  const [searchParams] = useSearchParams();
  const {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const {
    entries: goals,
    isLoading: isGoalsLoading,
    error: goalsError,
    loadGoals,
  } = useGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);
  const [linkedJournalEntries, setLinkedJournalEntries] = useState<JournalEntry[]>([]);
  const [linkedDecisions, setLinkedDecisions] = useState<DecisionLogEntry[]>([]);
  const [linkedKnowledgeItems, setLinkedKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [linkedContentLoadError, setLinkedContentLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const projectRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");
  const goalId = searchParams.get("goalId");
  const filteredGoal = findGoalProjectFilter(goalId, goals);
  const visibleProjects = goalId
    ? projects.filter((project) => project.goalId === goalId)
    : projects;
  const projectPreviewLimit = 12;
  const focusRequiresAllProjects = visibleProjects.findIndex((project) => project.id === focusId) >= projectPreviewLimit;
  const displayedProjects = showAllProjects || focusRequiresAllProjects
    ? visibleProjects
    : visibleProjects.slice(0, projectPreviewLimit);
  const hiddenProjectCount = Math.max(visibleProjects.length - displayedProjects.length, 0);
  const loadLinkedTasks = useCallback(async () => {
    setTaskLoadError(null);

    try {
      setTasks(await tasksRepository.list());
    } catch {
      setTasks([]);
      setTaskLoadError(t("projects.taskProgressLoadError"));
    }
  }, [tasksRepository, t]);

  useEffect(() => {
    void loadLinkedTasks();
  }, [loadLinkedTasks]);

  const loadLinkedContent = useCallback(async () => {
    setLinkedContentLoadError(null);

    try {
      const [journalEntries, decisionEntries, knowledgeItems] =
        await Promise.all([
          journalRepository.list(),
          decisionsRepository.list(),
          knowledgeRepository.list(),
        ]);

      setLinkedJournalEntries(journalEntries);
      setLinkedDecisions(decisionEntries);
      setLinkedKnowledgeItems(knowledgeItems);
    } catch {
      setLinkedJournalEntries([]);
      setLinkedDecisions([]);
      setLinkedKnowledgeItems([]);
      setLinkedContentLoadError(t("links.relatedContentLoadError"));
    }
  }, [decisionsRepository, journalRepository, knowledgeRepository, t]);

  useEffect(() => {
    void loadLinkedContent();
  }, [loadLinkedContent]);

  const openCreateForm = () => {
    setEditingProject(undefined);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProject(undefined);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const input: CreateProjectInput = {
      title: values.title,
      description: values.description || undefined,
      status: values.status,
      priority: values.priority,
      goalId: values.goalId || undefined,
      nextAction: values.nextAction || undefined,
      reviewDate: values.reviewDate || undefined,
      reviewIntervalDays: parseOptionalPositiveInteger(values.reviewIntervalDays),
      milestones: parseMilestones(values.milestonesText),
    };

    try {
      if (editingProject) {
        await updateProject(editingProject.id, input);
        setSuccessMessage(t("projects.updated"));
      } else {
        await createProject(input);
        setSuccessMessage(t("projects.created"));
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : t("projects.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReviewed = async (project: Project) => {
    setActionError(null);
    setSuccessMessage(null);

    try {
      await updateProject(project.id, {
        lastReviewedAt: new Date().toISOString(),
        reviewDate: clearDueProjectReviewDate(project),
      });
      setSuccessMessage(t("common.changesSaved"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error ? updateError.message : t("projects.saveError")
      );
    }
  };

  const handleDelete = async (project: Project) => {
    setDeletingId(project.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteProject(project.id);
      setSuccessMessage(t("projects.deleted"));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : t("projects.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleKanbanStatusChange = async (
    projectId: string,
    nextStatus: ProjectStatus
  ) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project || project.status === nextStatus) {
      setDraggedProjectId(null);
      return;
    }

    setActionError(null);
    setSuccessMessage(null);

    try {
      await updateProject(projectId, {
        status: nextStatus,
        archivedAt: nextStatus === "archived" ? new Date().toISOString() : undefined,
      });
      setSuccessMessage(t("projects.statusUpdated"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error ? updateError.message : t("projects.saveError")
      );
    } finally {
      setDraggedProjectId(null);
    }
  };

  useEffect(() => {
    if (!focusId) {
      setFocusedProjectId(null);
      setFocusMessage(null);
      return;
    }

    const focusedProject = projects.find((project) => project.id === focusId);
    if (!focusedProject) {
      if (!isLoading && projects.length > 0) {
        setFocusedProjectId(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedProjectId(focusId);
    const node = projectRefs.current[focusId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedProjectId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusId, isLoading, projects, t]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeader
            icon={<FolderKanban className="h-5 w-5" />}
            title={t("projects.title")}
            description={t("projects.description")}
          />
          <Button type="button" onClick={openCreateForm} className="w-full sm:w-auto">
            <Plus className="me-2 h-4 w-4" />
            {t("projects.new")}
          </Button>
        </CardContent>
      </PremiumCard>

      {formOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>
              {editingProject ? t("projects.edit") : t("projects.create")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              key={editingProject?.id ?? "new-project"}
              project={editingProject}
              goals={goals}
              isGoalsLoading={isGoalsLoading}
              areGoalsUnavailable={Boolean(goalsError)}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError ?? error}</span>
          </div>
          {error ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void loadProjects()}>
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {goalsError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              {t("projects.goalLinksUnavailable")}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadGoals()}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}
      {taskLoadError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{taskLoadError}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadLinkedTasks()}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}
      {linkedContentLoadError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{linkedContentLoadError}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadLinkedContent()}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}
      {focusMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
        </div>
      ) : null}

      {projects.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("projects.viewModeDescription")}</p>
          <div className="grid gap-2 sm:flex sm:items-center" role="group" aria-label={t("projects.viewMode")}>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="me-2 h-4 w-4" aria-hidden="true" />
              {t("projects.listView")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "kanban" ? "default" : "outline"}
              onClick={() => setViewMode("kanban")}
            >
              <KanbanSquare className="me-2 h-4 w-4" aria-hidden="true" />
              {t("projects.kanbanView")}
            </Button>
          </div>
        </div>
      ) : null}

      {goalId ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {filteredGoal
              ? `${t("projects.linkedGoal")}: ${filteredGoal.title}`
              : t("projects.linkedGoalUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to="/projects">{t("goals.clearFilters")}</Link>
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("projects.loading")}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={t("projects.emptyTitle")}
          description={t("projects.emptyDescription")}
          note={t("projects.emptyNote")}
          actions={
            <Button type="button" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              {t("projects.emptyAction")}
            </Button>
          }
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={t("projects.noGoalResults")}
          description={t("projects.emptyDescription")}
          actions={
            <Button asChild type="button">
              <Link to="/projects">{t("goals.clearFilters")}</Link>
            </Button>
          }
        />
      ) : viewMode === "kanban" ? (
        <ProjectKanbanBoard
          draggedProjectId={draggedProjectId}
          onDragEnd={() => setDraggedProjectId(null)}
          onDragStart={setDraggedProjectId}
          onEditProject={openEditForm}
          onStatusChange={(projectId, status) => void handleKanbanStatusChange(projectId, status)}
          projects={visibleProjects}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              ref={(node) => {
                projectRefs.current[project.id] = node;
              }}
              className={cn(
                "scroll-mt-24 rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                focusedProjectId === project.id
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                  : null
              )}
            >
              <ProjectCard
                project={project}
                linkedGoal={findLinkedGoal(project, goals)}
                linkedJournalEntries={linkedJournalEntries.filter(
                  (entry) => entry.projectId === project.id
                )}
                linkedDecisions={linkedDecisions.filter(
                  (decision) => decision.projectId === project.id
                )}
                linkedKnowledgeItems={linkedKnowledgeItems.filter(
                  (item) => item.projectId === project.id
                )}
                taskProgress={getProjectTaskProgress(project.id, tasks)}
                isLinkedGoalLoading={isGoalsLoading}
                isReviewDue={isProjectReviewDue(project)}
                isDeleting={deletingId === project.id}
                onEdit={() => openEditForm(project)}
                onDelete={() => handleDelete(project)}
                onMarkReviewed={() => handleMarkReviewed(project)}
              />
            </div>
          ))}
        </div>
      )}
      {visibleProjects.length > projectPreviewLimit && !focusRequiresAllProjects ? (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setShowAllProjects((current) => !current)}>
            {showAllProjects
              ? t("common.showFewer")
              : t("common.showMoreCount", { count: hiddenProjectCount })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
