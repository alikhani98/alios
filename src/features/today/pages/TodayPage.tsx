import { AlertCircle, CalendarDays, CheckSquare2, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

import type { CreateTaskInput, UpdateTaskInput } from "@/core/repositories";
import type { Task, TaskStatus } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { DailyCheckinForm } from "../components/DailyCheckinForm";
import { TodayTaskCard } from "../components/TodayTaskCard";
import { TodayTaskForm } from "../components/TodayTaskForm";
import { useTodayData } from "../hooks/useTodayData";
import type { DailyCheckinFormValues, TodayTaskFormValues } from "../types";

export function TodayPage() {
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
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isCheckinSubmitting, setIsCheckinSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
          ? "Daily check-in updated successfully."
          : "Daily check-in saved successfully."
      );
    } catch (caught) {
      showError(caught, "The daily check-in could not be saved.");
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
        setSuccessMessage("Task updated successfully.");
      } else {
        await createTask(input as Omit<CreateTaskInput, "dueDate">);
        setSuccessMessage("Task created successfully.");
      }
      closeTaskForm();
    } catch (caught) {
      showError(caught, "The task could not be saved.");
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
      "Task status updated.",
      "The task status could not be updated."
    );

  const handleSelectMit = (task: Task) =>
    runTaskAction(
      task.id,
      () => selectMit(task.id),
      "Most Important Task selected.",
      "The MIT selection could not be saved."
    );

  const handleDeleteTask = (task: Task) =>
    runTaskAction(
      task.id,
      () => deleteTask(task.id),
      "Task deleted successfully.",
      "The task could not be deleted."
    );

  return (
    <section className="alios-page space-y-6">
      <div className="alios-page-header">
        <h2 className="alios-page-title">Today</h2>
        <p className="alios-page-description">
          Record today’s state and keep the day’s work focused.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

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
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daily Check-in</CardTitle>
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
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Today’s tasks</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one MIT and keep every task’s status current.
          </p>
        </div>
        <Button type="button" onClick={openCreateTask}>
          <Plus className="me-2 h-4 w-4" />
          New task
        </Button>
      </div>

      {taskFormOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingTask ? "Edit task" : "Create a task"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayTaskForm
              key={editingTask?.id ?? "new-task"}
              task={editingTask}
              isSubmitting={isTaskSubmitting}
              onSubmit={handleTaskSubmit}
              onCancel={closeTaskForm}
            />
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading today's tasks">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border bg-muted/60" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckSquare2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No tasks for today</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Add the next concrete action that deserves your attention.
            </p>
            <Button type="button" className="mt-5" onClick={openCreateTask}>
              <Plus className="me-2 h-4 w-4" />
              Create first task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TodayTaskCard
              key={task.id}
              task={task}
              isBusy={busyTaskId === task.id}
              onEdit={() => openEditTask(task)}
              onStatusChange={(status) => handleStatusChange(task, status)}
              onSelectMit={() => handleSelectMit(task)}
              onDelete={() => handleDeleteTask(task)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
