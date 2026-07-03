import { AlertCircle, BookOpenText, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import type { CreateJournalEntryInput } from "@/core/repositories";
import type { JournalEntry } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { JournalEntryCard } from "../components/JournalEntryCard";
import { JournalEntryForm } from "../components/JournalEntryForm";
import { useJournalEntries } from "../hooks/useJournalEntries";
import type { JournalEntryFormValues } from "../types";

export function JournalPage() {
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
        setSuccessMessage("Journal entry updated successfully.");
      } else {
        await createEntry(input);
        setSuccessMessage("Journal entry created successfully.");
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "The journal entry could not be saved."
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
      setSuccessMessage("Journal entry deleted successfully.");
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "The journal entry could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="alios-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="alios-page-header mb-0">
          <h2 className="alios-page-title">Journal</h2>
          <p className="alios-page-description">
            Capture what happened, what you felt, and what you learned.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="me-2 h-4 w-4" />
          New entry
        </Button>
      </div>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry ? "Edit journal entry" : "Create a journal entry"}
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
        </Card>
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
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-label="Loading journal entries">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpenText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No journal entries yet</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              Start with a small note about today. A few honest lines are enough.
            </p>
            <Button type="button" className="mt-5" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              Write first entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              isDeleting={deletingId === entry.id}
              onEdit={() => openEditForm(entry)}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
