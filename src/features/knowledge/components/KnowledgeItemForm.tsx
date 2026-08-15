import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Goal, KnowledgeItem, Project } from "@/shared/types";
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
  isSubmitting: boolean;
  onSubmit: (values: KnowledgeItemFormValues) => Promise<void>;
  onCancel: () => void;
};

export function KnowledgeItemForm({
  item,
  projects = [],
  goals = [],
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
    },
  });
  const selectedProjectIsUnavailable =
    Boolean(item?.projectId) &&
    !projects.some((project) => project.id === item?.projectId);
  const selectedGoalIsUnavailable =
    Boolean(item?.goalId) && !goals.some((goal) => goal.id === item?.goalId);

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

      <div className="grid gap-4 md:grid-cols-2">
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
