import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useStorageAdapter } from "@/core/storage";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { TherapyNoteCategory } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

export const THERAPY_NOTE_CATEGORY_OPTIONS = [
  { value: "event", labelKey: "therapy.catEvent" },
  { value: "feeling", labelKey: "therapy.catFeeling" },
  { value: "pattern", labelKey: "therapy.catPattern" },
  { value: "question", labelKey: "therapy.catQuestion" },
  { value: "insight", labelKey: "therapy.catInsight" },
] as const satisfies ReadonlyArray<{
  value: TherapyNoteCategory;
  labelKey: TranslationKey;
}>;

type TherapyNoteFormProps = {
  open: boolean;
  initialCategory?: TherapyNoteCategory;
  onClose: () => void;
  onSaved?: () => void;
};

type ChipButtonProps = {
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

function ChipButton({ isSelected, label, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function TherapyNoteForm({
  open,
  initialCategory = "event",
  onClose,
  onSaved,
}: TherapyNoteFormProps) {
  const { t, direction } = useI18n();
  const { therapyNotes } = useStorageAdapter();
  const [category, setCategory] = useState<TherapyNoteCategory>(initialCategory);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
    }
  }, [initialCategory, open]);

  if (!open) {
    return null;
  }

  const canSubmit = content.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await therapyNotes.addNote({
        date: getLocalDateKey(new Date()),
        category,
        content: content.trim(),
      });
      setCategory(initialCategory);
      setContent("");
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("therapy.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="therapy-note-form-title"
      dir={direction}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />
      <Card className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto border-border/70 bg-card shadow-aliosFloating">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle id="therapy-note-form-title">
            {t("therapy.formTitle")}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.cancel")}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            {error ? (
              <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("therapy.fieldCategory")}</p>
              <div className="flex flex-wrap gap-2">
                {THERAPY_NOTE_CATEGORY_OPTIONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    isSelected={category === option.value}
                    label={t(option.labelKey)}
                    onClick={() => setCategory(option.value)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="therapy-note-content" className="text-sm font-semibold">
                {t("therapy.fieldContent")}
              </label>
              <Textarea
                id="therapy-note-content"
                required
                rows={5}
                value={content}
                placeholder={t("therapy.contentPlaceholder")}
                onChange={(event) => setContent(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {t("therapy.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
