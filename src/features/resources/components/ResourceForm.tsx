import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Resource } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Select, Textarea } from "@/shared/ui";
import {
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from "../constants";
import { resourceFormSchema, type ResourceFormValues } from "../types";

type ResourceFormProps = {
  resource?: Resource;
  isSubmitting: boolean;
  onSubmit: (values: ResourceFormValues) => Promise<void>;
  onCancel: () => void;
};

export function ResourceForm({
  resource,
  isSubmitting,
  onSubmit,
  onCancel,
}: ResourceFormProps) {
  const { t } = useI18n();
  const {
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
      status: resource?.status ?? "unread",
      progressPercent:
        resource?.progressPercent === undefined
          ? ""
          : String(resource.progressPercent),
    },
  });

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
