import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { DailyCheckin } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Textarea } from "@/shared/ui";
import {
  LEVEL_OPTIONS,
  SMOKING_OPTIONS,
  STRESS_OPTIONS,
} from "../constants";
import {
  dailyCheckinFormSchema,
  type DailyCheckinFormValues,
} from "../types";

type DailyCheckinFormProps = {
  checkin?: DailyCheckin;
  isSubmitting: boolean;
  onSubmit: (values: DailyCheckinFormValues) => Promise<void>;
};

export function DailyCheckinForm({
  checkin,
  isSubmitting,
  onSubmit,
}: DailyCheckinFormProps) {
  const { t } = useI18n();
  const { register, handleSubmit } = useForm<DailyCheckinFormValues>({
    resolver: zodResolver(dailyCheckinFormSchema),
    defaultValues: {
      sleepQuality: checkin?.sleepQuality ?? "medium",
      energyLevel: checkin?.energyLevel ?? "medium",
      moodLevel: checkin?.moodLevel ?? "medium",
      stressLevel: checkin?.stressLevel ?? "medium",
      medicationDone: checkin?.medicationDone ?? false,
      smokingStatus: checkin?.smokingStatus ?? "none",
      notes: checkin?.notes ?? "",
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["sleepQuality", t("today.sleepQuality")],
          ["energyLevel", t("today.energy")],
          ["moodLevel", t("today.mood")],
        ].map(([name, label]) => (
          <div key={name} className="grid gap-2">
            <label htmlFor={`checkin-${name}`} className="text-sm font-medium">
              {label}
            </label>
            <select
              id={`checkin-${name}`}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
              {...register(name as "sleepQuality" | "energyLevel" | "moodLevel")}
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="grid gap-2">
          <label htmlFor="checkin-stress" className="text-sm font-medium">
            {t("today.stress")}
          </label>
          <select
            id="checkin-stress"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("stressLevel")}
          >
            {STRESS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="checkin-smoking" className="text-sm font-medium">
            {t("today.smokingStatus")}
          </label>
          <select
            id="checkin-smoking"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            {...register("smokingStatus")}
          >
            {SMOKING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <label className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-input accent-primary"
            {...register("medicationDone")}
          />
          {t("today.medicationDone")}
        </label>
      </div>

      <div className="grid gap-2">
        <label htmlFor="checkin-notes" className="text-sm font-medium">
          {t("common.notes")}
        </label>
        <Textarea
          id="checkin-notes"
          placeholder={t("today.notesPlaceholder")}
          {...register("notes")}
        />
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : checkin
              ? t("today.updateCheckin")
              : t("today.saveCheckin")}
        </Button>
      </div>
    </form>
  );
}
