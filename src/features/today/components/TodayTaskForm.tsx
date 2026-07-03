import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Task } from "@/shared/types";
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
          Task title
        </label>
        <Input
          id="today-task-title"
          autoFocus
          placeholder="What needs to move today?"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="today-task-description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="today-task-description"
          placeholder="Optional details"
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="today-task-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="today-task-status"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("status")}
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="today-task-priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="today-task-priority"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("priority")}
          >
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          {...register("isMit")}
        />
        Make this today’s Most Important Task
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : task ? "Save changes" : "Create task"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
