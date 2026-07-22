import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Plus,
  RotateCcw,
  Search,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateGoalInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useI18n } from "@/shared/i18n";
import type { Goal, Task } from "@/shared/types";
import {
  Button,
  EmptyState,
  Input,
  MetricCard,
  PremiumCard,
  SectionHeader,
  StatusChip,
  Select,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  GOAL_AREA_OPTIONS,
  GOAL_IMPORTANCE_OPTIONS,
  GOAL_STATUS_OPTIONS,
  GOAL_TIMEFRAME_OPTIONS,
  GOAL_AREA_LABEL_KEYS,
  GOAL_STATUS_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "../constants";
import {
  clampGoalProgressPercent,
  filterGoals,
  getGoalsSummary,
  isGoalReviewDue,
  type GoalFilter,
} from "../goals";
import {
  parseGoalAreaSearchParam,
  updateGoalAreaSearchParams,
} from "../goalAreaNavigation";
import {
  createGoalDraftFromTemplate,
  GOAL_TEMPLATES,
  previewGoalTemplateBody,
} from "../goalTemplates";
import { GoalCard } from "../components/GoalCard";
import { GoalForm } from "../components/GoalForm";
import { GoalTemplateDiscoveryMarquee } from "../components/GoalTemplateDiscoveryMarquee";
import { getGoalProjectProgress } from "../goalProjectProgress";
import { useGoals } from "../hooks/useGoals";
import type { GoalFormSeed, GoalFormValues } from "../types";

function splitTags(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function GoalsPage() {
  const { t } = useI18n();
  const { tasks: tasksRepository } = useStorageAdapter();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    entries,
    isLoading,
    error,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    markGoalReviewed,
    markGoalCompleted,
    reactivateGoal,
  } = useGoals();
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<GoalFilter["status"]>("all");
  const [areaFilter, setAreaFilter] = useState<GoalFilter["area"]>(() =>
    parseGoalAreaSearchParam(searchParams.get("area"))
  );
  const [timeframeFilter, setTimeframeFilter] =
    useState<GoalFilter["timeframe"]>("all");
  const [importanceFilter, setImportanceFilter] =
    useState<GoalFilter["importance"]>("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [draftGoalSeed, setDraftGoalSeed] = useState<GoalFormSeed | undefined>();
  const [draftGoalTemplateId, setDraftGoalTemplateId] = useState<string | null>(null);
  const [formRevision, setFormRevision] = useState(0);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const goalRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const formRef = useRef<HTMLDivElement | null>(null);
  const focusId = searchParams.get("focusId");
  const areaParam = searchParams.get("area");

  const summary = useMemo(() => getGoalsSummary(entries), [entries]);
  const isProjectProgressLoading = isProjectsLoading || isTasksLoading;

  useEffect(() => {
    setIsTasksLoading(true);
    void tasksRepository
      .list()
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setIsTasksLoading(false));
  }, [tasksRepository]);
  const templateCards = useMemo(
    () =>
      GOAL_TEMPLATES.map((template) => ({
        ...template,
        title: t(template.titleKey),
        description: t(template.descriptionKey),
        bodyPreview: previewGoalTemplateBody(t(template.bodyScaffoldKey)),
      })),
    [t]
  );
  const filteredEntries = useMemo(
    () =>
      filterGoals(entries, {
        status: statusFilter,
        area: areaFilter,
        timeframe: timeframeFilter,
        importance: importanceFilter,
        query: appliedQuery,
      }),
    [appliedQuery, areaFilter, entries, importanceFilter, statusFilter, timeframeFilter]
  );
  const hasActiveFilters =
    statusFilter !== "all" ||
    areaFilter !== "all" ||
    timeframeFilter !== "all" ||
    importanceFilter !== "all" ||
    appliedQuery.length > 0;
  const goalPreviewLimit = 6;
  const focusRequiresAllGoals = filteredEntries.findIndex((goal) => goal.id === focusId) >= goalPreviewLimit;
  const displayedGoals = showAllGoals || focusRequiresAllGoals
    ? filteredEntries
    : filteredEntries.slice(0, goalPreviewLimit);
  const hiddenGoalCount = Math.max(filteredEntries.length - displayedGoals.length, 0);

  useEffect(() => {
    setShowAllGoals(false);
  }, [statusFilter, areaFilter, timeframeFilter, importanceFilter, appliedQuery]);

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const openCreateForm = () => {
    setEditingGoal(undefined);
    setDraftGoalSeed(undefined);
    setDraftGoalTemplateId(null);
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const openEditForm = (goal: Goal) => {
    setEditingGoal(goal);
    setDraftGoalSeed({
      title: goal.title,
      description: goal.description,
      area: goal.area,
      timeframe: goal.timeframe,
      status: goal.status,
      importance: goal.importance,
      progressPercent: goal.progressPercent,
      targetDate: goal.targetDate,
      reviewIntervalDays: goal.reviewIntervalDays,
      tags: [...goal.tags],
    });
    setDraftGoalTemplateId(null);
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const openTemplateForm = (templateId: string) => {
    const template = GOAL_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setEditingGoal(undefined);
    setDraftGoalSeed(createGoalDraftFromTemplate(template, t));
    setDraftGoalTemplateId(template.id);
    setFormOpen(true);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingGoal(undefined);
    setDraftGoalSeed(undefined);
    setDraftGoalTemplateId(null);
  };

  const handleSearch = () => {
    setAppliedQuery(query.trim());
  };

  const clearFilters = () => {
    setQuery("");
    setAppliedQuery("");
    setStatusFilter("all");
    setAreaFilter("all");
    setTimeframeFilter("all");
    setImportanceFilter("all");
    setSearchParams(updateGoalAreaSearchParams(searchParams, "all"), {
      replace: true,
    });
  };

  const handleAreaFilterChange = (value: GoalFilter["area"]) => {
    setAreaFilter(value);
    setSearchParams(updateGoalAreaSearchParams(searchParams, value), {
      replace: true,
    });
  };

  const handleSubmit = async (values: GoalFormValues) => {
    clearMessages();
    setIsSubmitting(true);

    const input: CreateGoalInput = {
      title: values.title,
      description: values.description,
      area: values.area,
      timeframe: values.timeframe,
      status: values.status,
      importance: values.importance,
      progressPercent: clampGoalProgressPercent(
        Number.parseInt(values.progressPercent, 10)
      ),
      targetDate: parseOptionalDate(values.targetDate),
      reviewIntervalDays: parseOptionalNumber(values.reviewIntervalDays),
      tags: splitTags(values.tagsText),
    };

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, input);
        setSuccessMessage(t("goals.updated"));
      } else {
        await createGoal(input);
        setSuccessMessage(t("goals.created"));
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error ? submitError.message : t("goals.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (goal: Goal) => {
    setDeletingId(goal.id);
    clearMessages();

    try {
      await deleteGoal(goal.id);
      setSuccessMessage(t("goals.deleted"));
      if (editingGoal?.id === goal.id) {
        closeForm();
      }
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : t("goals.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkReviewed = async (goal: Goal) => {
    clearMessages();

    try {
      await markGoalReviewed(goal.id);
      setSuccessMessage(t("goals.markReviewedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("goals.markReviewedError")
      );
    }
  };

  const handleMarkCompleted = async (goal: Goal) => {
    clearMessages();

    try {
      await markGoalCompleted(goal.id);
      setSuccessMessage(t("goals.markCompletedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("goals.markCompletedError")
      );
    }
  };

  const handleReactivate = async (goal: Goal) => {
    clearMessages();

    try {
      await reactivateGoal(goal.id);
      setSuccessMessage(t("goals.reactivatedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("goals.reactivateError")
      );
    }
  };

  useEffect(() => {
    setAreaFilter(parseGoalAreaSearchParam(areaParam));
  }, [areaParam]);

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen]);

  useEffect(() => {
    if (!focusId) {
      setFocusedGoalId(null);
      setFocusMessage(null);
      return;
    }

    const focusedGoal = filteredEntries.find((goal) => goal.id === focusId);
    if (!focusedGoal) {
      if (!isLoading && entries.some((goal) => goal.id === focusId)) {
        setFocusedGoalId(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedGoalId(focusId);
    const node = goalRefs.current[focusId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedGoalId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [entries, filteredEntries, focusId, isLoading, t]);

  const reviewDueGoals = useMemo(
    () => entries.filter((goal) => isGoalReviewDue(goal)),
    [entries]
  );

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-6">
          <SectionHeader
            eyebrow={t("goals.title")}
            icon={<Target className="h-5 w-5" />}
            title={t("goals.title")}
            description={t("goals.description")}
            status={<StatusChip tone="neutral">{t("goals.localOnlyNote")}</StatusChip>}
          />
          <div className="mt-4 max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
            <p>{t("goals.nonAdvisoryNote")}</p>
            <p>{t("goals.localOnlyDescription")}</p>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Target className="h-5 w-5" />}
          label={t("goals.totalGoals")}
          value={summary.totalCount}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t("goals.activeGoals")}
          value={summary.activeCount}
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("goals.reviewDue")}
          value={summary.reviewDueCount}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t("goals.averageProgress")}
          value={
            summary.averageActiveProgress === null
              ? t("common.notRecorded")
              : `${Math.round(summary.averageActiveProgress)}%`
          }
          description={t("goals.highImportanceActive", {
            count: summary.highImportanceActiveCount,
          })}
        />
      </div>

      <GoalTemplateDiscoveryMarquee
        templates={templateCards}
        title={t("goals.templatesTitle")}
        description={t("goals.templatesDescription")}
        note={t("goals.templatesNote")}
        localOnlyLabel={t("goals.localOnlyNote")}
        useTemplateLabel={t("goals.useTemplate")}
        progressLabel={t("goals.progressLabel")}
        reviewIntervalDaysLabel={t("goals.reviewIntervalDaysLabel")}
        emptyTitle={t("goals.emptyTitle")}
        emptyDescription={t("goals.emptyDescription")}
        sectionLabel={t("goals.templatesTitle")}
        onSelectTemplate={openTemplateForm}
        t={t}
      />

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
            <Button type="button" size="sm" variant="outline" onClick={() => void loadGoals()}>
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
        <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
          <SectionHeader
            title={
              formOpen
                ? editingGoal
                  ? t("goals.editGoal")
                  : t("goals.createGoal")
                : t("goals.newGoal")
            }
            description={t("goals.formDescription")}
            status={<StatusChip tone="neutral">{t("goals.userManagedOnly")}</StatusChip>}
          />
          {!formOpen ? (
            <Button type="button" onClick={openCreateForm}>
              <Plus className="me-2 h-4 w-4" />
              {t("goals.newGoal")}
            </Button>
          ) : null}
          {formOpen ? (
            <div ref={formRef}>
              <GoalForm
                key={`${editingGoal?.id ?? draftGoalTemplateId ?? "new-goal"}-${formRevision}`}
                goal={editingGoal ?? draftGoalSeed}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </div>
          ) : null}
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="min-w-0 space-y-4 p-5 sm:p-6">
          <SectionHeader
            title={t("goals.filters")}
            description={t("goals.filtersDescription")}
            status={<StatusChip tone="neutral">{filteredEntries.length}</StatusChip>}
          />

          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_11rem_11rem_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("goals.searchPlaceholder")}
                className="pl-9"
                aria-label={t("goals.searchLabel")}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as GoalFilter["status"])
              }
              aria-label={t("goals.statusFilter")}
            >
              {GOAL_STATUS_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              value={areaFilter}
              onChange={(event) =>
                handleAreaFilterChange(
                  event.target.value as GoalFilter["area"]
                )
              }
              aria-label={t("goals.areaFilter")}
            >
              {GOAL_AREA_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              value={timeframeFilter}
              onChange={(event) =>
                setTimeframeFilter(event.target.value as GoalFilter["timeframe"])
              }
              aria-label={t("goals.timeframeFilter")}
            >
              {GOAL_TIMEFRAME_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              value={importanceFilter}
              onChange={(event) =>
                setImportanceFilter(event.target.value as GoalFilter["importance"])
              }
              aria-label={t("goals.importanceFilter")}
            >
              {GOAL_IMPORTANCE_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={handleSearch}
              >
                {t("goals.search")}
              </Button>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={clearFilters}
                >
                  <X className="me-2 h-4 w-4" />
                  {t("goals.clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </PremiumCard>

      {isLoading ? (
        <div
          className="grid min-w-0 gap-4 xl:grid-cols-2"
          aria-label={t("goals.loading")}
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-[1.75rem] border bg-muted/60" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title={hasActiveFilters ? t("goals.noResultsTitle") : t("goals.emptyTitle")}
          description={
            hasActiveFilters ? t("goals.noResultsDescription") : t("goals.emptyDescription")
          }
          note={hasActiveFilters ? undefined : t("goals.emptyNote")}
          actions={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={clearFilters}
              >
                {t("goals.clearFilters")}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={openCreateForm}
              >
                <Plus className="me-2 h-4 w-4" />
                {t("goals.emptyAction")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          {displayedGoals.map((goal) => (
            <div
              key={goal.id}
              ref={(node) => {
                goalRefs.current[goal.id] = node;
              }}
              className={cn(
                "min-w-0 scroll-mt-6 rounded-[1.75rem] transition-shadow",
                focusedGoalId === goal.id ? "ring-2 ring-primary/20" : null
              )}
            >
              <GoalCard
                goal={goal}
                isReviewDue={isGoalReviewDue(goal)}
                projectProgress={getGoalProjectProgress(goal.id, projects, tasks)}
                isProjectProgressLoading={isProjectProgressLoading}
                isDeleting={deletingId === goal.id}
                onEdit={() => openEditForm(goal)}
                onDelete={() => void handleDelete(goal)}
                onMarkReviewed={() => void handleMarkReviewed(goal)}
                onMarkCompleted={() => void handleMarkCompleted(goal)}
                onReactivate={() => void handleReactivate(goal)}
              />
            </div>
          ))}
        </div>
      )}
      {filteredEntries.length > goalPreviewLimit && !focusRequiresAllGoals ? (
        <div className="flex justify-start">
          <Button type="button" variant="outline" onClick={() => setShowAllGoals((current) => !current)}>
            {showAllGoals
              ? t("common.showFewer")
              : t("common.showMoreCount", { count: hiddenGoalCount })}
          </Button>
        </div>
      ) : null}

      {reviewDueGoals.length > 0 ? (
        <PremiumCard>
          <div className="space-y-4 p-5 sm:p-6">
            <SectionHeader
              title={t("goals.reviewDueSection")}
              description={t("goals.reviewDueSectionDescription")}
              status={<StatusChip tone="warning">{reviewDueGoals.length}</StatusChip>}
            />
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              {reviewDueGoals.slice(0, 4).map((goal) => (
                <GoalCard
                  key={`review-${goal.id}`}
                  goal={goal}
                  isReviewDue
                  projectProgress={getGoalProjectProgress(goal.id, projects, tasks)}
                  isProjectProgressLoading={isProjectProgressLoading}
                  isDeleting={deletingId === goal.id}
                  onEdit={() => openEditForm(goal)}
                  onDelete={() => void handleDelete(goal)}
                  onMarkReviewed={() => void handleMarkReviewed(goal)}
                  onMarkCompleted={() => void handleMarkCompleted(goal)}
                  onReactivate={() => void handleReactivate(goal)}
                />
              ))}
            </div>
          </div>
        </PremiumCard>
      ) : null}
    </section>
  );
}
