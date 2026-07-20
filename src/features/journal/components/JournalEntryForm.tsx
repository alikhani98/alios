import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

import type { JournalEntry } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, DateValueHint, Input, Textarea, Select } from "@/shared/ui";
import { JOURNAL_TYPE_OPTIONS, LEVEL_OPTIONS } from "../constants";
import {
  journalEntryFormSchema,
  type JournalEntryFormValues,
} from "../types";

type JournalEntryFormProps = {
  entry?: JournalEntry;
  isSubmitting: boolean;
  onSubmit: (values: JournalEntryFormValues) => Promise<void>;
  onCancel: () => void;
};

export function JournalEntryForm({
  entry,
  isSubmitting,
  onSubmit,
  onCancel,
}: JournalEntryFormProps) {
  const { t } = useI18n();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: {
      date: entry?.date ?? format(new Date(), "yyyy-MM-dd"),
      type: entry?.type ?? "daily",
      title: entry?.title ?? "",
      content: entry?.content ?? "",
      moodLevel: entry?.moodLevel ?? "",
      energyLevel: entry?.energyLevel ?? "",
    },
  });
  const dateValue = watch("date");

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="journal-date" className="text-sm font-medium">
            {t("common.date")}
          </label>
          <Input
            id="journal-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            {...register("date")}
          />
          <DateValueHint value={dateValue} />
          {errors.date ? (
            <p className="text-sm text-destructive">{t("common.validation")}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="journal-type" className="text-sm font-medium">
            {t("journal.entryType")}
          </label>
          <Select
            id="journal-type"
            {...register("type")}
          >
            {JOURNAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="journal-title" className="text-sm font-medium">
          {t("common.title")}
        </label>
        <Input
          id="journal-title"
          autoFocus
          placeholder={t("journal.titlePlaceholder")}
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="journal-content" className="text-sm font-medium">
          {t("journal.entry")}
        </label>
        <Textarea
          id="journal-content"
          className="min-h-48"
          placeholder={t("journal.contentPlaceholder")}
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-destructive">{t("common.validation")}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="journal-mood" className="text-sm font-medium">
            {t("journal.mood")}
          </label>
          <Select
            id="journal-mood"
            {...register("moodLevel")}
          >
            <option value="">{t("common.notRecorded")}</option>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="journal-energy" className="text-sm font-medium">
            {t("journal.energy")}
          </label>
          <Select
            id="journal-energy"
            {...register("energyLevel")}
          >
            <option value="">{t("common.notRecorded")}</option>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : entry
              ? t("common.saveChanges")
              : t("journal.createButton")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
