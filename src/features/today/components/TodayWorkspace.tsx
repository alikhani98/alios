import { AlertCircle, CheckCircle2, CheckSquare2, Clock3, Plus, Repeat2, RotateCcw, Sparkles, Target } from "lucide-react";
import { parseISO } from "date-fns";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type { UpdateTaskInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useRoutines } from "@/features/routines/hooks/useRoutines";
import type {
  DecisionLogEntry,
  DailyCommitment,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
  TaskStatus,
} from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
import { readStoredViewDensityMode } from "@/shared/preferences/viewDensityMode";
import { getPreferenceStorage, writeStoredPreference } from "@/shared/preferences/storage";
import { aliosListItemMotion, aliosStaggerDelay } from "@/shared/ui/motion";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  EmptyState,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { DailyCheckinForm } from "../components/DailyCheckinForm";
import { TodayWeeklyPlanCard } from "../components/TodayWeeklyPlanCard";
import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
import { TodayTimeBlockingTimeline } from "../components/TodayTimeBlockingTimeline";
import { useTodayData } from "../hooks/useTodayData";
import { useTodayWeeklyPlan } from "../hooks/useTodayWeeklyPlan";
import { getPlannedTaskOutsideToday } from "../todayWeeklyPlan";
import {
  findLinkedProject,
  findProjectFilter,
} from "../taskProjectLinks";
import { findRoutineFilter } from "@/features/routines/routineTaskLinks";
import type { DailyCheckinFormValues, TodayTaskFormValues } from "../types";
import { createRoutineTaskInput, getRoutineSuggestions } from "../routineSuggestions";
import { clearDueProjectReviewDate, isProjectReviewDue } from "@/features/projects/projectReviews";
import "../today-presentation.css";

export const TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY =
  "alios.today.completedTasks.open";

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

const RecoveryCard = lazy(() =>
  import("@/features/recovery/components/RecoveryCard").then((module) => ({
    default: module.RecoveryCard,
  }))
);

export function getDefaultCompletedTasksOpen(completedTaskCount: number) {
  return completedTaskCount <= 3;
}

export function readStoredTodayCompletedTasksOpen(
  completedTaskCount: number
): boolean {
  const storage = getPreferenceStorage();
  const fallback = getDefaultCompletedTasksOpen(completedTaskCount);

  if (!storage) {
    return fallback;
  }

  try {
    const storedValue = storage.getItem(TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY);
    if (storedValue === null) {
      return fallback;
    }

    return storedValue === "true";
  } catch {
    return fallback;
  }
}

export function writeStoredTodayCompletedTasksOpen(open: boolean) {
  try {
    writeStoredPreference(
      TODAY_COMPLETED_TASKS_OPEN_STORAGE_KEY,
      String(open)
    );
  } catch {
    // Keep the disclosure usable in memory when localStorage is unavailable.
  }
}

function readSimpleViewMode() {
  try {
    return typeof window !== "undefined"
      && readStoredViewDensityMode() === "simple";
  } catch {
    return false;
  }
}

function useSimpleViewMode() {
  const [isSimpleView, setIsSimpleView] = useState(readSimpleViewMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const update = () => setIsSimpleView(readSimpleViewMode());

    window.addEventListener("alios-local-preference-change", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("alios-local-preference-change", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return isSimpleView;
}

export function getFocusModeTasks(tasks: Task[], limit = 3): Task[] {
  const actionableTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  );
  const source = actionableTasks.length > 0 ? actionableTasks : tasks;

  return source.slice(0, limit);
}

export interface TodayWorkspaceProps {
  focusId: string | null;
  goalId: string | null;
  hideEmptyTaskState?: boolean;
  hideRecoveryCard?: boolean;
  hideTaskSummaryHeader?: boolean;
  projectId: string | null;
  routineId: string | null;
  today: string;
}

export function TodayWorkspace({
  focusId,
  goalId,
  hideEmptyTaskState = false,
  hideRecoveryCard = false,
  hideTaskSummaryHeader = false,
  projectId,
  routineId,
  today,
}: TodayWorkspaceProps) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatDate } = useDateFormatter();
  const isSimpleView = useSimpleViewMode();
  const {
    journal: journalRepository,
    decisions: decisionsRepository,
    knowledge: knowledgeRepository,
    dailyCommitments: dailyCommitmentsRepository,
  } = useStorageAdapter();
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showAllRoutineSuggestions, setShowAllRoutineSuggestions] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [completedTasksOpen, setCompletedTasksOpen] = useState(true);
  const [dailyInsightsOpen, setDailyInsightsOpen] = useState(false);
  const [revealedFocusId, setRevealedFocusId] = useState<string | null>(null);
  const [linkedJournalEntries, setLinkedJournalEntries] = useState<JournalEntry[]>([]);
  const [linkedDecisions, setLinkedDecisions] = useState<DecisionLogEntry[]>([]);
  const [linkedKnowledgeItems, setLinkedKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [dailyCommitment, setDailyCommitment] =
    useState<DailyCommitment | undefined>();
  const [linkedContentError, setLinkedContentError] = useState<string | null>(null);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const plannedTaskRef = useRef<HTMLDivElement | null>(null);
  const filteredProject = findProjectFilter(projectId, projects);
  const filteredRoutine = findRoutineFilter(routineId, routines);
  const clearFilterPath = (filter: "goalId" | "projectId" | "routineId") => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(filter);
    return `/today?${nextParams.toString()}`;
  };
  const linkedGoalProjectIds = useMemo(() => new Set(
    projects
      .filter((project) => project.goalId === goalId)
      .map((project) => project.id)
  ), [goalId, projects]);
  const visibleTasks = useMemo(() => tasks.filter(
    (task) =>
      (!goalId || (task.projectId ? linkedGoalProjectIds.has(task.projectId) : false)) &&
      (!projectId || task.projectId === projectId) &&
      (!routineId || task.routineId === routineId)
  ), [goalId, linkedGoalProjectIds, projectId, routineId, tasks]);
  const orderedVisibleTasks = useMemo(() => {
    const rank = (task: Task) => {
      if (task.isMit) {
        return 0;
      }
      if (task.status === "doing") {
        return 1;
      }
      if (task.status === "todo") {
        return 2;
      }
      if (task.status === "deferred") {
        return 3;
      }
      if (task.status === "done") {
        return 4;
      }
      return 5;
    };

    return [...visibleTasks].sort((left, right) => {
      const rankDiff = rank(left) - rank(right);
      if (rankDiff !== 0) {
        return rankDiff;
      }

      if (left.priority !== right.priority) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[left.priority] - priorityOrder[right.priority];
      }

      return left.createdAt.localeCompare(right.createdAt);
    });
  }, [visibleTasks]);
  const taskPreviewLimit = isSimpleView ? 6 : 12;
  const displayedTasks = useMemo(() => {
    if (isFocusMode) {
      const focusTasks = getFocusModeTasks(orderedVisibleTasks);
      const focusedTask = focusId
        ? orderedVisibleTasks.find((task) => task.id === focusId)
        : undefined;

      return focusedTask && !focusTasks.some((task) => task.id === focusedTask.id)
        ? [...focusTasks, focusedTask]
        : focusTasks;
    }

    if (showAllTasks || orderedVisibleTasks.length <= taskPreviewLimit) {
      return orderedVisibleTasks;
    }

    const preview = orderedVisibleTasks.slice(0, taskPreviewLimit);
    const focusedTask = focusId
      ? orderedVisibleTasks.find((task) => task.id === focusId)
      : undefined;

    return focusedTask && !preview.some((task) => task.id === focusedTask.id)
      ? [...preview, focusedTask]
      : preview;
  }, [focusId, isFocusMode, orderedVisibleTasks, showAllTasks, taskPreviewLimit]);
  const hiddenTaskCount = Math.max(visibleTasks.length - displayedTasks.length, 0);
  const plannedTaskOutsideToday = getPlannedTaskOutsideToday(weeklyPlanFocus, today);
  const routineSuggestions = getRoutineSuggestions(
    routines,
    tasks,
    today,
    parseISO(today).getDay()
  );
  const routineSuggestionPreviewLimit = isSimpleView ? 3 : 6;
  const visibleRoutineSuggestions = showAllRoutineSuggestions
    ? routineSuggestions
    : routineSuggestions.slice(0, routineSuggestionPreviewLimit);
  const hiddenRoutineSuggestionCount = Math.max(
    routineSuggestions.length - visibleRoutineSuggestions.length,
    0
  );
  const reviewDueProjects = projects.filter((project) => isProjectReviewDue(project));
  const mitTask = orderedVisibleTasks.find((task) => task.isMit);
  const activeTaskCount = orderedVisibleTasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  ).length;
  const completedTaskCount = orderedVisibleTasks.filter((task) => task.status === "done").length;
  const deferredTaskCount = orderedVisibleTasks.filter((task) => task.status === "deferred").length;
  const visibleOpenTasks = displayedTasks.filter((task) => task.status !== "done");
  const visibleCompletedTasks = displayedTasks.filter((task) => task.status === "done");
  const focusedCompletedTaskId = visibleCompletedTasks.find((task) => task.id === focusId)?.id;
  const focusedPlannedTaskId = plannedTaskOutsideToday?.id === focusId ? focusId : null;
  const shouldShowDailyCheckin = new Date().getHours() >= 17;
  const linkedContentForTask = (task: Task) => ({
    journalEntries: linkedJournalEntries.filter((entry) => entry.taskId === task.id),
    decisions: linkedDecisions.filter((decision) => decision.taskId === task.id),
    knowledgeItems: linkedKnowledgeItems.filter((item) => item.taskId === task.id),
  });

  useEffect(() => {
    setCompletedTasksOpen(readStoredTodayCompletedTasksOpen(completedTaskCount));
  }, [completedTaskCount]);

  useEffect(() => {
    if (focusedCompletedTaskId) {
      setCompletedTasksOpen(true);
    }
    if (focusedPlannedTaskId) {
      setDailyInsightsOpen(true);
    }
    setRevealedFocusId(focusedCompletedTaskId ?? focusedPlannedTaskId);
  }, [focusedCompletedTaskId, focusedPlannedTaskId]);

  useEffect(() => {
    let isCancelled = false;

    void Promise.all([
      journalRepository.list(),
      decisionsRepository.list(),
      knowledgeRepository.list(),
    ])
      .then(([nextJournalEntries, nextDecisions, nextKnowledgeItems]) => {
        if (isCancelled) {
          return;
        }

        setLinkedJournalEntries(nextJournalEntries);
        setLinkedDecisions(nextDecisions);
        setLinkedKnowledgeItems(nextKnowledgeItems);
        setLinkedContentError(null);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setLinkedJournalEntries([]);
        setLinkedDecisions([]);
        setLinkedKnowledgeItems([]);
        setLinkedContentError(t("links.loadError"));
      });

    return () => {
      isCancelled = true;
    };
  }, [decisionsRepository, journalRepository, knowledgeRepository, t]);

  useEffect(() => {
    let isCancelled = false;

    void dailyCommitmentsRepository
      .getCommitmentByDate(today)
      .then((commitment) => {
        if (!isCancelled) {
          setDailyCommitment(commitment);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setDailyCommitment(undefined);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [dailyCommitmentsRepository, today]);

  const handleCompletedTasksOpenChange = (open: boolean) => {
    setCompletedTasksOpen(open);
    writeStoredTodayCompletedTasksOpen(open);
  };

  const showError = (caught: unknown, fallback: string) => {
    setActionError(caught instanceof Error ? caught.message : fallback);
  };

  const openCreateTask = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (searchParams.get("action") !== "new") {
      return;
    }

    openCreateTask();

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("action");
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: getScrollBehavior() });
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
    const { recurrenceFrequency, ...taskValues } = values;
    const input = {
      ...taskValues,
      description: values.description || undefined,
      projectId: values.projectId || undefined,
      scheduledStartTime: values.scheduledStartTime || undefined,
      estimatedMinutes: values.estimatedMinutes || undefined,
      recurrence:
        recurrenceFrequency === "none"
          ? undefined
          : { frequency: recurrenceFrequency },
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

  const handleScheduleTask = (task: Task, scheduledStartTime: string) =>
    runTaskAction(
      task.id,
      () => updateTask(task.id, { scheduledStartTime }),
      t("today.timeBlockingMoved"),
      t("today.taskSaveError")
    );

  const handleAddRoutine = async (routine: (typeof routines)[number]) => {
    setBusyRoutineId(routine.id);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await createRoutineTask(createRoutineTaskInput(routine, today));
      setSuccessMessage(t("routines.addedToToday"));
    } catch (caught) {
      showError(caught, t("today.taskSaveError"));
    } finally {
      setBusyRoutineId(null);
    }
  };

  const handleCompleteMinimumRoutine = async (routine: (typeof routines)[number]) => {
    setBusyRoutineId(routine.id);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const result = await createRoutineTask(createRoutineTaskInput(routine, today));
      await updateTask(result.task.id, {
        status: "done",
        completedAt: new Date().toISOString(),
        completedMinimum: true,
      });
      await Promise.all([loadToday(), loadTodayWeeklyPlan()]);
      setSuccessMessage(t("routine.minimumCompleted"));
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
      if (revealedFocusId !== focusId) {
        return;
      }
      plannedTaskRef.current?.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });

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
    // Wait for the completed disclosure to reveal the deep-link destination.
    if (focusedTask.status === "done" && revealedFocusId !== focusId) {
      return;
    }
    const node = taskRefs.current[focusId];
    node?.scrollIntoView({ behavior: getScrollBehavior(), block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedTaskId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusId, isLoading, plannedTaskOutsideToday, revealedFocusId, t, visibleTasks]);

  return (
    <section className="alios-page alios-today-workspace space-y-5">
      {projectId ? (
        <div
          role="status"
          className="alios-surface-muted flex flex-col gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {filteredProject
              ? t("today.projectFilterActive", { title: filteredProject.title })
              : t("today.projectFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={clearFilterPath("projectId")}>
              {t("today.clearProjectFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      {goalId ? (
        <div
          role="status"
          className="alios-surface-muted flex flex-col gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {linkedGoalProjectIds.size > 0
              ? t("today.projectFilterActive", {
                  title: `${linkedGoalProjectIds.size} ${t("projects.title")}`,
                })
              : t("today.projectFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={clearFilterPath("goalId")}>
              {t("goals.clearFilters")}
            </Link>
          </Button>
        </div>
      ) : null}

      {routineId ? (
        <div
          role="status"
          className="alios-surface-muted flex flex-col gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-foreground">
            {filteredRoutine
              ? t("today.routineFilterActive", { title: filteredRoutine.title })
              : t("today.routineFilterUnavailable")}
          </p>
          <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
            <Link to={clearFilterPath("routineId")}>
              {t("today.clearRoutineFilter")}
            </Link>
          </Button>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="alios-status-success px-4 py-3 text-sm"
        >
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="alios-status-danger flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
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
      {linkedContentError ? (
        <div
          role="alert"
          className="alios-surface-muted flex items-start gap-2 p-4 text-sm text-muted-foreground"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{linkedContentError}</span>
        </div>
      ) : null}
      {focusMessage ? (
        <div
          role="status"
          className="alios-surface-muted border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
        </div>
      ) : null}

      {hideRecoveryCard ? null : (
        <Suspense fallback={null}>
          <RecoveryCard today={today} onAddTask={openCreateTask} />
        </Suspense>
      )}

      {hideTaskSummaryHeader ? null : (
        <header className="alios-today-header">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={today} className="tabular-nums">{formatDate(today)}</time>
              {mitTask ? <span className="text-xs">· {t("today.mit")}</span> : null}
            </div>
            <SectionHeader
              variant="page"
              title={t("today.tasks")}
              description={t("today.tasksDescription")}
              status={
                <StatusChip tone={activeTaskCount > 0 ? "primary" : "neutral"}>
                  {activeTaskCount} {t("common.active")}
                </StatusChip>
              }
            />
          </div>
          <div className="alios-today-header-actions">
            <Button type="button" onClick={openCreateTask}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("today.newTask")}
            </Button>
            <Button
              type="button"
              variant={isFocusMode ? "default" : "outline"}
              onClick={() => setIsFocusMode((current) => !current)}
              aria-pressed={isFocusMode}
            >
              <Target className="h-4 w-4" aria-hidden="true" />
              {isFocusMode ? t("today.focusModeOn") : t("today.focusMode")}
            </Button>
          </div>
        </header>
      )}

      {taskFormOpen ? (
        <PremiumCard className="alios-today-editor border-border/70 bg-card/95">
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
          className="alios-surface-muted flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
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

      <div className="alios-today-layout">
        <div className="alios-today-execution min-w-0 space-y-4" aria-busy={isLoading}>
          {isLoading ? (
            <div className="space-y-3" role="status">
              <p className="sr-only">{t("today.loadingTasks")}</p>
              {[0, 1, 2].map((item) => (
                <div key={item} aria-hidden="true" className="alios-surface-muted h-28 motion-safe:animate-pulse bg-muted/60" />
              ))}
            </div>
          ) : visibleTasks.length === 0 && !error && !hideEmptyTaskState ? (
            <EmptyState
              className="alios-today-empty"
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
          ) : visibleTasks.length > 0 ? (
            <div className="alios-today-task-list space-y-3">
              {isFocusMode ? (
                <SoftPanel className="border-alios-saffron/40 bg-alios-saffron/10">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {t("today.focusMode")}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t("today.focusModeDescription", {
                          count: Math.min(displayedTasks.length, 3),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setIsFocusMode(false)}
                    >
                      {t("today.showAllTasks")}
                    </Button>
                  </div>
                </SoftPanel>
              ) : null}
              {visibleOpenTasks.map((task, index) => (
                <div
                  key={task.id}
                  ref={(node) => {
                    taskRefs.current[task.id] = node;
                  }}
                  className={cn(
                    "scroll-mt-24 rounded-surface transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                    aliosListItemMotion,
                    aliosStaggerDelay(index),
                    "motion-reduce:animate-none motion-reduce:opacity-100",
                    focusedTaskId === task.id
                      ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                      : null
                  )}
                >
                  <TodayTaskCard
                    task={task}
                    linkedProject={findLinkedProject(task, projects)}
                    linkedJournalEntries={linkedContentForTask(task).journalEntries}
                    linkedDecisions={linkedContentForTask(task).decisions}
                    linkedKnowledgeItems={linkedContentForTask(task).knowledgeItems}
                    isLinkedProjectLoading={isProjectsLoading}
                    isBusy={busyTaskId === task.id}
                    focusSessionPath={
                      isFocusMode
                        ? `/focus?taskId=${encodeURIComponent(task.id)}`
                        : undefined
                    }
                    onEdit={() => openEditTask(task)}
                    onStatusChange={(status) => handleStatusChange(task, status)}
                    onSelectMit={() => handleSelectMit(task)}
                    onDelete={() => handleDeleteTask(task)}
                  />
                </div>
              ))}
              {visibleCompletedTasks.length > 0 ? (
                <CollapsibleSection
                  id="today-completed-tasks"
                  title={`${t("common.completed")} (${completedTaskCount})`}
                  icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  status={<StatusChip tone="success">{completedTaskCount}</StatusChip>}
                  open={completedTasksOpen}
                  onOpenChange={handleCompletedTasksOpenChange}
                  expandLabel={t("common.expandSection")}
                  collapseLabel={t("common.collapseSection")}
                  contentClassName="space-y-3"
                  className="alios-today-completed border-border/70 bg-card/95"
                >
                  {visibleCompletedTasks.map((task, index) => (
                    <div
                      key={task.id}
                      ref={(node) => {
                        taskRefs.current[task.id] = node;
                      }}
                      className={cn(
                        "scroll-mt-24 rounded-surface transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                        aliosListItemMotion,
                        aliosStaggerDelay(index),
                        "motion-reduce:animate-none motion-reduce:opacity-100",
                        focusedTaskId === task.id
                          ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                          : null
                      )}
                    >
                      <TodayTaskCard
                        task={task}
                        linkedProject={findLinkedProject(task, projects)}
                        linkedJournalEntries={linkedContentForTask(task).journalEntries}
                        linkedDecisions={linkedContentForTask(task).decisions}
                        linkedKnowledgeItems={linkedContentForTask(task).knowledgeItems}
                        isLinkedProjectLoading={isProjectsLoading}
                        isBusy={busyTaskId === task.id}
                        onEdit={() => openEditTask(task)}
                        onStatusChange={(status) => handleStatusChange(task, status)}
                        onSelectMit={() => handleSelectMit(task)}
                        onDelete={() => handleDeleteTask(task)}
                      />
                    </div>
                  ))}
                </CollapsibleSection>
              ) : null}
              {!isFocusMode && (hiddenTaskCount > 0 || showAllTasks) ? (
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
          ) : null}
        </div>

        <div className="alios-today-context min-w-0 space-y-4">
          {dailyCommitment ? (
            <SoftPanel className="alios-today-commitment border-primary/15 bg-primary/5">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">
                    {t("commitment.cardTitle")}
                  </p>
                  <p className="break-words text-sm leading-6 text-muted-foreground">
                    {dailyCommitment.title}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {dailyCommitment.plannedStartTime}
                  </span>
                  <StatusChip tone={dailyCommitment.didStart ? "success" : "neutral"}>
                    {dailyCommitment.didStart
                      ? t("commitment.statusStarted")
                      : t("commitment.statusNotStarted")}
                  </StatusChip>
                </div>
              </div>
            </SoftPanel>
          ) : null}

          <TodayTimeBlockingTimeline
            tasks={orderedVisibleTasks}
            onTaskScheduleChange={handleScheduleTask}
          />

          <TodayWeeklyPlanCard focus={weeklyPlanFocus} isLoading={isWeeklyPlanLoading} />

          <CollapsibleSection
            id="today-routine-suggestions"
            title={t("routines.todayTitle")}
            description={t("routines.todayDescription")}
            icon={<Repeat2 className="h-5 w-5" />}
            status={
              routineSuggestions.length > 0 ? (
                <StatusChip tone="neutral">{routineSuggestions.length}</StatusChip>
              ) : null
            }
            defaultOpen={false}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            contentClassName="space-y-3"
            className="border-border/70 bg-card/95"
          >
              {routinesError ? (
                <div className="alios-surface-muted flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">{t("routines.todayUnavailable")}</p>
                  <Button size="sm" variant="outline" onClick={() => void loadRoutines()}>{t("common.tryAgain")}</Button>
                </div>
              ) : isRoutinesLoading ? (
                <div className="alios-surface-muted h-16 motion-safe:animate-pulse bg-muted/60" />
              ) : routineSuggestions.length > 0 ? (
                <>
                  <div className="grid gap-3">
                    {visibleRoutineSuggestions.map((routine) => (
                      <div
                        key={routine.id}
                        className="alios-surface-muted grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="break-words font-medium">{routine.title}</p>
                          {routine.minimumVersion ? (
                            <div className="mt-2 flex min-w-0 flex-col gap-2 rounded-xl border border-primary/15 bg-primary/5 p-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="min-w-0 break-words text-sm leading-6 text-muted-foreground">
                                {t("routine.minimumPrompt")} {routine.minimumVersion}
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full shrink-0 sm:w-auto"
                                disabled={busyRoutineId === routine.id}
                                onClick={() => void handleCompleteMinimumRoutine(routine)}
                              >
                                {t("routine.doMinimum")}
                              </Button>
                            </div>
                          ) : null}
                          {routine.description ? (
                            <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
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
          </CollapsibleSection>

          {shouldShowDailyCheckin ? (
            <CollapsibleSection
              id="today-daily-checkin"
              title={t("today.checkin")}
              icon={<Sparkles className="h-5 w-5" />}
              defaultOpen={false}
              expandLabel={t("common.expandSection")}
              collapseLabel={t("common.collapseSection")}
              className="border-border/70 bg-card/95"
            >
                {isLoading ? (
                  <div className="alios-surface-muted h-72 motion-safe:animate-pulse bg-muted/60" />
                ) : (
                  <DailyCheckinForm
                    key={checkin?.updatedAt ?? "new-checkin"}
                    checkin={checkin}
                    isSubmitting={isCheckinSubmitting}
                    onSubmit={handleCheckinSubmit}
                  />
                )}
            </CollapsibleSection>
          ) : null}

          {(reviewDueProjects.length > 0 || plannedTaskOutsideToday || deferredTaskCount > 0) ? (
            <CollapsibleSection
              id="today-daily-insights"
              title={t("home.dailyInsights")}
              icon={<Clock3 className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{reviewDueProjects.length + deferredTaskCount + (plannedTaskOutsideToday ? 1 : 0)}</StatusChip>}
              defaultOpen={false}
              open={dailyInsightsOpen}
              onOpenChange={setDailyInsightsOpen}
              expandLabel={t("common.expandSection")}
              collapseLabel={t("common.collapseSection")}
              contentClassName="space-y-4"
              className="border-border/70 bg-card/95"
            >
                {plannedTaskOutsideToday ? (
                  <div
                    ref={plannedTaskRef}
                    className={cn(
                      "rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                      focusedTaskId === plannedTaskOutsideToday.id
                        ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                        : null
                    )}
                  >
                    <SoftPanel className="space-y-3 border-primary/15 bg-primary/5">
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
                        linkedJournalEntries={linkedContentForTask(plannedTaskOutsideToday).journalEntries}
                        linkedDecisions={linkedContentForTask(plannedTaskOutsideToday).decisions}
                        linkedKnowledgeItems={linkedContentForTask(plannedTaskOutsideToday).knowledgeItems}
                        isLinkedProjectLoading={isProjectsLoading}
                        isBusy={busyTaskId === plannedTaskOutsideToday.id}
                        contextLabel={t("weeklyReview.title")}
                        allowMit={false}
                        onEdit={() => openEditTask(plannedTaskOutsideToday)}
                        onStatusChange={(status) => handleStatusChange(plannedTaskOutsideToday, status)}
                        onSelectMit={() => handleSelectMit(plannedTaskOutsideToday)}
                        onDelete={() => handleDeleteTask(plannedTaskOutsideToday)}
                      />
                    </SoftPanel>
                  </div>
                ) : null}

                {reviewDueProjects.length > 0 ? (
                  <div className="space-y-3">
                    {reviewDueProjects.map((project) => (
                      <div
                        key={project.id}
                        className="alios-surface-muted flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
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
                  </div>
                ) : null}

                {deferredTaskCount > 0 ? (
                  <SoftPanel className="border-border/80 bg-background/80">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{t("today.deferred")}</p>
                      <StatusChip tone="warning">{deferredTaskCount}</StatusChip>
                    </div>
                  </SoftPanel>
                ) : null}

                {completedTaskCount > 0 ? (
                  <SoftPanel className="border-border/80 bg-background/80">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{t("common.completed")}</p>
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    {completedTaskCount}
                  </span>
                </div>
              </SoftPanel>
            ) : null}
            </CollapsibleSection>
          ) : null}
        </div>
      </div>
    </section>
  );
}
