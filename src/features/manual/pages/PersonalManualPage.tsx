import { AlertCircle, BookText, Clock3, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateManualEntryInput } from "@/core/repositories";
import { useDateFormatter } from "@/shared/date";
import type { ManualEntry } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  MetricCard,
  PremiumCard,
  SectionHeader,
  StatusChip,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import { MANUAL_CATEGORY_OPTIONS, MANUAL_STATUS_OPTIONS } from "../constants";
import { filterManualEntries, getManualEntrySummary } from "../manualEntries";
import { ManualEntryCard } from "../components/ManualEntryCard";
import { ManualEntryForm } from "../components/ManualEntryForm";
import { useManualEntries } from "../hooks/useManualEntries";
import type { ManualEntryFormValues } from "../types";

function splitTags(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parseReviewIntervalDays(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function PersonalManualPage() {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();
  const [searchParams] = useSearchParams();
  const { entries, isLoading, error, loadEntries, createEntry, updateEntry, deleteEntry } =
    useManualEntries();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ManualEntry | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ManualEntry["category"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ManualEntry["status"] | "all">("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const focusId = searchParams.get("focusId");

  const summary = useMemo(() => getManualEntrySummary(entries), [entries]);
  const filteredEntries = useMemo(
    () =>
      filterManualEntries(
        entries,
        {
          category: categoryFilter,
          status: statusFilter,
          query: appliedQuery,
        }
      ),
    [appliedQuery, categoryFilter, entries, statusFilter]
  );

  const hasActiveFilters =
    categoryFilter !== "all" || statusFilter !== "all" || appliedQuery.length > 0;

  useEffect(() => {
    if (!focusId) {
      setFocusedEntryId(null);
      setFocusMessage(null);
      return;
    }

    if (!filteredEntries.some((entry) => entry.id === focusId)) {
      if (!isLoading && entries.some((entry) => entry.id === focusId)) {
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
  }, [entries, filteredEntries, focusId, isLoading, t]);

  useEffect(() => {
    if (formOpen) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formOpen]);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const openCreateForm = () => {
    setEditingEntry(undefined);
    setFormOpen(true);
    clearMessages();
  };

  const openEditForm = (entry: ManualEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
    clearMessages();
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEntry(undefined);
  };

  const handleSearch = () => {
    setAppliedQuery(query.trim());
  };

  const clearFilters = async () => {
    setQuery("");
    setAppliedQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleSubmit = async (values: ManualEntryFormValues) => {
    clearMessages();
    setIsSubmitting(true);

    const input: CreateManualEntryInput = {
      title: values.title,
      body: values.body,
      category: values.category,
      importance: values.importance,
      status: values.status,
      tags: splitTags(values.tagsText),
      reviewIntervalDays: parseReviewIntervalDays(values.reviewIntervalDays),
    };

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, input);
        setSuccessMessage(t("manual.updated"));
      } else {
        await createEntry(input);
        setSuccessMessage(t("manual.created"));
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error ? submitError.message : t("manual.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry: ManualEntry) => {
    setDeletingId(entry.id);
    clearMessages();

    try {
      await deleteEntry(entry.id);
      setSuccessMessage(t("manual.deleted"));
      if (editingEntry?.id === entry.id) {
        closeForm();
      }
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : t("manual.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkReviewed = async (entry: ManualEntry) => {
    clearMessages();

    try {
      await updateEntry(entry.id, { lastReviewedAt: new Date().toISOString() });
      setSuccessMessage(t("manual.markReviewedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("manual.markReviewedError")
      );
    }
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-6">
          <SectionHeader
            eyebrow={t("manual.title")}
            icon={<BookText className="h-5 w-5" />}
            title={t("manual.title")}
            description={t("manual.description")}
            status={<StatusChip tone="neutral">{t("manual.localOnlyNote")}</StatusChip>}
          />
          <div className="mt-4 max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
            <p>{t("manual.nonAdvisoryNote")}</p>
            <p>{t("manual.localOnlyDescription")}</p>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<BookText className="h-5 w-5" />}
          label={t("manual.totalEntries")}
          value={summary.totalCount}
        />
        <MetricCard
          icon={<Sparkles className="h-5 w-5" />}
          label={t("manual.activeEntries")}
          value={summary.activeCount}
        />
        <MetricCard
          icon={<AlertCircle className="h-5 w-5" />}
          label={t("manual.reviewDue")}
          value={summary.reviewDueCount}
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("manual.latestUpdated")}
          value={summary.latestUpdatedEntry ? summary.latestUpdatedEntry.title : t("common.notRecorded")}
          description={
            summary.latestUpdatedEntry
              ? formatDateTime(summary.latestUpdatedEntry.updatedAt)
              : t("manual.noLatestEntry")
          }
        />
      </div>

      {successMessage ? (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
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
            <Button type="button" size="sm" variant="outline" onClick={() => void loadEntries()}>
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

      <PremiumCard>
        <div className="space-y-4 p-5 sm:p-6">
          <SectionHeader
            title={formOpen ? (editingEntry ? t("manual.editEntry") : t("manual.createEntry")) : t("manual.newEntry")}
            description={t("manual.formDescription")}
            status={<Badge variant="secondary">{t("manual.userWrittenOnly")}</Badge>}
          />
          {!formOpen ? (
            <Button type="button" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              {t("manual.newEntry")}
            </Button>
          ) : null}
          {formOpen ? (
            <div ref={formRef}>
              <ManualEntryForm
                key={editingEntry?.id ?? "manual-entry-form"}
                entry={editingEntry}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </div>
          ) : null}
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="space-y-4 p-5 sm:p-6">
          <SectionHeader
            title={t("manual.filters")}
            description={t("manual.filtersDescription")}
            status={<Badge variant="secondary">{filteredEntries.length}</Badge>}
          />

          <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("manual.searchPlaceholder")}
                className="pl-9"
                aria-label={t("manual.searchLabel")}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as ManualEntry["category"] | "all")
              }
              aria-label={t("manual.categoryFilter")}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            >
              {MANUAL_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ManualEntry["status"] | "all")
              }
              aria-label={t("manual.statusFilter")}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            >
              {MANUAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSearch}>
                {t("manual.search")}
              </Button>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={() => void clearFilters()}>
                  <X className="me-2 h-4 w-4" />
                  {t("manual.clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </PremiumCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("manual.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-[1.75rem] border bg-muted/60" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={<BookText className="h-6 w-6" />}
          title={hasActiveFilters ? t("manual.noResultsTitle") : t("manual.emptyTitle")}
          description={hasActiveFilters ? t("manual.noResultsDescription") : t("manual.emptyDescription")}
          note={hasActiveFilters ? undefined : t("manual.emptyNote")}
          actions={
            hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={() => void clearFilters()}>
                {t("manual.clearFilters")}
              </Button>
            ) : (
              <Button type="button" onClick={openCreateForm}>
                <Plus className="me-2 h-4 w-4" />
                {t("manual.emptyAction")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              ref={(node) => {
                entryRefs.current[entry.id] = node;
              }}
              className={cn(
                "scroll-mt-6 rounded-[1.75rem] transition-shadow",
                focusedEntryId === entry.id ? "ring-2 ring-primary/20" : null
              )}
            >
              <ManualEntryCard
                entry={entry}
                isDeleting={deletingId === entry.id}
                onEdit={() => openEditForm(entry)}
                onDelete={() => handleDelete(entry)}
                onMarkReviewed={() => handleMarkReviewed(entry)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
