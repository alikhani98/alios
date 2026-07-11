import { useMemo, type FormEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { Button, Input, Textarea } from "@/shared/ui";

import {
  GOAL_AREA_OPTIONS,
  GOAL_IMPORTANCE_OPTIONS,
  GOAL_STATUS_OPTIONS,
  GOAL_TIMEFRAME_OPTIONS,
} from "../constants";
import type { GoalFormSeed, GoalFormValues } from "../types";

type GoalFormProps = {
  goal?: GoalFormSeed;
  isSubmitting: boolean;
  onSubmit: (values: GoalFormValues) => void | Promise<void>;
  onCancel: () => void;
};

function readValue(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
}

export function GoalForm({
  goal,
  isSubmitting,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const { t } = useI18n();
  const initialTags = useMemo(() => goal?.tags.join(", ") ?? "", [goal]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    void onSubmit({
      title: readValue(form, "title"),
      description: readValue(form, "description"),
      area: readValue(form, "area") as GoalFormValues["area"],
      timeframe: readValue(form, "timeframe") as GoalFormValues["timeframe"],
      status: readValue(form, "status") as GoalFormValues["status"],
      importance: readValue(form, "importance") as GoalFormValues["importance"],
      progressPercent: readValue(form, "progressPercent"),
      targetDate: readValue(form, "targetDate"),
      reviewIntervalDays: readValue(form, "reviewIntervalDays"),
      tagsText: readValue(form, "tagsText"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.titleLabel")}</span>
          <Input
            name="title"
            defaultValue={goal?.title ?? ""}
            required
            placeholder={t("goals.titlePlaceholder")}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.statusLabel")}</span>
          <select
            name="status"
            defaultValue={goal?.status ?? "active"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {GOAL_STATUS_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium">{t("goals.descriptionLabel")}</span>
        <Textarea
          name="description"
          defaultValue={goal?.description ?? ""}
          required
          rows={4}
          placeholder={t("goals.descriptionPlaceholder")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.areaLabel")}</span>
          <select
            name="area"
            defaultValue={goal?.area ?? "personal"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {GOAL_AREA_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.timeframeLabel")}</span>
          <select
            name="timeframe"
            defaultValue={goal?.timeframe ?? "open"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {GOAL_TIMEFRAME_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.importanceLabel")}</span>
          <select
            name="importance"
            defaultValue={goal?.importance ?? "medium"}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {GOAL_IMPORTANCE_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.progressLabel")}</span>
          <Input
            name="progressPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={goal?.progressPercent ?? 0}
            placeholder="0"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.targetDateLabel")}</span>
          <Input
            name="targetDate"
            type="date"
            defaultValue={goal?.targetDate ?? ""}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">{t("goals.reviewIntervalDaysLabel")}</span>
          <Input
            name="reviewIntervalDays"
            type="number"
            min="1"
            defaultValue={goal?.reviewIntervalDays ?? ""}
            placeholder={t("goals.reviewIntervalDaysPlaceholder")}
          />
        </label>

        <label className="space-y-2 xl:col-span-1">
          <span className="text-sm font-medium">{t("goals.tagsLabel")}</span>
          <Input
            name="tagsText"
            defaultValue={initialTags}
            placeholder={t("goals.tagsPlaceholder")}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : goal ? t("goals.saveGoal") : t("goals.createGoal")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
