import { AlertCircle, FolderKanban, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateProjectInput } from "@/core/repositories";
import type { Project } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectForm } from "../components/ProjectForm";
import { useProjects } from "../hooks/useProjects";
import type { ProjectFormValues } from "../types";

export function ProjectsPage() {
  const { t } = useI18n();
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const projectRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");

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
      nextAction: values.nextAction || undefined,
      reviewDate: values.reviewDate || undefined,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="alios-page-header mb-0">
          <h2 className="alios-page-title">{t("projects.title")}</h2>
          <p className="alios-page-description">
            {t("projects.description")}
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="me-2 h-4 w-4" />
          {t("projects.new")}
        </Button>
      </div>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProject ? t("projects.edit") : t("projects.create")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              key={editingProject?.id ?? "new-project"}
              project={editingProject}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </CardContent>
        </Card>
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
      {focusMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderKanban className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{t("projects.emptyTitle")}</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              {t("projects.emptyDescription")}
            </p>
            <Button type="button" className="mt-5" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              {t("projects.emptyAction")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              ref={(node) => {
                projectRefs.current[project.id] = node;
              }}
              className={cn(
                "scroll-mt-24 rounded-2xl transition-shadow",
                focusedProjectId === project.id
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                  : null
              )}
            >
              <ProjectCard
                project={project}
                isDeleting={deletingId === project.id}
                onEdit={() => openEditForm(project)}
                onDelete={() => handleDelete(project)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
