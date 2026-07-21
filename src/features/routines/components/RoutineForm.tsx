import type { FormEvent } from "react";

import { TASK_PRIORITY_OPTIONS } from "@/features/today/constants";
import { useI18n } from "@/shared/i18n";
import type { Routine, TaskPriority } from "@/shared/types";
import { Button, Input, Select, Textarea } from "@/shared/ui";

export const ROUTINE_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export const ROUTINE_WEEKDAY_LABEL_KEYS = [
  "routines.weekday0", "routines.weekday1", "routines.weekday2",
  "routines.weekday3", "routines.weekday4", "routines.weekday5", "routines.weekday6",
] as const;

export type RoutineFormValues = Pick<Routine, "title" | "description" | "weekdays" | "priority" | "isActive">;
type Props = { routine?: Routine; isSubmitting: boolean; onSubmit: (values: RoutineFormValues) => void | Promise<void>; onCancel: () => void };

export function RoutineForm({ routine, isSubmitting, onSubmit, onCancel }: Props) {
  const { t } = useI18n();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weekdays = data.getAll("weekdays").map(Number);
    if (weekdays.length === 0) {
      const firstWeekday = event.currentTarget.querySelector<HTMLInputElement>('input[name="weekdays"]');
      firstWeekday?.setCustomValidity(t("routines.weekdaysRequired"));
      firstWeekday?.reportValidity();
      return;
    }
    void onSubmit({ title: String(data.get("title") ?? "").trim(), description: String(data.get("description") ?? "").trim() || undefined, weekdays, priority: String(data.get("priority") ?? "medium") as TaskPriority, isActive: data.get("isActive") === "on" });
  };
  return <form className="space-y-4" onSubmit={handleSubmit}>
    <label className="block space-y-2"><span className="text-sm font-medium">{t("routines.titleLabel")}</span><Input name="title" required defaultValue={routine?.title ?? ""} /></label>
    <label className="block space-y-2"><span className="text-sm font-medium">{t("routines.descriptionLabel")}</span><Textarea name="description" rows={3} defaultValue={routine?.description ?? ""} /></label>
    <p className="text-xs leading-5 text-muted-foreground">{t("routines.routineVsRecurringNote")}</p>
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{t("routines.weekdaysLabel")}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {ROUTINE_WEEKDAYS.map((day) => (
          <label key={day} className="flex min-h-11 items-center gap-2 rounded-xl border px-3">
            <input name="weekdays" type="checkbox" value={day} defaultChecked={routine ? routine.weekdays.includes(day) : day > 0 && day < 6} onChange={(event) => event.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="weekdays"]').forEach((input) => input.setCustomValidity(""))} />
            <span className="text-sm">{t(ROUTINE_WEEKDAY_LABEL_KEYS[day])}</span>
          </label>
        ))}
      </div>
    </fieldset>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium">{t("common.priority")}</span><Select name="priority" defaultValue={routine?.priority ?? "medium"}>{TASK_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}</Select></label><label className="flex min-h-11 items-center gap-2 self-end rounded-xl border px-3"><input name="isActive" type="checkbox" defaultChecked={routine?.isActive ?? true} /><span>{t("routines.activeLabel")}</span></label></div>
    <div className="flex flex-col gap-2 sm:flex-row"><Button disabled={isSubmitting} type="submit">{isSubmitting ? t("common.saving") : t("common.saveChanges")}</Button><Button disabled={isSubmitting} type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button></div>
  </form>;
}
