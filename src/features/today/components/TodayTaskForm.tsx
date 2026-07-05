import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "../constants";
import { todayTaskFormSchema, type TodayTaskFormValues } from "../types";

type TodayTaskFormProps = {
  task?: Task;
  isSubmitting: boolean;
  onSubmit: (values: TodayTaskFormValues) => Promise<void>;
  onCancel: () => void;
};

export function TodayTaskForm({
  task,
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

      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-input accent-primary"
          {...register("isMit")}
        />
        {t("today.makeMit")}
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : task ? t("common.saveChanges") : t("today.createTaskButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
