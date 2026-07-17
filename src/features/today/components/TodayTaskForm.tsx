import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PROJECT_STATUS_LABEL_KEYS } from "@/features/projects/constants";
import type { Project, Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "../constants";
import { todayTaskFormSchema, type TodayTaskFormValues } from "../types";

type TodayTaskFormProps = {
  task?: Task;
  projects: ReadonlyArray<Project>;
  isProjectsLoading: boolean;
  areProjectsUnavailable: boolean;
  defaultDueDate: string;
  isSubmitting: boolean;
  onSubmit: (values: TodayTaskFormValues) => Promise<void>;
  onCancel: () => void;
};

export function TodayTaskForm({
  task,
  projects,
  isProjectsLoading,
  areProjectsUnavailable,
  defaultDueDate,
  isSubmitting,
  onSubmit,
  onCancel,
}: TodayTaskFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TodayTaskFormValues>({
    resolver: zodResolver(todayTaskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      isMit: task?.isMit ?? false,
      dueDate: task?.dueDate ?? defaultDueDate,
      projectId: task?.projectId ?? "",
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-2">
        <label htmlFor="today-task-title" className="text-sm font-medium">
          {t("today.taskTitle")}
        </label>
        <Input
          id="today-task-title"
          autoFocus
          placeholder={t("today.taskTitlePlaceholder")}
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="today-task-description" className="text-sm font-medium">
          {t("common.description")}
        </label>
        <Textarea
          id="today-task-description"
          placeholder={t("today.optionalDetails")}
          {...register("description")}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="today-task-project" className="text-sm font-medium">
          {t("today.linkedProject")}
        </label>
        <select
          id="today-task-project"
          className="flex h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          {...register("projectId")}
        >
          <option value="">{t("today.noLinkedProject")}</option>
          {task?.projectId &&
          !projects.some((project) => project.id === task.projectId) ? (
            <option value={task.projectId}>
              {t("today.currentProjectUnavailable")}
            </option>
          ) : null}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title} · {t(PROJECT_STATUS_LABEL_KEYS[project.status])}
            </option>
          ))}
        </select>
        <p className="break-words text-sm leading-6 text-muted-foreground">
          {isProjectsLoading
            ? t("today.linkedProjectLoading")
            : areProjectsUnavailable
              ? t("today.linkedProjectUnavailableNote")
              : t("today.linkedProjectOptionalNote")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="today-task-status" className="text-sm font-medium">
            {t("common.status")}
          </label>
          <select
            id="today-task-status"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("status")}
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="today-task-priority" className="text-sm font-medium">
            {t("common.priority")}
          </label>
          <select
            id="today-task-priority"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("priority")}
          >
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="today-task-due-date" className="text-sm font-medium">
          {t("home.taskDate")}
        </label>
        <Input
          id="today-task-due-date"
          type="date"
          aria-describedby="today-task-due-date-help"
          aria-invalid={Boolean(errors.dueDate)}
          {...register("dueDate")}
        />
        <p
          id="today-task-due-date-help"
          className="text-xs leading-5 text-muted-foreground"
        >
          {t("home.duePlannedDate")}
        </p>
        {errors.dueDate ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-input accent-primary"
          {...register("isMit")}
        />
        {t("today.makeMit")}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("common.saving")
            : task
              ? t("common.saveChanges")
              : t("today.createTaskButton")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
