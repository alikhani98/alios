import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sessionRef.current++;
    setIsSubmitting(false);
    setError(null);
    // Close is a predictable initial target without opening the mobile keyboard.
    closeButtonRef.current?.focus({ preventScroll: true });
    return () => {
      sessionRef.current++;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (error) submitButtonRef.current?.focus({ preventScroll: true });
  }, [error]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A modal owns its keyboard events; do not open a competing shell overlay.
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
      ) ?? []).filter((element) => element.tabIndex >= 0 && !element.hidden);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

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

    if (!canSubmit || isSubmitting) {
      return;
    }

    const session = sessionRef.current;
    // Save becomes disabled while pending, so keep focus on an enabled control.
    closeButtonRef.current?.focus({ preventScroll: true });
    setIsSubmitting(true);
    setError(null);

    try {
      await therapyNotes.addNote({
        date: getLocalDateKey(new Date()),
        category,
        content: content.trim(),
      });
      if (session !== sessionRef.current) {
        onSaved?.();
        return;
      }
      setCategory(initialCategory);
      setContent("");
      onSaved?.();
      onClose();
    } catch (caught) {
      if (session !== sessionRef.current) return;
      setError(
        caught instanceof Error ? caught.message : t("therapy.saveError")
      );
    } finally {
      if (session === sessionRef.current) setIsSubmitting(false);
    }
  };

  const dialog = (
    <div
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={handleDialogKeyDown}
      className="alios-modal-overlay backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="therapy-note-form-title"
      dir={direction}
    >
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />
      <Card className="alios-modal-panel relative w-full max-w-2xl border-border/70 bg-card shadow-aliosFloating">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle id="therapy-note-form-title">
            {t("therapy.formTitle")}
          </CardTitle>
          <Button
            type="button"
            ref={closeButtonRef}
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
              <Button ref={submitButtonRef} type="submit" disabled={!canSubmit || isSubmitting}>
                {t("therapy.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}
