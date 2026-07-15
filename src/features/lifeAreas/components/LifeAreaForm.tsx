import { useEffect, useState } from "react";

import { useI18n } from "@/shared/i18n";
import {
  Button,
  Input,
  Textarea,
} from "@/shared/ui";
import type { LifeAreaAttentionLevel, LifeAreaStatus } from "@/shared/types";

import {
  LIFE_AREA_ATTENTION_OPTIONS,
  LIFE_AREA_STATUS_OPTIONS,
} from "../constants";
import type { LifeAreaView } from "../lifeAreas";
import type { LifeAreaFormValues } from "../types";

type LifeAreaFormProps = {
  area: LifeAreaView;
  isSubmitting: boolean;
  onSubmit: (values: LifeAreaFormValues) => Promise<void> | void;
  onCancel: () => void;
};

function buildInitialValues(area: LifeAreaView): LifeAreaFormValues {
  return {
    title: area.title,
    description: area.description,
    status: area.status,
    attentionLevel: area.attentionLevel,
    satisfactionScore: area.satisfactionScore ? String(area.satisfactionScore) : "",
    focusNote: area.focusNote,
    reviewIntervalDays: area.reviewIntervalDays ? String(area.reviewIntervalDays) : "",
    tagsText: area.tags.join(", "),
  };
}

export function LifeAreaForm({
  area,
  isSubmitting,
  onSubmit,
  onCancel,
}: LifeAreaFormProps) {
  const { t } = useI18n();
  const [values, setValues] = useState(() => buildInitialValues(area));

  useEffect(() => {
    setValues(buildInitialValues(area));
  }, [area]);

  const updateValue = <K extends keyof LifeAreaFormValues>(
    key: K,
    value: LifeAreaFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="min-w-0 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <label className="text-sm font-medium" htmlFor={`life-area-title-${area.areaKey}`}>
            {t("lifeAreas.titleLabel")}
          </label>
          <Input
            id={`life-area-title-${area.areaKey}`}
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder={t("lifeAreas.titlePlaceholder")}
            className="min-w-0"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <label className="text-sm font-medium" htmlFor={`life-area-status-${area.areaKey}`}>
            {t("lifeAreas.statusLabel")}
          </label>
            <select
            id={`life-area-status-${area.areaKey}`}
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as LifeAreaStatus)
            }
            className="flex h-11 min-w-0 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {LIFE_AREA_STATUS_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-sm font-medium" htmlFor={`life-area-description-${area.areaKey}`}>
          {t("lifeAreas.descriptionLabel")}
        </label>
        <Textarea
          id={`life-area-description-${area.areaKey}`}
          value={values.description}
          onChange={(event) => updateValue("description", event.target.value)}
          placeholder={t("lifeAreas.descriptionPlaceholder")}
          rows={4}
          className="min-w-0"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <label className="text-sm font-medium" htmlFor={`life-area-attention-${area.areaKey}`}>
            {t("lifeAreas.attentionLabel")}
          </label>
          <select
            id={`life-area-attention-${area.areaKey}`}
            value={values.attentionLevel}
            onChange={(event) =>
              updateValue(
                "attentionLevel",
                event.target.value as LifeAreaAttentionLevel
              )
            }
            className="flex h-11 min-w-0 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            {LIFE_AREA_ATTENTION_OPTIONS.filter((option) => option.value !== "all").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              )
            )}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor={`life-area-satisfaction-${area.areaKey}`}
          >
            {t("lifeAreas.satisfactionLabel")}
          </label>
          <select
            id={`life-area-satisfaction-${area.areaKey}`}
            value={values.satisfactionScore}
            onChange={(event) => updateValue("satisfactionScore", event.target.value)}
            className="flex h-11 min-w-0 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
          >
            <option value="">{t("common.notRecorded")}</option>
            {["1", "2", "3", "4", "5"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor={`life-area-review-${area.areaKey}`}
          >
            {t("lifeAreas.reviewIntervalDaysLabel")}
          </label>
          <Input
            id={`life-area-review-${area.areaKey}`}
            type="number"
            min="1"
            step="1"
            value={values.reviewIntervalDays}
            onChange={(event) =>
              updateValue("reviewIntervalDays", event.target.value)
            }
            placeholder={t("lifeAreas.reviewIntervalDaysPlaceholder")}
            className="min-w-0"
          />
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-sm font-medium" htmlFor={`life-area-focus-${area.areaKey}`}>
          {t("lifeAreas.focusNoteLabel")}
        </label>
        <Textarea
          id={`life-area-focus-${area.areaKey}`}
          value={values.focusNote}
          onChange={(event) => updateValue("focusNote", event.target.value)}
          placeholder={t("lifeAreas.focusNotePlaceholder")}
          rows={4}
          className="min-w-0"
        />
      </div>

      <div className="min-w-0 space-y-2">
        <label className="text-sm font-medium" htmlFor={`life-area-tags-${area.areaKey}`}>
          {t("lifeAreas.tagsLabel")}
        </label>
        <Input
          id={`life-area-tags-${area.areaKey}`}
          value={values.tagsText}
          onChange={(event) => updateValue("tagsText", event.target.value)}
          placeholder={t("lifeAreas.tagsPlaceholder")}
          className="min-w-0"
        />
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : t("lifeAreas.saveArea")}
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
