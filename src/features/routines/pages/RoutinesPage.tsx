import {
  AlertCircle,
  Flame,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import { TASK_PRIORITY_LABEL_KEYS } from "@/features/today/constants";
import { useI18n } from "@/shared/i18n";
import type { Routine, Task } from "@/shared/types";
import {
  Badge,
  Button,
  CardContent,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  EmptyState,
  PremiumCard,
  SectionHeader,
  SoftPanel,
} from "@/shared/ui";
import { QuickAccessToggleButton } from "@/shared/quickAccess";

import {
  ROUTINE_WEEKDAY_LABEL_KEYS,
  RoutineForm,
  type RoutineFormValues,
} from "../components/RoutineForm";
import { useRoutines } from "../hooks/useRoutines";
import { createRoutineTodayTasksPath } from "../routineTaskLinks";
import { getRoutineTaskProgress } from "../routineTaskProgress";
import { getRoutineCurrentStreak } from "../routineStreak";

type RoutineCardProps = {
  routine: Routine;
  tasks: Task[];
  isTasksLoading: boolean;
  isFocused: boolean;
  deletingId: string | null;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
};

function RoutineCard({
  routine,
  tasks,
  isTasksLoading,
  isFocused,
  deletingId,
  onEdit,
  onDelete,
}: RoutineCardProps) {
  const { t } = useI18n();
  const [showOverflowActions, setShowOverflowActions] = useState(false);
  const progress = getRoutineTaskProgress(routine.id, tasks);
  const streak = getRoutineCurrentStreak(routine, tasks);

  return (
    <PremiumCard
      className={isFocused ? "ring-2 ring-primary ring-offset-2" : undefined}
    >
      <CardHeader>
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
          <CardTitle className="min-w-0 break-words">{routine.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant={routine.isActive ? "secondary" : "outline"}>
              {routine.isActive ? t("routines.active") : t("routines.paused")}
            </Badge>
            <Badge variant="outline">
              {t(TASK_PRIORITY_LABEL_KEYS[routine.priority])}
            </Badge>
            {streak > 0 ? (
              <Badge
                variant="outline"
                className="border-alios-saffron/50 bg-alios-saffron/10 text-alios-caspian dark:text-alios-paper"
              >
                <Flame className="me-1 h-3.5 w-3.5 text-alios-saffron" />
                {t("routines.currentStreak", { count: streak })}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {routine.description ? (
          <p className="break-words whitespace-pre-wrap text-sm text-muted-foreground">
            {routine.description}
          </p>
        ) : null}
        <p className="break-words text-sm text-muted-foreground">
          {routine.weekdays
            .map((day) => t(ROUTINE_WEEKDAY_LABEL_KEYS[day]))
            .join("، ")}
        </p>

        <SoftPanel className="space-y-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                {t("routines.taskProgress")}
              </p>
              <p className="text-sm font-medium">
                {isTasksLoading
                  ? t("common.loading")
                  : progress.total === 0
                    ? t("routines.notStartedYet")
                    : t("routines.taskProgressSimple", progress)}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
              <Link to={createRoutineTodayTasksPath(routine.id)}>
                {t("routines.openTodayTasks")}
              </Link>
            </Button>
          </div>
        </SoftPanel>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deletingId === routine.id}
            onClick={() => onDelete(routine)}
          >
            <Trash2 className="me-2 h-4 w-4" />
            {deletingId === routine.id ? t("common.deleting") : t("common.delete")}
          </Button>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              aria-label={t("command.quickActions")}
              aria-expanded={showOverflowActions}
              onClick={() => setShowOverflowActions((current) => !current)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showOverflowActions ? (
              <div className="absolute end-0 z-20 mt-2 grid min-w-56 gap-1 rounded-xl border bg-popover p-2 text-popover-foreground shadow-aliosFloating">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setShowOverflowActions(false);
                    onEdit(routine);
                  }}
                >
                  <Pencil className="me-2 h-4 w-4" />
                  {t("common.edit")}
                </Button>
                <QuickAccessToggleButton itemType="routine" targetId={routine.id} />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </PremiumCard>
  );
}

export function RoutinesPage() {
  const { t } = useI18n();
  const { tasks: tasksRepository } = useStorageAdapter();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focusId");
  const {
    entries,
    isLoading,
    error,
    loadRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
  } = useRoutines();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine>();
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showAllRoutines, setShowAllRoutines] = useState(false);
  const routinePreviewLimit = 6;
  const activeRoutines = entries.filter((routine) => routine.isActive);
  const pausedRoutines = entries.filter((routine) => !routine.isActive);
  const orderedRoutines = [...activeRoutines, ...pausedRoutines];
  const focusRequiresAllRoutines = orderedRoutines.findIndex((routine) => routine.id === focusId) >= routinePreviewLimit;
  const displayedRoutines = showAllRoutines || focusRequiresAllRoutines
    ? orderedRoutines
    : orderedRoutines.slice(0, routinePreviewLimit);
  const displayedActiveRoutines = displayedRoutines.filter((routine) => routine.isActive);
  const displayedPausedRoutines = displayedRoutines.filter((routine) => !routine.isActive);
  const hiddenRoutineCount = Math.max(entries.length - displayedRoutines.length, 0);

  const loadRoutineTasks = async () => {
    setIsTasksLoading(true);
    setTasksError(null);

    try {
      setTasks(await tasksRepository.list());
    } catch (caught) {
      setTasksError(
        caught instanceof Error ? caught.message : t("routines.progressUnavailable")
      );
    } finally {
      setIsTasksLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutineTasks();
  }, [tasksRepository]);

  const close = () => {
    setFormOpen(false);
    setEditing(undefined);
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
    setActionError(null);
    setMessage(null);
  };

  const submit = async (values: RoutineFormValues) => {
    setBusy(true);
    setActionError(null);
    setMessage(null);

    try {
      if (editing) {
        await updateRoutine(editing.id, values);
      } else {
        await createRoutine(values);
      }
      setMessage(editing ? t("routines.updated") : t("routines.created"));
      close();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("routines.saveError")
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (routine: Routine) => {
    if (!window.confirm(t("routines.deleteConfirm"))) {
      return;
    }

    setDeletingId(routine.id);
    setActionError(null);
    setMessage(null);

    try {
      await deleteRoutine(routine.id);
      setMessage(t("routines.deleted"));
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("routines.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface">
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<Repeat2 className="h-5 w-5" />}
            title={t("routineManager.title")}
            description={t("routineManager.description")}
            actions={
              <Button onClick={openCreate}>
                <Plus className="me-2 h-4 w-4" />
                {t("routines.new")}
              </Button>
            }
          />
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {t("routines.progressNote")}
          </p>
        </CardContent>
      </PremiumCard>

      {message ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm"
        >
          {message}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="min-w-0 break-words">{actionError ?? error}</span>
          {error ? (
            <Button size="sm" variant="outline" onClick={() => void loadRoutines()}>
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {tasksError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{t("routines.progressUnavailable")}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => void loadRoutineTasks()}>
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {formOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>{editing ? t("routines.edit") : t("routines.create")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RoutineForm
              routine={editing}
              isSubmitting={busy}
              onCancel={close}
              onSubmit={submit}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Repeat2 className="h-6 w-6" />}
          title={t("routines.emptyTitle")}
          description={t("routines.emptyDescription")}
          actions={
            <Button onClick={openCreate}>
              <Plus className="me-2 h-4 w-4" />
              {t("routines.createFirst")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedActiveRoutines.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {displayedActiveRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  tasks={tasks}
                  isTasksLoading={isTasksLoading}
                  isFocused={focusId === routine.id}
                  deletingId={deletingId}
                  onEdit={(targetRoutine) => {
                    setEditing(targetRoutine);
                    setFormOpen(true);
                    setActionError(null);
                    setMessage(null);
                  }}
                  onDelete={(targetRoutine) => void remove(targetRoutine)}
                />
              ))}
            </div>
          ) : null}

          {displayedPausedRoutines.length > 0 ? (
            <CollapsibleSection
              id="routines-paused"
              title={t("routines.pausedSection")}
              status={<Badge variant="outline">{displayedPausedRoutines.length}</Badge>}
              defaultOpen={activeRoutines.length === 0 || displayedPausedRoutines.some((routine) => routine.id === focusId)}
              expandLabel={t("common.expandSection")}
              collapseLabel={t("common.collapseSection")}
              contentClassName="grid gap-4 xl:grid-cols-2"
            >
              {displayedPausedRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  tasks={tasks}
                  isTasksLoading={isTasksLoading}
                  isFocused={focusId === routine.id}
                  deletingId={deletingId}
                  onEdit={(targetRoutine) => {
                    setEditing(targetRoutine);
                    setFormOpen(true);
                    setActionError(null);
                    setMessage(null);
                  }}
                  onDelete={(targetRoutine) => void remove(targetRoutine)}
                />
              ))}
            </CollapsibleSection>
          ) : null}
        </div>
      )}
      {entries.length > routinePreviewLimit && !focusRequiresAllRoutines ? (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setShowAllRoutines((current) => !current)}>
            {showAllRoutines
              ? t("common.showFewer")
              : t("common.showMoreCount", { count: hiddenRoutineCount })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
