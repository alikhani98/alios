import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { GOAL_STATUS_LABEL_KEYS } from "@/features/goals/constants";
import type { Goal, Project } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, DateValueHint, Input, Textarea, Select } from "@/shared/ui";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "../constants";
import { projectFormSchema, type ProjectFormValues } from "../types";

type ProjectFormProps = {
  project?: Project;
  goals: ReadonlyArray<Goal>;
  isGoalsLoading: boolean;
  areGoalsUnavailable: boolean;
  isSubmitting: boolean;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
};

export function ProjectForm({
  project,
  goals,
  isGoalsLoading,
  areGoalsUnavailable,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const { t } = useI18n();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status === "archived" ? "active" : project?.status ?? "active",
      priority: project?.priority ?? "medium",
      goalId: project?.goalId ?? "",
      nextAction: project?.nextAction ?? "",
      reviewDate: project?.reviewDate ?? "",
      reviewIntervalDays: project?.reviewIntervalDays ? String(project.reviewIntervalDays) : "",
    },
  });
  const reviewDateValue = watch("reviewDate");

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-2">
        <label htmlFor="project-title" className="text-sm font-medium">
          {t("common.title")}
        </label>
        <Input
          id="project-title"
          autoFocus
          placeholder={t("projects.titlePlaceholder")}
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="project-goal" className="text-sm font-medium">
          {t("projects.linkedGoal")}
        </label>
        <Select
          id="project-goal"
          {...register("goalId")}
        >
          <option value="">{t("projects.noLinkedGoal")}</option>
          {project?.goalId && !goals.some((goal) => goal.id === project.goalId) ? (
            <option value={project.goalId}>
              {t("projects.currentGoalUnavailable")}
            </option>
          ) : null}
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title} · {t(GOAL_STATUS_LABEL_KEYS[goal.status])}
            </option>
          ))}
        </Select>
        <p className="break-words text-sm leading-6 text-muted-foreground">
          {isGoalsLoading
            ? t("projects.linkedGoalLoading")
            : areGoalsUnavailable
              ? t("projects.linkedGoalUnavailableNote")
              : t("projects.linkedGoalOptionalNote")}
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="project-description" className="text-sm font-medium">
          {t("common.description")}
        </label>
        <Textarea
          id="project-description"
          placeholder={t("projects.descriptionPlaceholder")}
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="project-status" className="text-sm font-medium">
            {t("common.status")}
          </label>
          <Select
            id="project-status"
            {...register("status")}
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-priority" className="text-sm font-medium">
            {t("common.priority")}
          </label>
          <Select
            id="project-priority"
            {...register("priority")}
          >
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="project-next-action" className="text-sm font-medium">
            {t("projects.nextAction")}
          </label>
          <Input
            id="project-next-action"
            placeholder={t("projects.nextActionPlaceholder")}
            {...register("nextAction")}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-review-date" className="text-sm font-medium">
            {t("projects.reviewDate")}
          </label>
          <Input id="project-review-date" type="date" {...register("reviewDate")} />
          <DateValueHint value={reviewDateValue} />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="project-review-interval" className="text-sm font-medium">
          {t("goals.reviewIntervalDaysLabel")}
        </label>
        <Input
          id="project-review-interval"
          type="number"
          min="1"
          inputMode="numeric"
          placeholder={t("goals.reviewIntervalDaysPlaceholder")}
          {...register("reviewIntervalDays")}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? t("common.saving")
            : project
              ? t("common.saveChanges")
              : t("projects.createButton")}
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
