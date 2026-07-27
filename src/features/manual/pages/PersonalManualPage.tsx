import { AlertCircle, BookText, Clock3, Info, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateManualEntryInput } from "@/core/repositories";
import { useDateFormatter } from "@/shared/date";
import type { ManualEntry } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useViewDensityMode } from "@/shared/preferences/viewDensityMode";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
  Select,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  MANUAL_CATEGORY_LABEL_KEYS,
  MANUAL_CATEGORY_OPTIONS,
  MANUAL_IMPORTANCE_LABEL_KEYS,
  MANUAL_STATUS_LABEL_KEYS,
  MANUAL_STATUS_OPTIONS,
} from "../constants";
import { filterManualEntries, getManualEntrySummary } from "../manualEntries";
import { ManualEntryCard } from "../components/ManualEntryCard";
import { ManualEntryForm } from "../components/ManualEntryForm";
import { useManualEntries } from "../hooks/useManualEntries";
import {
  createManualEntryDraftFromTemplate,
  PERSONAL_MANUAL_TEMPLATES,
} from "../manualTemplates";
import type { ManualEntryFormValues } from "../types";
import type { ManualEntryFormSeed } from "../types";

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

function previewTemplateBody(value: string): string {
  const firstLine = value.split("\n")[0].trim();
  if (firstLine.length <= 88) {
    return firstLine;
  }

  return `${firstLine.slice(0, 88)}…`;
}

type ManualContextualHelpProps = {
  isOpen: boolean;
  onToggle: () => void;
  panelId?: string;
};

const manualContextualHelpCopy = {
  en: {
    button: "Help",
    buttonAria: "Help for Personal Manual",
    title: "What belongs here",
    details: "Keep personal operating instructions, preferences, principles, reminders, and self-knowledge here.",
    review: "These notes can support future planning and review, but AliOS does not infer private meaning automatically.",
  },
  fa: {
    button: "راهنما",
    buttonAria: "راهنمای دفترچه شخصی",
    title: "اینجا چه چیزی بنویسم؟",
    details: "دستورالعمل‌های شخصی، ترجیح‌ها، اصل‌ها، یادآورها و شناخت خودتان را اینجا نگه دارید.",
    review: "این نوشته‌ها می‌توانند به برنامه‌ریزی و مرور بعدی کمک کنند، اما AliOS معنی خصوصی آن‌ها را خودکار حدس نمی‌زند.",
  },
} as const;

export function ManualContextualHelp({
  isOpen,
  onToggle,
  panelId = "personal-manual-contextual-help",
}: ManualContextualHelpProps) {
  const { language, t } = useI18n();
  const copy = manualContextualHelpCopy[language];

  return (
    <div className="mt-4 max-w-3xl space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
        aria-label={copy.buttonAria}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="min-h-11"
      >
        <Info className="me-2 h-4 w-4" aria-hidden="true" />
        {copy.button}
      </Button>

      {isOpen ? (
        <div
          id={panelId}
          role="note"
          className="alios-surface-muted p-4 text-sm leading-7 text-muted-foreground"
        >
          <p className="font-medium text-foreground">{copy.title}</p>
          <div className="mt-2 space-y-2">
            <p>{copy.details}</p>
            <p>{copy.review}</p>
            <p>{t("manual.localOnlyDescription")}</p>
            <p>{t("manual.nonAdvisoryNote")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PersonalManualPage() {
  const { direction, t } = useI18n();
  const { formatDateTime } = useDateFormatter();
  const { isSimpleView } = useViewDensityMode();
  const [searchParams] = useSearchParams();
  const { entries, isLoading, error, loadEntries, createEntry, updateEntry, deleteEntry } =
    useManualEntries();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ManualEntry | undefined>();
  const [draftEntry, setDraftEntry] = useState<ManualEntryFormSeed | undefined>();
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
  const [formRevision, setFormRevision] = useState(0);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [showSimpleTemplates, setShowSimpleTemplates] = useState(false);
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState(false);
  const focusId = searchParams.get("focusId");
  const manualPreviewLimit = isSimpleView ? 4 : 6;

  const summary = useMemo(() => getManualEntrySummary(entries), [entries]);
  const templateCards = useMemo(
    () =>
      PERSONAL_MANUAL_TEMPLATES.map((template) => ({
        ...template,
        title: t(template.titleKey),
        description: t(template.descriptionKey),
        bodyPreview: previewTemplateBody(t(template.bodyScaffoldKey)),
      })),
    [t]
  );
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
  const activeEntries = filteredEntries.filter((entry) => entry.status === "active");
  const reviewDueEntries = filteredEntries.filter((entry) => {
    const interval = entry.reviewIntervalDays;
    if (!interval) {
      return false;
    }

    const baseline = entry.lastReviewedAt ?? entry.updatedAt;
    const dueAt = new Date(baseline);
    dueAt.setDate(dueAt.getDate() + interval);
    return dueAt.getTime() <= Date.now();
  });
  const primaryEntry = activeEntries[0] ?? filteredEntries[0];

  const hasActiveFilters =
    categoryFilter !== "all" || statusFilter !== "all" || appliedQuery.length > 0;
  const focusRequiresAllEntries = filteredEntries.findIndex((entry) => entry.id === focusId) >= manualPreviewLimit;
  const displayedEntries = showAllEntries || focusRequiresAllEntries
    ? filteredEntries
    : filteredEntries.slice(0, manualPreviewLimit);
  const hiddenEntryCount = Math.max(filteredEntries.length - displayedEntries.length, 0);

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
    setDraftEntry(undefined);
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const openEditForm = (entry: ManualEntry) => {
    setEditingEntry(entry);
    setDraftEntry({
      title: entry.title,
      body: entry.body,
      category: entry.category,
      importance: entry.importance,
      status: entry.status,
      tags: [...entry.tags],
      reviewIntervalDays: entry.reviewIntervalDays,
    });
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const openTemplateForm = (templateId: string) => {
    const template = PERSONAL_MANUAL_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setEditingEntry(undefined);
    setDraftEntry(createManualEntryDraftFromTemplate(template, t));
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEntry(undefined);
    setDraftEntry(undefined);
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
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-5">
            <SectionHeader
              eyebrow={t("manual.title")}
              icon={<BookText className="h-5 w-5" />}
              title={t("manual.title")}
              description={t("manual.description")}
              status={<StatusChip tone="neutral">{t("manual.localOnlyNote")}</StatusChip>}
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("manual.latestUpdated")}
              </p>
              <p className="break-words text-2xl font-semibold leading-9 tracking-tight sm:text-3xl">
                {primaryEntry ? primaryEntry.title : t("manual.emptyTitle")}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {primaryEntry
                  ? primaryEntry.body.slice(0, 180)
                  : t("manual.emptyDescription")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SoftPanel className="gap-2 border-primary/15 bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("manual.activeEntries")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{activeEntries.length}</p>
                <p className="text-sm text-muted-foreground">{t("manual.userWrittenOnly")}</p>
              </SoftPanel>
              <SoftPanel className="gap-2 border-primary/15 bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("manual.reviewDue")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{reviewDueEntries.length}</p>
                <p className="text-sm text-muted-foreground">{t("manual.nonAdvisoryNote")}</p>
              </SoftPanel>
              <SoftPanel className="gap-2 border-primary/15 bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("manual.totalEntries")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{summary.totalCount}</p>
                <p className="text-sm text-muted-foreground">
                  {summary.latestUpdatedEntry
                    ? formatDateTime(summary.latestUpdatedEntry.updatedAt)
                    : t("manual.noLatestEntry")}
                </p>
              </SoftPanel>
            </div>
          </div>

          <SoftPanel className="space-y-4 border-primary/20 bg-primary/5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t("manual.newEntry")}
              </p>
              <p className="text-xl font-semibold leading-8">
                {t("manual.templatesTitle")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button type="button" className="w-full" onClick={openCreateForm}>
                <Plus className="me-2 h-4 w-4" />
                {t("manual.newEntry")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowSimpleTemplates(true)}
              >
                {t("manual.templatesTitle")}
              </Button>
            </div>
            {isSimpleView ? (
              <ManualContextualHelp
                isOpen={isContextualHelpOpen}
                onToggle={() => setIsContextualHelpOpen((current) => !current)}
              />
            ) : (
              <div className="space-y-2 text-sm leading-7 text-muted-foreground">
                <p>{t("manual.nonAdvisoryNote")}</p>
                <p>{t("manual.localOnlyDescription")}</p>
              </div>
            )}
          </SoftPanel>
        </div>
      </PremiumCard>

      {successMessage ? (
        <div role="status" className="alios-status-success rounded-surface border px-4 py-3 text-sm">
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="alios-status-danger flex flex-col gap-3 rounded-surface border p-4 sm:flex-row sm:items-center sm:justify-between"
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
          className="alios-surface-muted px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>

          <PremiumCard>
            <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
              <SectionHeader
                title={
                  formOpen
                    ? editingEntry
                      ? t("manual.editEntry")
                      : t("manual.createEntry")
                    : t("manual.newEntry")
                }
                description={t("manual.formDescription")}
                status={<StatusChip tone="neutral">{t("manual.userWrittenOnly")}</StatusChip>}
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
                    key={`${editingEntry?.id ?? draftEntry?.title ?? "manual-entry-form"}-${formRevision}`}
                    entry={editingEntry ?? draftEntry}
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
                status={<StatusChip tone="neutral">{filteredEntries.length}</StatusChip>}
              />

              <SoftPanel className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
                <div className="relative min-w-0">
                  <Search
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                      direction === "rtl" ? "right-3" : "left-3"
                    )}
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("manual.searchPlaceholder")}
                    className={direction === "rtl" ? "pr-9" : "pl-9"}
                    aria-label={t("manual.searchLabel")}
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value as ManualEntry["category"] | "all")
                  }
                  aria-label={t("manual.categoryFilter")}
                >
                  {MANUAL_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
                <Select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as ManualEntry["status"] | "all")
                  }
                  aria-label={t("manual.statusFilter")}
                >
                  {MANUAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-col">
                  <Button type="button" className="w-full sm:w-auto" onClick={handleSearch}>
                    {t("manual.search")}
                  </Button>
                  {hasActiveFilters ? (
                    <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => void clearFilters()}>
                      <X className="me-2 h-4 w-4" />
                      {t("manual.clearFilters")}
                    </Button>
                  ) : null}
                </div>
              </SoftPanel>
            </div>
          </PremiumCard>
        </div>

        <div className="space-y-6">
          {isSimpleView && !showSimpleTemplates ? (
            <PremiumCard>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <SectionHeader
                  title={t("manual.templatesTitle")}
                  description={t("manual.templatesDescription")}
                  status={<StatusChip tone="neutral">{templateCards.length}</StatusChip>}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSimpleTemplates(true)}
                  aria-expanded={showSimpleTemplates}
                >
                  {t("common.expandSection")}
                </Button>
              </div>
            </PremiumCard>
          ) : (
            <PremiumCard>
              <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
                <SectionHeader
                  title={t("manual.templatesTitle")}
                  description={t("manual.templatesDescription")}
                  status={<StatusChip tone="neutral">{t("manual.localOnlyNote")}</StatusChip>}
                />
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  {t("manual.templatesNote")}
                </p>
                <div className="grid gap-2 sm:gap-3">
                  {templateCards.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => openTemplateForm(template.id)}
                      className="alios-surface-muted min-w-0 p-3 text-start transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="break-words text-[0.95rem] font-semibold leading-6 sm:text-base">
                            {template.title}
                          </p>
                          <p className="break-words text-sm leading-6 text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/70 pt-3 sm:mt-4">
                        <Badge
                          variant="secondary"
                          className="max-w-full break-words whitespace-normal text-start leading-5"
                        >
                          {t(MANUAL_CATEGORY_LABEL_KEYS[template.defaultCategory])}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="max-w-full break-words whitespace-normal text-start leading-5"
                        >
                          {t(MANUAL_IMPORTANCE_LABEL_KEYS[template.defaultImportance])}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="max-w-full break-words whitespace-normal text-start leading-5"
                        >
                          {t(MANUAL_STATUS_LABEL_KEYS[template.defaultStatus])}
                        </Badge>
                      </div>
                      <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
                        {template.bodyPreview}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </PremiumCard>
          )}

          <PremiumCard>
            <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
              <SectionHeader
                title={t("manual.latestUpdated")}
                description={t("manual.localOnlyDescription")}
                status={<StatusChip tone="neutral">{summary.totalCount}</StatusChip>}
              />
              {summary.latestUpdatedEntry ? (
                <SoftPanel className="space-y-2 bg-background/80">
                  <p className="text-base font-semibold">{summary.latestUpdatedEntry.title}</p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {summary.latestUpdatedEntry.body.slice(0, 180)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(summary.latestUpdatedEntry.updatedAt)}
                  </p>
                </SoftPanel>
              ) : (
                <SoftPanel className="space-y-2 bg-background/80">
                  <p className="text-sm text-muted-foreground">{t("manual.noLatestEntry")}</p>
                </SoftPanel>
              )}
            </div>
          </PremiumCard>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("manual.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="alios-surface-muted h-72 animate-pulse bg-muted/60" />
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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayedEntries.map((entry) => (
            <div
              key={entry.id}
              ref={(node) => {
                entryRefs.current[entry.id] = node;
              }}
              className={cn(
                "min-w-0 scroll-mt-6 rounded-[1.75rem] transition-shadow",
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
      {filteredEntries.length > manualPreviewLimit && !focusRequiresAllEntries ? (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setShowAllEntries((current) => !current)}>
            {showAllEntries
              ? t("common.showFewer")
              : t("common.showMoreCount", { count: hiddenEntryCount })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
