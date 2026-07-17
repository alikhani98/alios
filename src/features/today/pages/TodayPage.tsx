import { AlertCircle, CalendarDays, CheckSquare2, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

import type { UpdateTaskInput } from "@/core/repositories";
import { useProjects } from "@/features/projects/hooks/useProjects";
import type { Task, TaskStatus } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
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
import { DailyCheckinForm } from "../components/DailyCheckinForm";
import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
import { useTodayData } from "../hooks/useTodayData";
import {
  createAllTodayTasksPath,
  findLinkedProject,
  findProjectFilter,
} from "../taskProjectLinks";
import type { DailyCheckinFormValues, TodayTaskFormValues } from "../types";

export function TodayPage() {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [searchParams] = useSearchParams();
  const today = format(new Date(), "yyyy-MM-dd");
  const {
    tasks,
    checkin,
    isLoading,
    error,
    loadToday,
    createTask,
    updateTask,
    updateTaskStatus,
    selectMit,
    deleteTask,
    saveCheckin,
  } = useTodayData(today);
  const {
    projects,
    isLoading: isProjectsLoading,
    error: projectsError,
    loadProjects,
  } = useProjects();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isCheckinSubmitting, setIsCheckinSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");
  const projectId = searchParams.get("projectId");
  const filteredProject = findProjectFilter(projectId, projects);
  const visibleTasks = projectId
    ? tasks.filter((task) => task.projectId === projectId)
    : tasks;

  const showError = (caught: unknown, fallback: string) => {
    setActionError(caught instanceof Error ? caught.message : fallback);
  };

  const openCreateTask = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeTaskForm = () => {
    setTaskFormOpen(false);
    setEditingTask(undefined);
  };

  const handleCheckinSubmit = async (values: DailyCheckinFormValues) => {
    setIsCheckinSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await saveCheckin(values);
      setSuccessMessage(
        checkin
          ? t("today.checkinUpdated")
          : t("today.checkinSaved")
      );
    } catch (caught) {
      showError(caught, t("today.checkinError"));
    } finally {
      setIsCheckinSubmitting(false);
    }
  };

  const handleTaskSubmit = async (values: TodayTaskFormValues) => {
    setIsTaskSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);
    const input = {
      ...values,
      description: values.description || undefined,
      projectId: values.projectId || undefined,
    };

    try {
      if (editingTask) {
        const updateInput: UpdateTaskInput = {
          ...input,
          completedAt:
            values.status === "done"
              ? editingTask.completedAt ?? new Date().toISOString()
              : undefined,
        };
        await updateTask(editingTask.id, updateInput);
        setSuccessMessage(t("today.taskUpdated"));
      } else {
        await createTask(input);
        setSuccessMessage(t("today.taskCreated"));
      }
      closeTaskForm();
    } catch (caught) {
      showError(caught, t("today.taskSaveError"));
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const runTaskAction = async (
    taskId: string,
    action: () => Promise<unknown>,
    success: string,
    fallback: string
  ) => {
    setBusyTaskId(taskId);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(success);
    } catch (caught) {
      showError(caught, fallback);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleStatusChange = (task: Task, status: TaskStatus) =>
    runTaskAction(
      task.id,
      () => updateTaskStatus(task.id, status),
      t("today.statusUpdated"),
      t("today.statusError")
    );

  const handleSelectMit = (task: Task) =>
    runTaskAction(
      task.id,
      () => selectMit(task.id),
      t("today.mitSelected"),
      t("today.mitError")
    );

  const handleDeleteTask = (task: Task) =>
    runTaskAction(
      task.id,
      () => deleteTask(task.id),
      t("today.taskDeleted"),
      t("today.taskDeleteError")
    );

  useEffect(() => {
    if (!focusId) {
      setFocusedTaskId(null);
      setFocusMessage(null);
      return;
    }

    const focusedTask = visibleTasks.find((task) => task.id === focusId);
    if (!focusedTask) {
      if (!isLoading && visibleTasks.length > 0) {
        setFocusedTaskId(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedTaskId(focusId);
    const node = taskRefs.current[focusId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedTaskId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusId, isLoading, t, visibleTasks]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard>
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<CalendarDays className="h-5 w-5" />}
            title={t("today.title")}
            description={t("today.description")}
            actions={
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(today)}</span>
              </div>
            }
          />
        </CardContent>
      </PremiumCard>

      {projectId ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {filteredProject
              ? t("today.projectFilterActive", { title: filteredProject.title })
              : t("today.projectFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={createAllTodayTasksPath()}>
              {t("today.clearProjectFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
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
            <Button type="button" size="sm" variant="outline" onClick={() => void loadToday()}>
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

      <PremiumCard>
        <CardHeader>
          <CardTitle>{t("today.checkin")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-72 animate-pulse rounded-xl bg-muted/60" />
          ) : (
            <DailyCheckinForm
              key={checkin?.updatedAt ?? "new-checkin"}
              checkin={checkin}
              isSubmitting={isCheckinSubmitting}
              onSubmit={handleCheckinSubmit}
            />
          )}
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeader
            title={t("today.tasks")}
            description={t("today.tasksDescription")}
          />
          <Button type="button" onClick={openCreateTask}>
            <Plus className="me-2 h-4 w-4" />
            {t("today.newTask")}
          </Button>
        </CardContent>
      </PremiumCard>

      {taskFormOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>{editingTask ? t("today.editTask") : t("today.createTask")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayTaskForm
              key={editingTask?.id ?? "new-task"}
              task={editingTask}
              projects={projects}
              isProjectsLoading={isProjectsLoading}
              areProjectsUnavailable={Boolean(projectsError)}
              defaultDueDate={today}
              isSubmitting={isTaskSubmitting}
              onSubmit={handleTaskSubmit}
              onCancel={closeTaskForm}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      {projectsError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              {t("today.projectLinksUnavailable")}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadProjects()}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3" aria-label={t("today.loadingTasks")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border bg-muted/60" />
          ))}
        </div>
      ) : visibleTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare2 className="h-6 w-6" />}
          title={t("today.noTasks")}
          description={t("today.noTasksDescription")}
          actions={
            <Button type="button" onClick={openCreateTask}>
              <Plus className="me-2 h-4 w-4" />
              {t("today.firstTask")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              ref={(node) => {
                taskRefs.current[task.id] = node;
              }}
              className={cn(
                "scroll-mt-24 rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                focusedTaskId === task.id
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                  : null
              )}
            >
              <TodayTaskCard
                task={task}
                linkedProject={findLinkedProject(task, projects)}
                isLinkedProjectLoading={isProjectsLoading}
                isBusy={busyTaskId === task.id}
                onEdit={() => openEditTask(task)}
                onStatusChange={(status) => handleStatusChange(task, status)}
                onSelectMit={() => handleSelectMit(task)}
                onDelete={() => handleDeleteTask(task)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
