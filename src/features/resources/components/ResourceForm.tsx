import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import type { Goal, Project, Resource, Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Select, Textarea } from "@/shared/ui";
import {
  RESOURCE_FORMAT_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from "../constants";
import { resourceFormSchema, type ResourceFormValues } from "../types";

type ResourceFormProps = {
  resource?: Resource;
  isSubmitting: boolean;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  onCancel: () => void;
  goals: ReadonlyArray<Goal>;
  projects: ReadonlyArray<Project>;
  tasks: ReadonlyArray<Task>;
};

export function ResourceForm({
  resource,
  isSubmitting,
  onSubmit,
  onCancel,
  goals,
  projects,
  tasks,
}: ResourceFormProps) {
  const { t } = useI18n();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: resource?.title ?? "",
      type: resource?.type ?? "book",
      description: resource?.description ?? "",
      source: resource?.source ?? "",
      url: resource?.url ?? "",
      author: resource?.author ?? "",
      format: resource?.format ?? undefined,
      location: resource?.location ?? "",
      startedAt: resource?.startedAt ?? "",
      completedAt: resource?.completedAt ?? "",
      goalId: resource?.goalId ?? "",
      projectId: resource?.projectId ?? "",
      taskId: resource?.taskId ?? "",
      status: resource?.status ?? "unread",
      progressPercent:
        resource?.progressPercent === undefined
          ? ""
          : String(resource.progressPercent),
    },
  });
  const selectedType = useWatch({ control, name: "type" });
  const showAuthor =
    selectedType === "book" ||
    selectedType === "course" ||
    Boolean(resource?.author);
  const showFormat = selectedType !== "website" || Boolean(resource?.format);
  const showLocation =
    selectedType === "book" ||
    selectedType === "document" ||
    Boolean(resource?.location);

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <label htmlFor="resource-title" className="text-sm font-medium">
            {t("common.title")}
          </label>
          <Input
            id="resource-title"
            autoFocus
            placeholder={t("resources.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-type" className="text-sm font-medium">
            {t("common.type")}
          </label>
          <Select id="resource-type" {...register("type")}>
            {RESOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="resource-description" className="text-sm font-medium">
          {t("common.description")}
        </label>
        <Textarea
          id="resource-description"
          placeholder={t("resources.descriptionPlaceholder")}
          {...register("description")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="resource-source" className="text-sm font-medium">
            {t("resources.source")}
          </label>
          <Input
            id="resource-source"
            placeholder={t("resources.sourcePlaceholder")}
            {...register("source")}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-url" className="text-sm font-medium">
            {t("resources.url")}
          </label>
          <Input
            id="resource-url"
            type="url"
            placeholder={t("resources.urlPlaceholder")}
            {...register("url")}
          />
        </div>
      </div>

      {showAuthor || showFormat || showLocation ? (
        <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 md:grid-cols-2">
          {showAuthor ? (
            <div className="grid gap-2">
              <label htmlFor="resource-author" className="text-sm font-medium">
                {t("resources.author")}
              </label>
              <Input
                id="resource-author"
                placeholder={t("resources.authorPlaceholder")}
                {...register("author")}
              />
            </div>
          ) : null}
          {showFormat ? (
            <div className="grid gap-2">
              <label htmlFor="resource-format" className="text-sm font-medium">
                {t("resources.format")}
              </label>
              <Select id="resource-format" {...register("format")}>
                <option value="">{t("resources.noFormat")}</option>
                {RESOURCE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {showLocation ? (
            <div className="grid gap-2">
              <label htmlFor="resource-location" className="text-sm font-medium">
                {t("resources.location")}
              </label>
              <Input
                id="resource-location"
                placeholder={t("resources.locationPlaceholder")}
                {...register("location")}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="resource-status" className="text-sm font-medium">
            {t("common.status")}
          </label>
          <Select id="resource-status" {...register("status")}>
            {RESOURCE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-progress" className="text-sm font-medium">
            {t("resources.progress")}
          </label>
          <Input
            id="resource-progress"
            type="number"
            min="0"
            max="100"
            inputMode="numeric"
            placeholder={t("resources.progressPlaceholder")}
            {...register("progressPercent")}
          />
          {errors.progressPercent ? (
            <p className="text-sm text-destructive">
              {t("resources.progressValidation")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="resource-started-at" className="text-sm font-medium">
            {t("resources.startedAt")}
          </label>
          <Input
            id="resource-started-at"
            type="date"
            {...register("startedAt")}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-completed-at" className="text-sm font-medium">
            {t("resources.completedAt")}
          </label>
          <Input
            id="resource-completed-at"
            type="date"
            {...register("completedAt")}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5 md:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="resource-goal" className="text-sm font-medium">
            {t("resources.relatedGoal")}
          </label>
          <Select id="resource-goal" {...register("goalId")}>
            <option value="">{t("resources.noRelatedGoal")}</option>
            {resource?.goalId && !goals.some((goal) => goal.id === resource.goalId) ? (
              <option value={resource.goalId}>
                {resource.goalId} ({t("links.goalUnavailable")})
              </option>
            ) : null}
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-project" className="text-sm font-medium">
            {t("resources.relatedProject")}
          </label>
          <Select id="resource-project" {...register("projectId")}>
            <option value="">{t("resources.noRelatedProject")}</option>
            {resource?.projectId &&
            !projects.some((project) => project.id === resource.projectId) ? (
              <option value={resource.projectId}>
                {resource.projectId} ({t("links.projectUnavailable")})
              </option>
            ) : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="resource-task" className="text-sm font-medium">
            {t("resources.relatedTask")}
          </label>
          <Select id="resource-task" {...register("taskId")}>
            <option value="">{t("resources.noRelatedTask")}</option>
            {resource?.taskId && !tasks.some((task) => task.id === resource.taskId) ? (
              <option value={resource.taskId}>
                {resource.taskId} ({t("links.taskUnavailable")})
              </option>
            ) : null}
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : t("common.saveChanges")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
