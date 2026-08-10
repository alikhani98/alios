import { useMemo, useState, type FormEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { Button, CollapsibleSection, DateValueHint, Input, Select, SoftPanel, Textarea } from "@/shared/ui";

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
  const [targetDateValue, setTargetDateValue] = useState(goal?.targetDate ?? "");

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-5">
          <SoftPanel className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
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
                <Select
                  name="status"
                  defaultValue={goal?.status ?? "active"}
                >
                  {GOAL_STATUS_OPTIONS.filter((option) => option.value !== "all").map(
                    (option) => (
                      <option key={String(option.value)} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    )
                  )}
                </Select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.descriptionLabel")}</span>
              <Textarea
                name="description"
                defaultValue={goal?.description ?? ""}
                required
                rows={5}
                placeholder={t("goals.descriptionPlaceholder")}
                className="min-h-32"
              />
            </label>
          </SoftPanel>
        </div>

        <div className="space-y-5">
          <SoftPanel className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.areaLabel")}</span>
              <Select
                name="area"
                defaultValue={goal?.area ?? "personal"}
              >
                {GOAL_AREA_OPTIONS.filter((option) => option.value !== "all").map(
                  (option) => (
                    <option key={String(option.value)} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  )
                )}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.timeframeLabel")}</span>
              <Select
                name="timeframe"
                defaultValue={goal?.timeframe ?? "open"}
              >
                {GOAL_TIMEFRAME_OPTIONS.filter((option) => option.value !== "all").map(
                  (option) => (
                    <option key={String(option.value)} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  )
                )}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.importanceLabel")}</span>
              <Select
                name="importance"
                defaultValue={goal?.importance ?? "medium"}
              >
                {GOAL_IMPORTANCE_OPTIONS.filter((option) => option.value !== "all").map(
                  (option) => (
                    <option key={String(option.value)} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  )
                )}
              </Select>
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
          </SoftPanel>

          <CollapsibleSection
            id="goals-form-advanced"
            title={t("goals.advancedFields")}
            description={t("goals.advancedFieldsDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            defaultOpen={false}
            className="rounded-2xl border border-border/70 bg-muted/20 shadow-none"
            contentClassName="space-y-4"
          >
            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.targetDateLabel")}</span>
              <Input
                name="targetDate"
                type="date"
                defaultValue={goal?.targetDate ?? ""}
                onChange={(event) => setTargetDateValue(event.target.value)}
              />
              <DateValueHint value={targetDateValue} />
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

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("goals.tagsLabel")}</span>
              <Input
                name="tagsText"
                defaultValue={initialTags}
                placeholder={t("goals.tagsPlaceholder")}
              />
            </label>
          </CollapsibleSection>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/70 pt-4">
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
