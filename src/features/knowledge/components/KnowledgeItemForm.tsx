import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Goal, KnowledgeItem, Project, Resource, Task } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea, Select } from "@/shared/ui";
import { KNOWLEDGE_TYPE_OPTIONS } from "../constants";
import {
  knowledgeItemFormSchema,
  type KnowledgeItemFormValues,
} from "../types";

type KnowledgeItemFormProps = {
  item?: KnowledgeItem;
  projects?: ReadonlyArray<Project>;
  goals?: ReadonlyArray<Goal>;
  tasks?: ReadonlyArray<Task>;
  resources?: ReadonlyArray<Resource>;
  isSubmitting: boolean;
  onSubmit: (values: KnowledgeItemFormValues) => Promise<void>;
  onCancel: () => void;
};

export function KnowledgeItemForm({
  item,
  projects = [],
  goals = [],
  tasks = [],
  resources = [],
  isSubmitting,
  onSubmit,
  onCancel,
}: KnowledgeItemFormProps) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KnowledgeItemFormValues>({
    resolver: zodResolver(knowledgeItemFormSchema),
    defaultValues: {
      title: item?.title ?? "",
      type: item?.type ?? "note",
      summary: item?.summary ?? "",
      content: item?.content ?? "",
      source: item?.source ?? "",
      projectId: item?.projectId ?? "",
      goalId: item?.goalId ?? "",
      taskId: item?.taskId ?? "",
      resourceId: item?.resourceId ?? "",
    },
  });
  const selectedProjectIsUnavailable =
    Boolean(item?.projectId) &&
    !projects.some((project) => project.id === item?.projectId);
  const selectedGoalIsUnavailable =
    Boolean(item?.goalId) && !goals.some((goal) => goal.id === item?.goalId);
  const selectedTaskIsUnavailable =
    Boolean(item?.taskId) && !tasks.some((task) => task.id === item?.taskId);
  const selectedResourceIsUnavailable =
    Boolean(item?.resourceId) &&
    !resources.some((resource) => resource.id === item?.resourceId);

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <label htmlFor="knowledge-title" className="text-sm font-medium">
            {t("common.title")}
          </label>
          <Input
            id="knowledge-title"
            autoFocus
            placeholder={t("knowledge.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="knowledge-type" className="text-sm font-medium">
            {t("common.type")}
          </label>
          <Select
            id="knowledge-type"
            {...register("type")}
          >
            {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-summary" className="text-sm font-medium">
          {t("knowledge.summary")}
        </label>
        <Input
          id="knowledge-summary"
          placeholder={t("knowledge.summaryPlaceholder")}
          {...register("summary")}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-content" className="text-sm font-medium">
          {t("common.content")}
        </label>
        <Textarea
          id="knowledge-content"
          className="min-h-48"
          placeholder={t("knowledge.contentPlaceholder")}
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-source" className="text-sm font-medium">
          {t("knowledge.source")}
        </label>
        <Input
          id="knowledge-source"
          placeholder={t("knowledge.sourcePlaceholder")}
          {...register("source")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2">
          <label htmlFor="knowledge-project" className="text-sm font-medium">
            {t("links.projectLabel")}
          </label>
          <Select id="knowledge-project" {...register("projectId")}>
            <option value="">{t("links.noProject")}</option>
            {selectedProjectIsUnavailable ? (
              <option value={item?.projectId}>
                {t("links.projectUnavailable")}
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
          <label htmlFor="knowledge-goal" className="text-sm font-medium">
            {t("links.goalLabel")}
          </label>
          <Select id="knowledge-goal" {...register("goalId")}>
            <option value="">{t("links.noGoal")}</option>
            {selectedGoalIsUnavailable ? (
              <option value={item?.goalId}>
                {t("links.goalUnavailable")}
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
          <label htmlFor="knowledge-task" className="text-sm font-medium">
            {t("links.taskLabel")}
          </label>
          <Select id="knowledge-task" {...register("taskId")}>
            <option value="">{t("links.noTask")}</option>
            {selectedTaskIsUnavailable ? (
              <option value={item?.taskId}>
                {t("links.taskUnavailable")}
              </option>
            ) : null}
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="knowledge-resource" className="text-sm font-medium">
            {t("links.resourceLabel")}
          </label>
          <Select id="knowledge-resource" {...register("resourceId")}>
            <option value="">{t("links.noResource")}</option>
            {selectedResourceIsUnavailable ? (
              <option value={item?.resourceId}>
                {t("links.resourceUnavailable")}
              </option>
            ) : null}
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : item
              ? t("common.saveChanges")
              : t("knowledge.createButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
