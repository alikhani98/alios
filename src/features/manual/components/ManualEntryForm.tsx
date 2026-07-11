import type { FormEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";
import type { ManualEntry } from "@/shared/types";

import {
  MANUAL_CATEGORY_OPTIONS,
  MANUAL_IMPORTANCE_OPTIONS,
  MANUAL_STATUS_OPTIONS,
} from "../constants";
import type { ManualEntryFormSeed, ManualEntryFormValues } from "../types";

type ManualEntryFormProps = {
  entry?: ManualEntryFormSeed;
  isSubmitting: boolean;
  onSubmit: (values: ManualEntryFormValues) => Promise<void>;
  onCancel?: () => void;
};

function splitTags(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function getReviewIntervalText(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

export function ManualEntryForm({
  entry,
  isSubmitting,
  onSubmit,
  onCancel,
}: ManualEntryFormProps) {
  const { t } = useI18n();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reviewIntervalRaw = String(formData.get("reviewIntervalDays") ?? "").trim();

    await onSubmit({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      category: String(formData.get("category") ?? "other") as ManualEntry["category"],
      importance: String(formData.get("importance") ?? "medium") as ManualEntry["importance"],
      status: String(formData.get("status") ?? "active") as ManualEntry["status"],
      tagsText: String(formData.get("tagsText") ?? ""),
      reviewIntervalDays: reviewIntervalRaw,
    });
  };

  return (
    <form
      id="manual-entry-form"
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">{t("common.title")}</span>
          <Input
            name="title"
            defaultValue={entry?.title ?? ""}
            placeholder={t("manual.titlePlaceholder")}
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">{t("common.type")}</span>
          <select
            name="category"
            defaultValue={entry?.category ?? "other"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {MANUAL_CATEGORY_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">{t("common.content")}</span>
        <Textarea
          name="body"
          defaultValue={entry?.body ?? ""}
          placeholder={t("manual.bodyPlaceholder")}
          className="min-h-40"
          required
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm font-medium">{t("common.status")}</span>
          <select
            name="status"
            defaultValue={entry?.status ?? "active"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {MANUAL_STATUS_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">{t("common.priority")}</span>
          <select
            name="importance"
            defaultValue={entry?.importance ?? "medium"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {MANUAL_IMPORTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium">
            {t("manual.reviewIntervalDays")}
          </span>
          <Input
            name="reviewIntervalDays"
            type="number"
            min={1}
            step={1}
            defaultValue={getReviewIntervalText(entry?.reviewIntervalDays)}
            placeholder={t("manual.reviewIntervalDaysPlaceholder")}
          />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm font-medium">{t("manual.tags")}</span>
        <Input
          name="tagsText"
          defaultValue={entry?.tags.join(", ") ?? ""}
          placeholder={t("manual.tagsPlaceholder")}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : entry ? t("common.saveChanges") : t("manual.createEntry")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
