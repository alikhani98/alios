import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PROJECT_STATUS_LABEL_KEYS } from "@/features/projects/constants";
import { detectNaturalDate } from "@/shared/date";
import type { Project, Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, CollapsibleSection, DateValueHint, Input, Select, Textarea } from "@/shared/ui";
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
    watch,
    setValue,
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
      scheduledStartTime: task?.scheduledStartTime ?? "",
      estimatedMinutes: task?.estimatedMinutes,
      projectId: task?.projectId ?? "",
      recurrenceFrequency: task?.recurrence?.frequency ?? "none",
    },
  });
  const titleValue = watch("title");
  const dueDateValue = watch("dueDate");
  const dateSuggestion = detectNaturalDate(titleValue ?? "");

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="alios-surface-muted grid gap-2 border-border/60 p-4">
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
        {dateSuggestion && dateSuggestion.date !== dueDateValue ? (
          <div className="flex flex-col gap-2 rounded-control border border-alios-saffron/40 bg-alios-saffron/10 px-3 py-2 text-sm leading-6 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t("today.naturalDateSuggestion", {
                date: dateSuggestion.date,
                phrase: dateSuggestion.phrase,
              })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setValue("dueDate", dateSuggestion.date, { shouldDirty: true })}
            >
              {t("today.useSuggestedDate")}
            </Button>
          </div>
        ) : null}
      </div>

      <CollapsibleSection
        id="today-task-advanced-fields"
        title={t("today.advancedTaskFields")}
        description={t("today.advancedTaskFieldsDescription")}
        defaultOpen={false}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        contentClassName="grid gap-5"
        className="border-border/70 bg-card/95"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="grid gap-5">

          <div className="alios-surface-muted grid gap-2 border-border/60 p-4">
            <label htmlFor="today-task-description" className="text-sm font-medium">
              {t("common.description")}
            </label>
            <Textarea
              id="today-task-description"
              placeholder={t("today.optionalDetails")}
              className="min-h-28"
              {...register("description")}
            />
          </div>

          <div className="alios-surface-muted grid min-w-0 gap-2 border-border/60 p-4">
            <label htmlFor="today-task-project" className="text-sm font-medium">
              {t("today.linkedProject")}
            </label>
            <Select id="today-task-project" {...register("projectId")}>
              <option value="">{t("today.noLinkedProject")}</option>
              {task?.projectId &&
              !projects.some((project) => project.id === task.projectId) ? (
                <option value={task.projectId}>
                  {t("today.currentProjectUnavailable")}
                </option>
              ) : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {`${project.title} - ${t(PROJECT_STATUS_LABEL_KEYS[project.status])}`}
                </option>
              ))}
            </Select>
            <p className="break-words text-sm leading-6 text-muted-foreground">
              {isProjectsLoading
                ? t("today.linkedProjectLoading")
                : areProjectsUnavailable
                  ? t("today.linkedProjectUnavailableNote")
                  : t("today.linkedProjectOptionalNote")}
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="alios-surface-muted grid gap-4 border-border/60 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="today-task-status" className="text-sm font-medium">
                  {t("common.status")}
                </label>
                <Select id="today-task-status" {...register("status")}>
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="today-task-priority" className="text-sm font-medium">
                  {t("common.priority")}
                </label>
                <Select id="today-task-priority" {...register("priority")}>
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <label className="flex min-h-11 items-center gap-3 rounded-control border border-input bg-background px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-input accent-primary"
                {...register("isMit")}
              />
              <span className="space-y-1">
                <span className="block">{t("today.makeMit")}</span>
                <span className="block text-xs font-normal leading-5 text-muted-foreground">
                  {t("today.makeMitShort")}
                </span>
              </span>
            </label>
          </div>

          <div className="alios-surface-muted grid gap-4 border-border/60 p-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <DateValueHint value={dueDateValue} className="break-words" />
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

              <div className="grid gap-2">
                <label htmlFor="today-task-recurrence" className="text-sm font-medium">
                  {t("today.recurrence")}
                </label>
                <Select id="today-task-recurrence" {...register("recurrenceFrequency")}>
                  <option value="none">{t("today.recurrenceNone")}</option>
                  <option value="daily">{t("today.recurrenceDaily")}</option>
                  <option value="weekly">{t("today.recurrenceWeekly")}</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="today-task-start-time" className="text-sm font-medium">
                  {t("today.scheduledStartTime")}
                </label>
                <Input
                  id="today-task-start-time"
                  type="time"
                  aria-invalid={Boolean(errors.scheduledStartTime)}
                  {...register("scheduledStartTime")}
                />
                {errors.scheduledStartTime ? (
                  <p className="text-sm text-destructive">{t("common.validation")}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <label htmlFor="today-task-estimated-minutes" className="text-sm font-medium">
                  {t("today.estimatedMinutes")}
                </label>
                <Input
                  id="today-task-estimated-minutes"
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  placeholder={t("today.estimatedMinutesPlaceholder")}
                  aria-invalid={Boolean(errors.estimatedMinutes)}
                  {...register("estimatedMinutes")}
                />
                {errors.estimatedMinutes ? (
                  <p className="text-sm text-destructive">{t("common.validation")}</p>
                ) : null}
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("today.recurrenceHint")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("today.routineVsRecurringNote")}
            </p>
          </div>
        </div>
        </div>
      </CollapsibleSection>

      <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
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
