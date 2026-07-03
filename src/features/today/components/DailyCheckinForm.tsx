import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { DailyCheckin } from "@/shared/types";
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
          ["sleepQuality", "Sleep quality"],
          ["energyLevel", "Energy"],
          ["moodLevel", "Mood"],
        ].map(([name, label]) => (
          <div key={name} className="grid gap-2">
            <label htmlFor={`checkin-${name}`} className="text-sm font-medium">
              {label}
            </label>
            <select
              id={`checkin-${name}`}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register(name as "sleepQuality" | "energyLevel" | "moodLevel")}
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="grid gap-2">
          <label htmlFor="checkin-stress" className="text-sm font-medium">
            Stress
          </label>
          <select
            id="checkin-stress"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("stressLevel")}
          >
            {STRESS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="checkin-smoking" className="text-sm font-medium">
            Smoking status
          </label>
          <select
            id="checkin-smoking"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("smokingStatus")}
          >
            {SMOKING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex min-h-10 items-center gap-3 rounded-xl border px-4 py-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary"
            {...register("medicationDone")}
          />
          Medication recorded as done
        </label>
      </div>

      <div className="grid gap-2">
        <label htmlFor="checkin-notes" className="text-sm font-medium">
          Notes
        </label>
        <Textarea
          id="checkin-notes"
          placeholder="Optional context about today"
          {...register("notes")}
        />
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : checkin
              ? "Update daily check-in"
              : "Save daily check-in"}
        </Button>
      </div>
    </form>
  );
}
