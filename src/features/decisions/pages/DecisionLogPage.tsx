import { AlertCircle, GitBranch, Info, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CreateDecisionLogEntryInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import {
  findLinkedGoalById,
  findLinkedProjectById,
} from "@/shared/entityLinks";
import type { DecisionLogEntry, Goal, Project } from "@/shared/types";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { useViewDensityMode } from "@/shared/preferences/viewDensityMode";
import {
  Button,
  EmptyState,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
  CollapsibleSection,
} from "@/shared/ui";

import { useDecisionLog } from "../hooks/useDecisionLog";
import {
  filterDecisionLogEntries,
  getDecisionLogFilterCounts,
  isDecisionNeedsReview,
  type DecisionLogFilter,
} from "../decisionLog";
import { DecisionLogForm } from "../components/DecisionLogForm";
import { DecisionLogCard } from "../components/DecisionLogCard";
import type { DecisionLogFormValues } from "../types";

const decisionLogFilters: Array<{
  value: DecisionLogFilter;
  labelKey: TranslationKey;
}> = [
  { value: "all", labelKey: "decisions.filterAll" },
  { value: "open", labelKey: "decisions.filterOpen" },
  { value: "decided", labelKey: "decisions.filterDecided" },
  { value: "needsReview", labelKey: "decisions.filterNeedsReview" },
  { value: "reviewed", labelKey: "decisions.filterReviewed" },
];

function parseOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function splitTextList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseRating(value: string): 1 | 2 | 3 | 4 | 5 | undefined {
  switch (value) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5":
      return 5;
    default:
      return undefined;
  }
}

type DecisionLogContextualHelpProps = {
  isOpen: boolean;
  onToggle: () => void;
  panelId?: string;
};

const decisionLogHelpContentKeys: TranslationKey[] = [
  "decisions.description",
  "decisions.localOnlyDescription",
  "decisions.nonAdvisoryNote",
];

const decisionLogContextualHelpCopy = {
  en: {
    button: "Help",
    buttonAria: "Help for Decision Log",
    title: "What to record here",
    details: "Record the choice, why, tradeoffs or options, and what happened later.",
  },
  fa: {
    button: "راهنما",
    buttonAria: "راهنمای دفترچه تصمیم‌ها",
    title: "اینجا چه چیزی را ثبت کنم؟",
    details: "انتخاب، دلیل، گزینه‌ها یا بده‌بستان‌ها، و نتیجه بعدی را بنویسید.",
  },
} as const;

export function DecisionLogContextualHelp({
  isOpen,
  onToggle,
  panelId = "decision-log-contextual-help",
}: DecisionLogContextualHelpProps) {
  const { language, t } = useI18n();
  const copy = decisionLogContextualHelpCopy[language];

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
          <p className="font-medium text-foreground">
            {copy.title}
          </p>
          <div className="mt-2 space-y-2">
            <p>{copy.details}</p>
            {decisionLogHelpContentKeys.map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DecisionLogPage() {
  const { t } = useI18n();
  const { isSimpleView } = useViewDensityMode();
  const { projects: projectsRepository, goals: goalsRepository } =
    useStorageAdapter();
  const {
    entries,
    isLoading,
    error,
    loadEntries,
    createDecision,
    updateDecision,
    deleteDecision,
  } = useDecisionLog();
  const [selectedFilter, setSelectedFilter] =
    useState<DecisionLogFilter>("all");
  const [editingDecision, setEditingDecision] = useState<
    DecisionLogEntry | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAllDecisions, setShowAllDecisions] = useState(false);
  const [isContextualHelpOpen, setIsContextualHelpOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [linkOptionsError, setLinkOptionsError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const referenceDate = useMemo(() => new Date(), []);
  const hasActiveFilter = selectedFilter !== "all";
  const decisionPreviewLimit = 12;

  const filterCounts = useMemo(
    () => getDecisionLogFilterCounts(entries, referenceDate),
    [entries, referenceDate]
  );
  const filteredEntries = useMemo(
    () => filterDecisionLogEntries(entries, selectedFilter, referenceDate),
    [entries, referenceDate, selectedFilter]
  );
  const needsReviewEntries = useMemo(
    () => entries.filter((entry) => isDecisionNeedsReview(entry, referenceDate)),
    [entries, referenceDate]
  );
  const activeDecisions = filteredEntries.filter(
    (entry) => entry.status === "open" || entry.status === "decided"
  );
  const primaryDecision = activeDecisions[0] ?? filteredEntries[0];
  const displayedEntries = showAllDecisions
    ? filteredEntries
    : filteredEntries.slice(0, decisionPreviewLimit);
  const hiddenDecisionCount = Math.max(filteredEntries.length - displayedEntries.length, 0);

  useEffect(() => {
    setShowAllDecisions(false);
  }, [selectedFilter]);

  useEffect(() => {
    let isCancelled = false;

    void Promise.all([projectsRepository.list(), goalsRepository.list()])
      .then(([nextProjects, nextGoals]) => {
        if (isCancelled) {
          return;
        }

        setProjects(nextProjects);
        setGoals(nextGoals);
        setLinkOptionsError(null);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setProjects([]);
        setGoals([]);
        setLinkOptionsError(t("links.loadError"));
      });

    return () => {
      isCancelled = true;
    };
  }, [goalsRepository, projectsRepository, t]);

  useEffect(() => {
    if (!editingDecision) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingDecision]);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const closeEditor = () => {
    setEditingDecision(undefined);
    setIsEditorOpen(false);
  };

  const handleSubmit = async (values: DecisionLogFormValues) => {
    clearMessages();
    setIsSubmitting(true);

    const input: CreateDecisionLogEntryInput = {
      title: values.title,
      decisionDate: values.decisionDate,
      status: values.status,
      category: parseOptionalText(values.category),
      context: values.context,
      projectId: parseOptionalText(values.projectId),
      goalId: parseOptionalText(values.goalId),
      options: splitTextList(values.optionsText),
      chosenOption: parseOptionalText(values.chosenOption),
      reasoning: parseOptionalText(values.reasoning),
      expectedOutcome: parseOptionalText(values.expectedOutcome),
      reviewDate: parseOptionalText(values.reviewDate),
      actualOutcome: parseOptionalText(values.actualOutcome),
      lesson: parseOptionalText(values.lesson),
      confidence: parseRating(values.confidence),
      importance: parseRating(values.importance),
      tags: splitTextList(values.tagsText),
    };

    try {
      if (editingDecision) {
        await updateDecision(editingDecision.id, input);
        setSuccessMessage(t("decisions.updated"));
      } else {
        await createDecision(input);
        setSuccessMessage(t("decisions.created"));
      }
      setEditingDecision(undefined);
    } catch (submitError) {
      setActionError(
        submitError instanceof Error ? submitError.message : t("decisions.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (decision: DecisionLogEntry) => {
    setDeletingId(decision.id);
    clearMessages();

    try {
      await deleteDecision(decision.id);
      setSuccessMessage(t("decisions.deleted"));
      if (editingDecision?.id === decision.id) {
        setEditingDecision(undefined);
      }
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : t("decisions.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkReviewed = async (decision: DecisionLogEntry) => {
    clearMessages();

    try {
      await updateDecision(decision.id, { status: "reviewed" });
      setSuccessMessage(t("decisions.markReviewedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("decisions.markReviewedError")
      );
    }
  };

  const handleArchive = async (decision: DecisionLogEntry) => {
    clearMessages();

    try {
      await updateDecision(decision.id, { status: "archived" });
      setSuccessMessage(t("decisions.archivedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("decisions.archiveError")
      );
    }
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface shadow-sm">
        <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-5">
            <SectionHeader
              eyebrow={t("decisions.title")}
              icon={<GitBranch className="h-5 w-5" />}
              title={t("decisions.title")}
              description={t("decisions.description")}
              status={<StatusChip tone="neutral">{t("decisions.localOnlyNote")}</StatusChip>}
            />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("decisions.reviewDue")}
              </p>
              <p className="break-words text-2xl font-semibold leading-9 tracking-tight sm:text-3xl">
                {primaryDecision ? primaryDecision.title : t("decisions.emptyTitle")}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {primaryDecision
                  ? primaryDecision.context
                  : t("decisions.emptyDescription")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SoftPanel className="gap-2 border-alios-saffron/25 bg-background/85">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("decisions.reviewDue")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{needsReviewEntries.length}</p>
                <p className="text-sm text-muted-foreground">{t("decisions.needsReviewSectionDescription")}</p>
              </SoftPanel>
              <SoftPanel className="gap-2 border-alios-saffron/25 bg-background/85">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("decisions.openDecisions")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{filterCounts.open}</p>
                <p className="text-sm text-muted-foreground">{t("decisions.formDescription")}</p>
              </SoftPanel>
              <SoftPanel className="gap-2 border-alios-saffron/25 bg-background/85">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("decisions.reviewedDecisions")}
                </p>
                <p className="text-lg font-semibold tabular-nums">{filterCounts.reviewed}</p>
                <p className="text-sm text-muted-foreground">{t("decisions.localOnlyDescription")}</p>
              </SoftPanel>
            </div>
          </div>

          <SoftPanel className="space-y-4 alios-thread-accent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t("decisions.createDecision")}
              </p>
              <p className="text-xl font-semibold leading-8">
                {needsReviewEntries.length > 0
                  ? t("decisions.needsReviewSection")
                  : t("decisions.formBasics")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setEditingDecision(undefined);
                  setIsEditorOpen(true);
                  clearMessages();
                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Plus className="me-2 h-4 w-4" />
                {t("decisions.createButton")}
              </Button>
              {needsReviewEntries.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    document
                      .getElementById("decision-log-review-due")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {t("decisions.needsReviewSection")}
                </Button>
              ) : null}
            </div>
            {isSimpleView ? (
              <DecisionLogContextualHelp
                isOpen={isContextualHelpOpen}
                onToggle={() => setIsContextualHelpOpen((current) => !current)}
              />
            ) : (
              <div className="space-y-2 text-sm leading-7 text-muted-foreground">
                <p>{t("decisions.nonAdvisoryNote")}</p>
                <p>{t("decisions.localOnlyDescription")}</p>
              </div>
            )}
          </SoftPanel>
        </div>
      </PremiumCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<GitBranch className="h-5 w-5" />}
          label={t("decisions.totalDecisions")}
          value={filterCounts.all}
        />
        <MetricCard
          icon={<AlertCircle className="h-5 w-5" />}
          label={t("decisions.reviewDue")}
          value={filterCounts.needsReview}
        />
        <MetricCard
          icon={<Plus className="h-5 w-5" />}
          label={t("decisions.openDecisions")}
          value={filterCounts.open}
        />
        <MetricCard
          icon={<RotateCcw className="h-5 w-5" />}
          label={t("decisions.reviewedDecisions")}
          value={filterCounts.reviewed}
        />
      </div>

      {successMessage ? (
        <div
          role="status"
          className="alios-status-success rounded-surface border px-4 py-3 text-sm"
        >
          {successMessage}
        </div>
      ) : null}

      {error || actionError || linkOptionsError ? (
        <div
          role="alert"
          className="alios-status-danger flex flex-col gap-3 rounded-surface border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError ?? error ?? linkOptionsError}</span>
          </div>
          {error ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void loadEntries()}>
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div ref={formRef}>
        <CollapsibleSection
          id="decision-log-editor"
          title={editingDecision ? t("decisions.editDecision") : t("decisions.createDecision")}
          description={t("decisions.formDescription")}
          status={<StatusChip tone="neutral">{t("decisions.formStatus")}</StatusChip>}
          defaultOpen={false}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          className="border-border/70 bg-card/95"
          contentClassName="p-5 sm:p-6"
        >
            <SectionHeader
              title={editingDecision ? t("decisions.editDecision") : t("decisions.createDecision")}
              description={t("decisions.formDescription")}
              status={<StatusChip tone="neutral">{t("decisions.formStatus")}</StatusChip>}
              actions={
                editingDecision ? (
                  <Button type="button" variant="outline" onClick={closeEditor}>
                    {t("common.cancel")}
                  </Button>
                ) : undefined
              }
            />
            <div className="mt-5">
              <DecisionLogForm
                key={editingDecision?.id ?? "decision-log-form"}
                decision={editingDecision}
                projects={projects}
                goals={goals}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={editingDecision ? closeEditor : undefined}
              />
            </div>
        </CollapsibleSection>
      </div>

      <SoftPanel className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {decisionLogFilters.map((filter) => {
          const isSelected = selectedFilter === filter.value;

          return (
            <Button
              key={filter.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className="flex w-full items-start justify-between gap-3 rounded-2xl text-start"
              onClick={() => setSelectedFilter(filter.value)}
            >
              <span className="min-w-0 flex-1 break-words">{t(filter.labelKey)}</span>
              <StatusChip tone={isSelected ? "primary" : "neutral"}>
                {filterCounts[filter.value]}
              </StatusChip>
            </Button>
          );
        })}
      </SoftPanel>

      <CollapsibleSection
        id="decision-log-review-due"
        title={t("decisions.needsReviewSection")}
        description={t("decisions.needsReviewSectionDescription")}
        icon={<AlertCircle className="h-5 w-5" />}
        status={<StatusChip tone="warning">{needsReviewEntries.length}</StatusChip>}
        defaultOpen={needsReviewEntries.length > 0}
        className="alios-surface-soft"
        contentClassName="space-y-4"
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
      >
        {needsReviewEntries.length === 0 ? (
          <EmptyState
            icon={<AlertCircle className="h-6 w-6" />}
            title={t("decisions.noReviewDueTitle")}
            description={t("decisions.noReviewDueDescription")}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {needsReviewEntries.map((decision) => (
              <DecisionLogCard
                key={decision.id}
                decision={decision}
                linkedProject={findLinkedProjectById(decision, projects)}
                linkedGoal={findLinkedGoalById(decision, goals)}
                isDeleting={deletingId === decision.id}
                onEdit={() => {
                  setEditingDecision(decision);
                  setIsEditorOpen(true);
                }}
                onDelete={() => handleDelete(decision)}
                onMarkReviewed={() => handleMarkReviewed(decision)}
                onArchive={() => handleArchive(decision)}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("decisions.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="alios-surface-muted h-72 animate-pulse bg-muted/60" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-6 w-6" />}
          title={hasActiveFilter ? t("decisions.noResultsTitle") : t("decisions.emptyTitle")}
          description={
            hasActiveFilter ? t("decisions.noResultsDescription") : t("decisions.emptyDescription")
          }
          actions={
            hasActiveFilter ? (
              <Button type="button" variant="outline" onClick={() => setSelectedFilter("all")}>
                {t("decisions.filterAll")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setEditingDecision(undefined);
                  setIsEditorOpen(true);
                }}
              >
                <Plus className="me-2 h-4 w-4" />
                {t("decisions.emptyAction")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {displayedEntries.map((decision) => (
            <DecisionLogCard
              key={decision.id}
              decision={decision}
              linkedProject={findLinkedProjectById(decision, projects)}
              linkedGoal={findLinkedGoalById(decision, goals)}
              isDeleting={deletingId === decision.id}
              onEdit={() => {
                setEditingDecision(decision);
                setIsEditorOpen(true);
              }}
              onDelete={() => handleDelete(decision)}
              onMarkReviewed={() => handleMarkReviewed(decision)}
              onArchive={() => handleArchive(decision)}
            />
          ))}
        </div>
      )}
      {filteredEntries.length > decisionPreviewLimit ? (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setShowAllDecisions((current) => !current)}>
            {showAllDecisions
              ? t("common.showFewer")
              : t("common.showMoreCount", { count: hiddenDecisionCount })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
