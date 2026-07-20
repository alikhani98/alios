import { AlertCircle, CalendarDays, CheckSquare2, Clock3, Plus, Repeat2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

import type { UpdateTaskInput } from "@/core/repositories";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useRoutines } from "@/features/routines/hooks/useRoutines";
import type { Project, Task, TaskStatus } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
import {
  Button,
  Badge,
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
import { TodayWeeklyPlanCard } from "../components/TodayWeeklyPlanCard";
import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
import { useTodayData } from "../hooks/useTodayData";
import { useTodayWeeklyPlan } from "../hooks/useTodayWeeklyPlan";
import { getPlannedTaskOutsideToday } from "../todayWeeklyPlan";
import {
  findLinkedProject,
  findProjectFilter,
} from "../taskProjectLinks";
import {
  createTodayTasksPath,
  findRoutineFilter,
} from "@/features/routines/routineTaskLinks";
import type { DailyCheckinFormValues, TodayTaskFormValues } from "../types";
import { createRoutineTaskInput, getRoutineSuggestions } from "../routineSuggestions";
import { clearDueProjectReviewDate, isProjectReviewDue } from "@/features/projects/projectReviews";

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
    createRoutineTask,
    updateTask,
    updateTaskStatus,
    selectMit,
    deleteTask,
    saveCheckin,
  } = useTodayData(today);
  const {
    focus: weeklyPlanFocus,
    isLoading: isWeeklyPlanLoading,
    loadTodayWeeklyPlan,
  } = useTodayWeeklyPlan();
  const {
    projects,
    isLoading: isProjectsLoading,
    error: projectsError,
    loadProjects,
    updateProject,
  } = useProjects();
  const {
    entries: routines,
    isLoading: isRoutinesLoading,
    error: routinesError,
    loadRoutines,
  } = useRoutines();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isCheckinSubmitting, setIsCheckinSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [busyRoutineId, setBusyRoutineId] = useState<string | null>(null);
  const [busyProjectReviewId, setBusyProjectReviewId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [showAllRoutineSuggestions, setShowAllRoutineSuggestions] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const plannedTaskRef = useRef<HTMLDivElement | null>(null);
  const focusId = searchParams.get("focusId");
  const goalId = searchParams.get("goalId");
  const projectId = searchParams.get("projectId");
  const routineId = searchParams.get("routineId");
  const filteredProject = findProjectFilter(projectId, projects);
  const filteredRoutine = findRoutineFilter(routineId, routines);
  const linkedGoalProjectIds = new Set(
    projects
      .filter((project) => project.goalId === goalId)
      .map((project) => project.id)
  );
  const visibleTasks = tasks.filter(
    (task) =>
      (!goalId || (task.projectId ? linkedGoalProjectIds.has(task.projectId) : false)) &&
      (!projectId || task.projectId === projectId) &&
      (!routineId || task.routineId === routineId)
  );
  const taskPreviewLimit = 12;
  const displayedTasks = useMemo(() => {
    if (showAllTasks || visibleTasks.length <= taskPreviewLimit) {
      return visibleTasks;
    }

    const preview = visibleTasks.slice(0, taskPreviewLimit);
    const focusedTask = focusId
      ? visibleTasks.find((task) => task.id === focusId)
      : undefined;

    return focusedTask && !preview.some((task) => task.id === focusedTask.id)
      ? [...preview, focusedTask]
      : preview;
  }, [focusId, showAllTasks, visibleTasks]);
  const hiddenTaskCount = Math.max(visibleTasks.length - displayedTasks.length, 0);
  const plannedTaskOutsideToday = getPlannedTaskOutsideToday(weeklyPlanFocus, today);
  const routineSuggestions = getRoutineSuggestions(
    routines,
    tasks,
    today,
    new Date().getDay()
  );
  const routineSuggestionPreviewLimit = 6;
  const visibleRoutineSuggestions = showAllRoutineSuggestions
    ? routineSuggestions
    : routineSuggestions.slice(0, routineSuggestionPreviewLimit);
  const hiddenRoutineSuggestionCount = Math.max(
    routineSuggestions.length - visibleRoutineSuggestions.length,
    0
  );
  const reviewDueProjects = projects.filter((project) => isProjectReviewDue(project));

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
      await loadTodayWeeklyPlan();
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
      await Promise.all([loadToday(), loadTodayWeeklyPlan()]);
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

  const handleAddRoutine = async (routine: (typeof routines)[number]) => {
    setBusyRoutineId(routine.id);
    setActionError(null);
    try {
      await createRoutineTask(createRoutineTaskInput(routine, today));
      setSuccessMessage(t("routines.addedToToday"));
    } catch (caught) {
      showError(caught, t("today.taskSaveError"));
    } finally {
      setBusyRoutineId(null);
    }
  };

  const handleMarkProjectReviewed = async (project: Project) => {
    setBusyProjectReviewId(project.id);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await updateProject(project.id, {
        lastReviewedAt: new Date().toISOString(),
        reviewDate: clearDueProjectReviewDate(project),
      });
      setSuccessMessage(t("common.changesSaved"));
    } catch (caught) {
      showError(caught, t("projects.saveError"));
    } finally {
      setBusyProjectReviewId(null);
    }
  };

  useEffect(() => {
    if (!focusId) {
      setFocusedTaskId(null);
      setFocusMessage(null);
      return;
    }

    const focusedTask = visibleTasks.find((task) => task.id === focusId);
    if (!focusedTask && plannedTaskOutsideToday?.id === focusId) {
      setFocusMessage(null);
      setFocusedTaskId(focusId);
      plannedTaskRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      const timeout = window.setTimeout(() => {
        setFocusedTaskId((current) => (current === focusId ? null : current));
      }, 2200);

      return () => window.clearTimeout(timeout);
    }
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
  }, [focusId, isLoading, plannedTaskOutsideToday, t, visibleTasks]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-primary/5">
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
            <Link to={createTodayTasksPath({ goalId, routineId })}>
              {t("today.clearProjectFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      {goalId ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {linkedGoalProjectIds.size > 0
              ? t("today.projectFilterActive", {
                  title: `${linkedGoalProjectIds.size} ${t("projects.title")}`,
                })
              : t("today.projectFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={createTodayTasksPath({ projectId, routineId })}>
              {t("goals.clearFilters")}
            </Link>
          </Button>
        </div>
      ) : null}

      {routineId ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {filteredRoutine
              ? t("today.routineFilterActive", { title: filteredRoutine.title })
              : t("today.routineFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={createTodayTasksPath({ goalId, projectId })}>
              {t("today.clearRoutineFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      <TodayWeeklyPlanCard focus={weeklyPlanFocus} isLoading={isWeeklyPlanLoading} />

      <PremiumCard>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Repeat2 className="h-5 w-5 text-primary" />
              {t("routines.todayTitle")}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("routines.todayDescription")}
            </p>
          </div>
          {routineSuggestions.length > 0 ? (
            <Badge variant="secondary">{routineSuggestions.length}</Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {routinesError ? (
            <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("routines.todayUnavailable")}</p>
              <Button size="sm" variant="outline" onClick={() => void loadRoutines()}>{t("common.tryAgain")}</Button>
            </div>
          ) : isRoutinesLoading ? (
            <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
          ) : routineSuggestions.length > 0 ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleRoutineSuggestions.map((routine) => (
                  <div
                    key={routine.id}
                    className="grid min-w-0 gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium">{routine.title}</p>
                      {routine.description ? (
                        <p className="mt-1 line-clamp-1 break-words text-sm leading-6 text-muted-foreground">
                          {routine.description}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      className="w-full shrink-0 sm:w-auto"
                      disabled={busyRoutineId === routine.id}
                      onClick={() => void handleAddRoutine(routine)}
                    >
                      <Plus className="me-2 h-4 w-4" />
                      {t("routines.addToToday")}
                    </Button>
                  </div>
                ))}
              </div>
              {hiddenRoutineSuggestionCount > 0 || showAllRoutineSuggestions ? (
                <div className="flex justify-start border-t border-border/60 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAllRoutineSuggestions((current) => !current)}
                  >
                    {showAllRoutineSuggestions
                      ? t("today.showFewerRoutineSuggestions")
                      : t("today.showMoreRoutineSuggestions", {
                          count: hiddenRoutineSuggestionCount,
                        })}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </PremiumCard>

      {reviewDueProjects.length > 0 ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              {t("projects.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewDueProjects.map((project) => (
              <div
                key={project.id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 break-words font-medium">{project.title}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                  disabled={busyProjectReviewId === project.id}
                  onClick={() => void handleMarkProjectReviewed(project)}
                >
                  <Clock3 className="me-2 h-4 w-4" />
                  {t("goals.markReviewed")}
                </Button>
              </div>
            ))}
          </CardContent>
        </PremiumCard>
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

      {plannedTaskOutsideToday ? (
        <div
          ref={plannedTaskRef}
          className={cn(
            "scroll-mt-24 rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
            focusedTaskId === plannedTaskOutsideToday.id
              ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
              : null
          )}
        >
          <PremiumCard className="border-primary/25 bg-primary/5">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <SectionHeader
                eyebrow={t("weeklyReview.title")}
                title={t("weeklyReview.nextFocusLabel")}
                description={weeklyPlanFocus.plan?.focusTitle}
                actions={
                  <span className="text-sm text-muted-foreground">
                    {plannedTaskOutsideToday.dueDate
                      ? formatDate(plannedTaskOutsideToday.dueDate)
                      : t("common.notRecorded")}
                  </span>
                }
              />
              <TodayTaskCard
                task={plannedTaskOutsideToday}
                linkedProject={findLinkedProject(plannedTaskOutsideToday, projects)}
                isLinkedProjectLoading={isProjectsLoading}
                isBusy={busyTaskId === plannedTaskOutsideToday.id}
                contextLabel={t("weeklyReview.title")}
                allowMit={false}
                onEdit={() => openEditTask(plannedTaskOutsideToday)}
                onStatusChange={(status) => handleStatusChange(plannedTaskOutsideToday, status)}
                onSelectMit={() => handleSelectMit(plannedTaskOutsideToday)}
                onDelete={() => handleDeleteTask(plannedTaskOutsideToday)}
              />
            </CardContent>
          </PremiumCard>
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
          {displayedTasks.map((task) => (
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
          {visibleTasks.length > taskPreviewLimit ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowAllTasks((current) => !current)}
            >
              {showAllTasks
                ? t("common.showFewer")
                : t("common.showMoreCount", { count: hiddenTaskCount })}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
