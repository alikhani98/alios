import { AlertCircle, BookOpenText, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateJournalEntryInput } from "@/core/repositories";
import type { JournalEntry } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { JournalEntryCard } from "../components/JournalEntryCard";
import { JournalEntryForm } from "../components/JournalEntryForm";
import { useJournalEntries } from "../hooks/useJournalEntries";
import type { JournalEntryFormValues } from "../types";

export function JournalPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const {
    entries,
    isLoading,
    error,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useJournalEntries();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");

  const openCreateForm = () => {
    setEditingEntry(undefined);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
  };

  const openEditForm = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleSubmit = async (values: JournalEntryFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const input: CreateJournalEntryInput = {
      date: values.date,
      type: values.type,
      title: values.title,
      content: values.content,
      moodLevel: values.moodLevel || undefined,
      energyLevel: values.energyLevel || undefined,
    };

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, input);
        setSuccessMessage(t("journal.updated"));
      } else {
        await createEntry(input);
        setSuccessMessage(t("journal.created"));
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : t("journal.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    setDeletingId(entry.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteEntry(entry.id);
      setSuccessMessage(t("journal.deleted"));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : t("journal.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!focusId) {
      setFocusedEntryId(null);
      setFocusMessage(null);
      return;
    }

    const focusedEntry = entries.find((entry) => entry.id === focusId);
    if (!focusedEntry) {
      if (!isLoading && entries.length > 0) {
        setFocusedEntryId(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedEntryId(focusId);
    const node = entryRefs.current[focusId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedEntryId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [entries, focusId, isLoading, t]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeader
            title={t("journal.title")}
            description={t("journal.description")}
          />
          <Button type="button" onClick={openCreateForm}>
            <Plus className="me-2 h-4 w-4" />
            {t("journal.new")}
          </Button>
        </CardContent>
      </PremiumCard>

      {formOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>
              {editingEntry ? t("journal.edit") : t("journal.create")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JournalEntryForm
              key={editingEntry?.id ?? "new-entry"}
              entry={editingEntry}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError ?? error}</span>
          </div>
          {error ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void loadEntries()}
            >
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {focusMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-label={t("journal.loading")}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<BookOpenText className="h-6 w-6" />}
          title={t("journal.emptyTitle")}
          description={t("journal.emptyDescription")}
          note={t("journal.emptyNote")}
          actions={
            <Button type="button" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              {t("journal.emptyAction")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              ref={(node) => {
                entryRefs.current[entry.id] = node;
              }}
              className={cn(
                "scroll-mt-24 rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                focusedEntryId === entry.id
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                  : null
              )}
            >
              <JournalEntryCard
                entry={entry}
                isDeleting={deletingId === entry.id}
                onEdit={() => openEditForm(entry)}
                onDelete={() => handleDelete(entry)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
