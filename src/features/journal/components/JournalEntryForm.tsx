import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

import type { JournalEntry } from "@/shared/types";
import { Button, Input, Textarea } from "@/shared/ui";
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
  const {
    register,
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

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="journal-date" className="text-sm font-medium">
            Date
          </label>
          <Input
            id="journal-date"
            type="date"
            aria-invalid={Boolean(errors.date)}
            {...register("date")}
          />
          {errors.date ? (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="journal-type" className="text-sm font-medium">
            Entry type
          </label>
          <select
            id="journal-type"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("type")}
          >
            {JOURNAL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="journal-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="journal-title"
          autoFocus
          placeholder="Give this entry a clear title"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="journal-content" className="text-sm font-medium">
          Journal entry
        </label>
        <Textarea
          id="journal-content"
          className="min-h-48"
          placeholder="Write what happened, what you noticed, or what you learned…"
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="journal-mood" className="text-sm font-medium">
            Mood
          </label>
          <select
            id="journal-mood"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("moodLevel")}
          >
            <option value="">Not recorded</option>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="journal-energy" className="text-sm font-medium">
            Energy
          </label>
          <select
            id="journal-energy"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("energyLevel")}
          >
            <option value="">Not recorded</option>
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : entry
              ? "Save changes"
              : "Create entry"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
