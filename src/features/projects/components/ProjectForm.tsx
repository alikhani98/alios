import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Project } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "../constants";
import { projectFormSchema, type ProjectFormValues } from "../types";

type ProjectFormProps = {
  project?: Project;
  isSubmitting: boolean;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
};

export function ProjectForm({
  project,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status === "archived" ? "active" : project?.status ?? "active",
      priority: project?.priority ?? "medium",
      nextAction: project?.nextAction ?? "",
      reviewDate: project?.reviewDate ?? "",
    },
  });

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
          <select
            id="project-status"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("status")}
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="project-priority" className="text-sm font-medium">
            {t("common.priority")}
          </label>
          <select
            id="project-priority"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("priority")}
          >
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
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
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : project
              ? t("common.saveChanges")
              : t("projects.createButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
