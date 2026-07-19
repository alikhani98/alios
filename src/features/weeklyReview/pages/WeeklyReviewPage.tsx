import {
  ArrowUpRight,
  BookText,
  Brain,
  CircleAlert,
  CircleCheckBig,
  CalendarDays,
  ClipboardList,
  Clock3,
  Compass,
  GitBranch,
  FolderKanban,
  Inbox,
  NotebookPen,
  RefreshCcw,
  Repeat2,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Goal, LifeAreaKey, ManualEntry } from "@/shared/types";
import {
  Badge,
  Button,
  CollapsibleSection,
  EmptyState,
  MetricCard,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { formatFinanceAmount } from "@/features/finance/financeCalculations";
import { createLinkedGoalPath } from "@/features/projects/projectGoalLinks";
import { createProjectTodayTasksPath } from "@/features/projects/projectTaskProgress";
import {
  GOAL_AREA_LABEL_KEYS,
  GOAL_IMPORTANCE_LABEL_KEYS,
  GOAL_STATUS_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "@/features/goals";
import {
  LIFE_AREA_ATTENTION_LABEL_KEYS,
  LIFE_AREA_STATUS_LABEL_KEYS,
} from "@/features/lifeAreas";
import {
  MANUAL_CATEGORY_LABEL_KEYS,
  MANUAL_IMPORTANCE_LABEL_KEYS,
} from "@/features/manual/constants";

import { useWeeklyReview } from "../hooks/useWeeklyReview";
import { WeeklyPlanForm } from "../components/WeeklyPlanForm";
import { WeeklyPlanLinks } from "../components/WeeklyPlanLinks";
import { WeeklyPlanningDashboard } from "../components/WeeklyPlanningDashboard";
import { WeeklyPlanRetrospective } from "../components/WeeklyPlanRetrospective";
import { getWeeklyPlanWeekStart } from "../weeklyPlan";
import { getWeeklyPlanExecution } from "../weeklyPlanExecution";
import { getWeeklyPlanLinks } from "../weeklyPlanLinks";
import type {
  WeeklyReviewFocusSuggestion,
  WeeklyReviewObservation,
  WeeklyReviewSummary,
} from "../weeklyReviewCalculations";

type ReviewQueueItem = {
  id: string;
  kind: "goal" | "lifeArea" | "project" | "manual" | "decision";
  title: string;
  to: string;
};

const quickLinks: ReadonlyArray<{ to: string; labelKey: TranslationKey }> = [
  { to: "/today", labelKey: "nav.today" },
  { to: "/routines", labelKey: "nav.routines" },
  { to: "/inbox", labelKey: "nav.inbox" },
  { to: "/projects", labelKey: "nav.projects" },
  { to: "/goals", labelKey: "nav.goals" },
  { to: "/journal", labelKey: "nav.journal" },
  { to: "/manual", labelKey: "nav.manual" },
  { to: "/decisions", labelKey: "nav.decisions" },
  { to: "/finance", labelKey: "nav.finance" },
];

function formatAverage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}

function getObservationTone(observation: WeeklyReviewObservation) {
  switch (observation.tone) {
    case "good-signal":
      return "success";
    case "needs-review":
      return "warning";
    case "awareness":
    default:
      return "neutral";
  }
}

function getObservationMessageKey(observation: WeeklyReviewObservation) {
  switch (observation.kind) {
    case "overdueTasks":
      return "weeklyReview.observationOverdueTasks";
    case "pendingInbox":
      return "weeklyReview.observationPendingInbox";
    case "journalReflection":
      return "weeklyReview.observationJournalReflection";
    case "financeBalance":
      return "weeklyReview.observationFinanceBalance";
    case "projectProgress":
      return "weeklyReview.observationProjectProgress";
    case "decisionReview":
      return "weeklyReview.observationDecisionReview";
    case "lifeAreaReview":
      return "weeklyReview.observationLifeAreaReview";
    case "lifeAreaAttention":
      return "weeklyReview.observationLifeAreaAttention";
    case "wellnessCheckins":
      return "weeklyReview.observationWellnessCheckins";
    case "noData":
    default:
      return "weeklyReview.observationNoData";
  }
}

function getFocusMessageKey(suggestion: WeeklyReviewFocusSuggestion) {
  switch (suggestion.kind) {
    case "processInbox":
      return "weeklyReview.focusProcessInbox";
    case "reviewOverdueTasks":
      return "weeklyReview.focusReviewOverdueTasks";
    case "writeJournalEntry":
      return "weeklyReview.focusWriteJournalEntry";
    case "recordFinanceData":
      return "weeklyReview.focusRecordFinanceData";
    case "reviewDecisions":
      return "weeklyReview.focusReviewDecisions";
    case "reviewGoals":
      return "weeklyReview.focusReviewGoals";
    case "reviewLifeAreas":
      return "weeklyReview.focusReviewLifeAreas";
    case "refineProjectNextAction":
      return "weeklyReview.focusRefineProjectNextAction";
    case "addFirstTask":
    default:
      return "weeklyReview.focusAddFirstTask";
  }
}

function hasEmptyState(
  emptyStates: Array<{ sectionId: string }>,
  sectionId: string
) {
  return emptyStates.some((item) => item.sectionId === sectionId);
}

function getManualReviewContext(
  entry: ManualEntry,
  formatDateTime: (value: string) => string,
  t: (key: TranslationKey) => string
) {
  if (entry.lastReviewedAt) {
    return `${t("weeklyReview.manualLastReviewed")}: ${formatDateTime(entry.lastReviewedAt)}`;
  }

  return `${t("weeklyReview.manualLastUpdated")}: ${formatDateTime(entry.updatedAt)}`;
}

function getGoalReviewContext(
  goal: Goal,
  formatDateTime: (value: string) => string,
  t: (key: TranslationKey) => string
) {
  if (goal.lastReviewedAt) {
    return `${t("weeklyReview.goalsLastReviewed")}: ${formatDateTime(goal.lastReviewedAt)}`;
  }

  return `${t("weeklyReview.goalsLastUpdated")}: ${formatDateTime(goal.updatedAt)}`;
}

function createFocusPath(path: string, id: string): string {
  return `${path}?${new URLSearchParams({ focusId: id }).toString()}`;
}

function getReviewQueue(summary: WeeklyReviewSummary): ReviewQueueItem[] {
  return [
    ...summary.projectSummary.reviewDueEntries.map((entry) => ({
      id: entry.id,
      kind: "project" as const,
      title: entry.title,
      to: createFocusPath("/projects", entry.id),
    })),
    ...summary.goalSummary.dueEntries.map((entry) => ({
      id: entry.id,
      kind: "goal" as const,
      title: entry.title,
      to: createFocusPath("/goals", entry.id),
    })),
    ...summary.lifeAreaSummary.dueEntries.map((entry) => ({
      id: entry.areaKey,
      kind: "lifeArea" as const,
      title: entry.title,
      to: createFocusPath("/life-areas", entry.areaKey),
    })),
    ...summary.manualSummary.dueEntries.map((entry) => ({
      id: entry.id,
      kind: "manual" as const,
      title: entry.title,
      to: createFocusPath("/manual", entry.id),
    })),
    ...summary.decisionSummary.dueEntries.map((entry) => ({
      id: entry.id,
      kind: "decision" as const,
      title: entry.title,
      to: "/decisions",
    })),
  ];
}

function getReviewQueueLabelKey(item: ReviewQueueItem): TranslationKey {
  switch (item.kind) {
    case "goal":
      return "nav.goals";
    case "lifeArea":
      return "nav.lifeAreas";
    case "project":
      return "nav.projects";
    case "manual":
      return "nav.manual";
    case "decision":
    default:
      return "nav.decisions";
  }
}

function getReviewQueueReasonKey(item: ReviewQueueItem): TranslationKey {
  switch (item.kind) {
    case "goal":
      return "goals.reviewDue";
    case "lifeArea":
      return "lifeAreas.reviewDue";
    case "manual":
      return "manual.reviewDue";
    case "decision":
      return "decisions.reviewDue";
    case "project":
    default:
      return "weeklyReview.needsReview";
  }
}

export function WeeklyReviewPage() {
  const { language, t } = useI18n();
  const { formatDate, formatDateTime } = useDateFormatter();
  const {
    summary,
    isLoading,
    error,
    loadWeeklyReview,
    markManualEntryReviewed,
    markGoalReviewed,
    markLifeAreaReviewed,
    markProjectReviewed,
    markDecisionReviewed,
    weeklyPlan,
    previousWeeklyPlan,
    planningOptions,
    saveWeeklyPlan,
  } = useWeeklyReview();
  const [isSavingWeeklyPlan, setIsSavingWeeklyPlan] = useState(false);

  const reviewQueue = useMemo(
    () => (summary ? getReviewQueue(summary) : []),
    [summary]
  );
  const weeklyPlanLinks = useMemo(
    () => getWeeklyPlanLinks(weeklyPlan, planningOptions.goals, planningOptions.projects, planningOptions.tasks),
    [planningOptions.goals, planningOptions.projects, planningOptions.tasks, weeklyPlan]
  );
  const weeklyPlanExecution = useMemo(
    () => getWeeklyPlanExecution(weeklyPlan, planningOptions.goals, planningOptions.projects, planningOptions.tasks),
    [planningOptions.goals, planningOptions.projects, planningOptions.tasks, weeklyPlan]
  );
  const previousWeeklyPlanLinks = useMemo(
    () => getWeeklyPlanLinks(previousWeeklyPlan, planningOptions.goals, planningOptions.projects, planningOptions.tasks),
    [planningOptions.goals, planningOptions.projects, planningOptions.tasks, previousWeeklyPlan]
  );
  const previousWeeklyPlanExecution = useMemo(
    () => getWeeklyPlanExecution(previousWeeklyPlan, planningOptions.goals, planningOptions.projects, planningOptions.tasks),
    [planningOptions.goals, planningOptions.projects, planningOptions.tasks, previousWeeklyPlan]
  );

  const handleReviewQueueItem = (item: ReviewQueueItem) => {
    switch (item.kind) {
      case "goal":
        return markGoalReviewed(item.id);
      case "lifeArea":
        return markLifeAreaReviewed(item.id as LifeAreaKey);
      case "project":
        return markProjectReviewed(item.id);
      case "manual":
        return markManualEntryReviewed(item.id);
      case "decision":
      default:
        return markDecisionReviewed(item.id);
    }
  };

  const handleSaveWeeklyPlan = async (values: { focusTitle: string; intention?: string; goalId?: string; projectId?: string; taskId?: string }) => {
    if (!values.focusTitle) return;
    setIsSavingWeeklyPlan(true);
    try { await saveWeeklyPlan(values); } finally { setIsSavingWeeklyPlan(false); }
  };

  const currencyLocale = language === "fa" ? "fa-IR" : "en-US";
  const formatAmount = useMemo(
    () => (value: number) => `${formatFinanceAmount(value, currencyLocale)} ${t("finance.currency")}`,
    [currencyLocale, t]
  );

  const windowLabel = summary
    ? `${t("weeklyReview.last7Days")} · ${formatDate(summary.reviewWindow.startDate)} - ${formatDate(summary.reviewWindow.endDate)}`
    : t("weeklyReview.last7Days");

  const overviewMetrics = summary
    ? [
        {
          icon: <CircleCheckBig className="h-5 w-5" />,
          label: t("weeklyReview.completedTasks"),
          value: summary.taskSummary.completedInWindowCount,
          description: t("weeklyReview.completedTasksDescription"),
        },
        {
          icon: <ClipboardList className="h-5 w-5" />,
          label: t("weeklyReview.openTasks"),
          value: summary.taskSummary.openCount,
          description: t("weeklyReview.openTasksDescription"),
        },
        {
          icon: <CircleAlert className="h-5 w-5" />,
          label: t("weeklyReview.overdueTasks"),
          value: summary.taskSummary.overdueCount,
          description: t("weeklyReview.overdueTasksDescription"),
        },
        {
          icon: <Inbox className="h-5 w-5" />,
          label: t("weeklyReview.pendingInbox"),
          value: summary.inboxSummary.pendingCount,
          description: t("weeklyReview.pendingInboxDescription"),
        },
        {
          icon: <NotebookPen className="h-5 w-5" />,
          label: t("weeklyReview.journalEntries"),
          value: summary.journalSummary.entriesInWindowCount,
          description: t("weeklyReview.journalEntriesDescription"),
        },
        {
          icon: <FolderKanban className="h-5 w-5" />,
          label: t("weeklyReview.activeProjects"),
          value: summary.projectSummary.activeCount,
          description: t("weeklyReview.activeProjectsDescription"),
        },
        {
          icon: <GitBranch className="h-5 w-5" />,
          label: t("weeklyReview.needsReviewDecisions"),
          value: summary.decisionSummary.needsReviewCount,
          description: t("weeklyReview.decisionWindowDescription"),
          status: (
            <StatusChip
              tone={summary.decisionSummary.needsReviewCount > 0 ? "warning" : "neutral"}
            >
              {summary.decisionSummary.needsReviewCount > 0
                ? t("weeklyReview.needsReview")
                : t("weeklyReview.goodSignal")}
            </StatusChip>
          ),
        },
        {
          icon: <BookText className="h-5 w-5" />,
          label: t("weeklyReview.manualReviewDue"),
          value: summary.manualSummary.dueCount,
          description: t("weeklyReview.manualSectionDescription"),
          status: (
            <StatusChip tone={summary.manualSummary.dueCount > 0 ? "warning" : "neutral"}>
              {summary.manualSummary.dueCount > 0
                ? t("weeklyReview.manualDue")
                : t("weeklyReview.manualClear")}
            </StatusChip>
          ),
        },
        {
          icon: <Target className="h-5 w-5" />,
          label: t("weeklyReview.goalsReviewDue"),
          value: summary.goalSummary.dueCount,
          description: t("weeklyReview.goalsSectionDescription"),
          status: (
            <StatusChip tone={summary.goalSummary.dueCount > 0 ? "warning" : "neutral"}>
              {summary.goalSummary.dueCount > 0
                ? t("weeklyReview.goalsDue")
                : t("weeklyReview.goalsClear")}
            </StatusChip>
          ),
        },
        {
          icon: <Wallet className="h-5 w-5" />,
          label: t("weeklyReview.netCashflow"),
          value: formatAmount(summary.financeSummary.netCashflowInWindow),
          description: t("weeklyReview.financeWindowDescription"),
          status: (
            <StatusChip tone={summary.financeSummary.netCashflowInWindow >= 0 ? "success" : "warning"}>
              {summary.financeSummary.netCashflowInWindow >= 0
                ? t("weeklyReview.goodSignal")
                : t("weeklyReview.needsReview")}
            </StatusChip>
          ),
        },
      ]
    : [];

  return (
    <section className="alios-page space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => void loadWeeklyReview()}
          >
            <RefreshCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-6">
          <SectionHeader
            eyebrow={t("weeklyReview.title")}
            icon={<Sparkles className="h-5 w-5" />}
            title={t("weeklyReview.title")}
            description={t("weeklyReview.description")}
            status={
              <StatusChip tone="neutral">{t("weeklyReview.localOnlyNote")}</StatusChip>
            }
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("weeklyReview.reviewWindow")}
                </p>
                <p className="mt-1 text-sm font-medium">{windowLabel}</p>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {t("weeklyReview.windowDescription")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SoftPanel className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("weeklyReview.reviewScope")}
                </p>
                <p className="text-base font-semibold">{t("weeklyReview.scopeSubtitle")}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("weeklyReview.scopeDescription")}
                </p>
              </SoftPanel>
              <SoftPanel className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("weeklyReview.localFirst")}
                </p>
                <p className="text-base font-semibold">{t("weeklyReview.localFirstValue")}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("weeklyReview.localFirstDescription")}
                </p>
              </SoftPanel>
            </div>
          </div>
        </div>
      </PremiumCard>

      {isLoading ? (
        <div className="space-y-4" aria-label={t("common.loading")}>
          <div className="h-64 animate-pulse rounded-[2rem] border bg-muted/60" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-[2rem] border bg-muted/60" />
            ))}
          </div>
        </div>
      ) : summary ? (
        <>
          {summary.hasAnyData ? null : (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title={t("weeklyReview.noDataTitle")}
              description={t("weeklyReview.noDataDescription")}
              actions={
                <>
                  <Button asChild variant="default">
                    <Link to="/today">{t("nav.today")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/inbox">{t("nav.inbox")}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/finance">{t("nav.finance")}</Link>
                  </Button>
                </>
              }
            />
          )}

          <WeeklyPlanningDashboard
            plan={weeklyPlan}
            links={weeklyPlanLinks}
            execution={weeklyPlanExecution}
            reviewQueueCount={reviewQueue.length}
          />

          <WeeklyPlanRetrospective
            plan={previousWeeklyPlan}
            links={previousWeeklyPlanLinks}
            execution={previousWeeklyPlanExecution}
            weekLabel={previousWeeklyPlan ? formatDate(previousWeeklyPlan.weekStart) : undefined}
          />

          <CollapsibleSection
            id="weekly-plan-editor"
            title={t("weeklyReview.nextFocusLabel")}
            description={windowLabel}
            icon={<CalendarDays className="h-5 w-5" />}
            status={<StatusChip tone={weeklyPlan ? "primary" : "neutral"}>{weeklyPlan ? t("common.changesSaved") : t("common.notRecorded")}</StatusChip>}
            contentClassName="space-y-5"
          >
            <WeeklyPlanForm
              key={weeklyPlan?.updatedAt ?? "new-weekly-plan"}
              weekStart={getWeeklyPlanWeekStart()}
              plan={weeklyPlan}
              goals={planningOptions.goals}
              projects={planningOptions.projects}
              tasks={planningOptions.tasks}
              isSaving={isSavingWeeklyPlan}
              onSave={handleSaveWeeklyPlan}
            />
            <WeeklyPlanLinks links={weeklyPlanLinks} />
          </CollapsibleSection>

          <CollapsibleSection
            id="weekly-review-overview"
            title={t("weeklyReview.reviewScope")}
            description={t("weeklyReview.scopeDescription")}
            icon={<Compass className="h-5 w-5" />}
            status={<StatusChip tone="neutral">{overviewMetrics.length}</StatusChip>}
            defaultOpen={false}
            contentClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {overviewMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                icon={metric.icon}
                label={metric.label}
                value={metric.value}
                description={metric.description}
                status={metric.status}
              />
            ))}
          </CollapsibleSection>

          {reviewQueue.length > 0 ? (
            <CollapsibleSection
              id="weekly-review-queue"
              title={t("weeklyReview.needsReview")}
              description={t("weeklyReview.localOnlyNote")}
              icon={<Clock3 className="h-5 w-5" />}
              status={<StatusChip tone="warning">{reviewQueue.length}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {reviewQueue.map((item) => (
                  <SoftPanel key={`${item.kind}-${item.id}`} className="space-y-3">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <p className="min-w-0 break-words font-semibold leading-7">{item.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{t(getReviewQueueLabelKey(item))}</Badge>
                        <StatusChip tone="warning">{t(getReviewQueueReasonKey(item))}</StatusChip>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => void handleReviewQueueItem(item)}
                      >
                        {t("goals.markReviewed")}
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
                        <Link to={item.to}>{t(getReviewQueueLabelKey(item))}</Link>
                      </Button>
                    </div>
                  </SoftPanel>
                ))}
              </div>
            </CollapsibleSection>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <CollapsibleSection
              id="weekly-review-tasks"
              title={t("weeklyReview.tasksSection")}
              description={t("weeklyReview.tasksSectionDescription")}
              icon={<ClipboardList className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.taskSummary.totalCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.completedTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.taskSummary.completedInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.overdueTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.taskSummary.overdueCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.openTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.taskSummary.openCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.dueSoonTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.taskSummary.dueSoonCount}</p>
                </SoftPanel>
              </div>

              {hasEmptyState(summary.emptyStates, "tasks") ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title={t("weeklyReview.tasksEmptyTitle")}
                  description={t("weeklyReview.tasksEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-projects"
              title={t("weeklyReview.projectsSection")}
              description={t("weeklyReview.projectsSectionDescription")}
              icon={<FolderKanban className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.projectSummary.activeCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.activeProjects")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.projectSummary.activeCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.projectsWithNextAction")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.projectSummary.projectsWithNextActionCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.projectsNeedsAttention")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.projectSummary.needsAttentionCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.reviewWindow")}</p>
                  <p className="mt-1 text-sm font-medium">{windowLabel}</p>
                </SoftPanel>
              </div>

              {hasEmptyState(summary.emptyStates, "projects") ? (
                <EmptyState
                  icon={<FolderKanban className="h-6 w-6" />}
                  title={t("weeklyReview.projectsEmptyTitle")}
                  description={t("weeklyReview.projectsEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-planning-chain"
              title={`${t("nav.goals")} · ${t("nav.projects")} · ${t("nav.today")}`}
              description={t("weeklyReview.projectsSectionDescription")}
              icon={<Target className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.planningSummary.linkedProjectCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("nav.projects")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.planningSummary.linkedProjectCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.completedTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {summary.planningSummary.completedLinkedTaskCount} / {summary.planningSummary.linkedTaskCount}
                  </p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.openTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.planningSummary.openLinkedTaskCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("goals.progressLabel")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.planningSummary.completionPercent}%</p>
                </SoftPanel>
              </div>

              {summary.planningSummary.attentionEntries.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {summary.planningSummary.attentionEntries.map((entry) => (
                    <SoftPanel key={entry.project.id} className="space-y-3">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="break-words font-semibold leading-7">{entry.project.title}</p>
                          <p className="break-words text-sm text-muted-foreground">
                            {entry.goal?.title ?? t("projects.linkedGoalUnavailable")}
                          </p>
                        </div>
                        <StatusChip tone="warning">{entry.openTaskCount}</StatusChip>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {entry.goal ? (
                          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                            <Link to={createLinkedGoalPath(entry.goal.id)}>{t("nav.goals")}</Link>
                          </Button>
                        ) : null}
                        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                          <Link to={createProjectTodayTasksPath(entry.project.id)}>{t("projects.openTodayTasks")}</Link>
                        </Button>
                      </div>
                    </SoftPanel>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Target className="h-6 w-6" />}
                  title={t("weeklyReview.projectsEmptyTitle")}
                  description={t("weeklyReview.projectsSectionDescription")}
                  actions={
                    <Button asChild variant="outline">
                      <Link to="/projects">{t("nav.projects")}</Link>
                    </Button>
                  }
                />
              )}

              {summary.planningSummary.unavailableGoalProjectCount > 0 ? (
                <SoftPanel className="text-sm leading-7 text-muted-foreground">
                  {t("projects.linkedGoalUnavailable")}: {summary.planningSummary.unavailableGoalProjectCount}
                </SoftPanel>
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-routines"
              title={t("weeklyReview.routinesSection")}
              description={t("weeklyReview.routinesSectionDescription")}
              icon={<Repeat2 className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.routineSummary.plannedInWindowCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.routinePlannedTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.routineSummary.plannedInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.routineCompletedTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.routineSummary.completedInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.routineOpenTasks")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.routineSummary.openInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.routineCompletionRate")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.routineSummary.completionPercent}%</p>
                </SoftPanel>
              </div>
              <SoftPanel className="space-y-3">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.routinesSectionNote")}
                </p>
                <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
                  <Link to="/routines">{t("weeklyReview.openRoutines")}</Link>
                </Button>
              </SoftPanel>
              {hasEmptyState(summary.emptyStates, "routines") ? (
                <EmptyState
                  icon={<Repeat2 className="h-6 w-6" />}
                  title={t("weeklyReview.routinesEmptyTitle")}
                  description={t("weeklyReview.routinesEmptyDescription")}
                  actions={
                    <Button asChild variant="outline">
                      <Link to="/routines">{t("weeklyReview.openRoutines")}</Link>
                    </Button>
                  }
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-inbox"
              title={t("weeklyReview.inboxSection")}
              description={t("weeklyReview.inboxSectionDescription")}
              icon={<Inbox className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.inboxSummary.pendingCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.pendingInbox")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.inboxSummary.pendingCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.processedInbox")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.inboxSummary.processedCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.capturedInWindow")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.inboxSummary.capturedInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.totalInbox")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.inboxSummary.totalCount}</p>
                </SoftPanel>
              </div>

              {hasEmptyState(summary.emptyStates, "inbox") ? (
                <EmptyState
                  icon={<Inbox className="h-6 w-6" />}
                  title={t("weeklyReview.inboxEmptyTitle")}
                  description={t("weeklyReview.inboxEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-journal-knowledge"
              title={t("weeklyReview.journalKnowledgeSection")}
              description={t("weeklyReview.journalKnowledgeSectionDescription")}
              icon={<Brain className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.journalSummary.entriesInWindowCount + summary.knowledgeSummary.createdInWindowCount}</StatusChip>}
              contentClassName="space-y-4"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <SoftPanel className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{t("weeklyReview.journalSection")}</p>
                    <StatusChip tone="neutral">{summary.journalSummary.entriesInWindowCount}</StatusChip>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.journalEntries")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{summary.journalSummary.entriesInWindowCount}</p>
                    </SoftPanel>
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.averageMood")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{formatAverage(summary.journalSummary.averageMoodLevel)}</p>
                    </SoftPanel>
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.averageEnergy")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{formatAverage(summary.journalSummary.averageEnergyLevel)}</p>
                    </SoftPanel>
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.journalTotal")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{summary.journalSummary.totalCount}</p>
                    </SoftPanel>
                  </div>
                  {hasEmptyState(summary.emptyStates, "journal") ? (
                    <EmptyState
                      icon={<NotebookPen className="h-6 w-6" />}
                      title={t("weeklyReview.journalEmptyTitle")}
                      description={t("weeklyReview.journalEmptyDescription")}
                    />
                  ) : null}
                </SoftPanel>

                <SoftPanel className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{t("weeklyReview.knowledgeSection")}</p>
                    <StatusChip tone="neutral">{summary.knowledgeSummary.createdInWindowCount}</StatusChip>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.knowledgeItems")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{summary.knowledgeSummary.totalCount}</p>
                    </SoftPanel>
                    <SoftPanel>
                      <p className="text-xs text-muted-foreground">{t("weeklyReview.knowledgeCreatedInWindow")}</p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{summary.knowledgeSummary.createdInWindowCount}</p>
                    </SoftPanel>
                  </div>
                  {hasEmptyState(summary.emptyStates, "knowledge") ? (
                    <EmptyState
                      icon={<Brain className="h-6 w-6" />}
                      title={t("weeklyReview.knowledgeEmptyTitle")}
                      description={t("weeklyReview.knowledgeEmptyDescription")}
                    />
                  ) : null}
                </SoftPanel>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-decisions"
              title={t("weeklyReview.decisionsSection")}
              description={t("weeklyReview.decisionsSectionDescription")}
              icon={<GitBranch className="h-5 w-5" />}
              status={
                <StatusChip tone={summary.decisionSummary.needsReviewCount > 0 ? "warning" : "neutral"}>
                  {summary.decisionSummary.needsReviewCount}
                </StatusChip>
              }
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.decisionsCreated")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.decisionSummary.createdInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.decisionReviewDue")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.decisionSummary.needsReviewCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.reviewedDecisions")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.decisionSummary.reviewedInWindowCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.totalDecisions")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.decisionSummary.totalCount}</p>
                </SoftPanel>
              </div>
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.decisionWindowDescription")}
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("weeklyReview.decisionAwarenessNote")}
                </p>
              </SoftPanel>

              {hasEmptyState(summary.emptyStates, "decisions") ? (
                <EmptyState
                  icon={<GitBranch className="h-6 w-6" />}
                  title={t("weeklyReview.decisionsEmptyTitle")}
                  description={t("weeklyReview.decisionsEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-goals"
              title={t("weeklyReview.goalsSection")}
              description={t("weeklyReview.goalsSectionDescription")}
              icon={<Target className="h-5 w-5" />}
              status={<StatusChip tone={summary.goalSummary.dueCount > 0 ? "warning" : "neutral"}>{summary.goalSummary.dueCount}</StatusChip>}
              contentClassName="space-y-3"
            >
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.goalsSectionNote")}
                </p>
                <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
                  <Link to="/goals">{t("weeklyReview.openGoals")}</Link>
                </Button>
              </SoftPanel>

              {summary.goalSummary.dueCount === 0 ? (
                <EmptyState
                  icon={<Target className="h-6 w-6" />}
                  title={
                    hasEmptyState(summary.emptyStates, "goals")
                      ? t("weeklyReview.goalsEmptyTitle")
                      : t("weeklyReview.goalsNoReviewDueTitle")
                  }
                  description={
                    hasEmptyState(summary.emptyStates, "goals")
                      ? t("weeklyReview.goalsEmptyDescription")
                      : t("weeklyReview.goalsNoReviewDueDescription")
                  }
                  note={
                    hasEmptyState(summary.emptyStates, "goals")
                      ? t("weeklyReview.goalsEmptyNote")
                      : t("weeklyReview.goalsNoReviewDueNote")
                  }
                  actions={
                    <Button asChild variant="outline">
                      <Link to="/goals">{t("weeklyReview.openGoals")}</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {summary.goalSummary.dueEntries.map((goal) => (
                    <SoftPanel key={goal.id} className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold leading-7">{goal.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getGoalReviewContext(goal, formatDateTime, t)}
                          </p>
                        </div>
                        <StatusChip tone="warning">{t("goals.reviewDue")}</StatusChip>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {t(GOAL_AREA_LABEL_KEYS[goal.area])}
                        </Badge>
                        <Badge variant="outline">
                          {t(GOAL_TIMEFRAME_LABEL_KEYS[goal.timeframe])}
                        </Badge>
                        <Badge variant="outline">
                          {t(GOAL_STATUS_LABEL_KEYS[goal.status])}
                        </Badge>
                        <Badge variant="outline">
                          {t(GOAL_IMPORTANCE_LABEL_KEYS[goal.importance])}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm leading-7 text-muted-foreground">
                          {goal.description}
                        </p>
                        <p className="text-xs leading-6 text-muted-foreground">
                          {t("goals.progressLabel")}: {goal.progressPercent}%
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void markGoalReviewed(goal.id)}
                        >
                          {t("weeklyReview.goalsMarkReviewed")}
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/goals">{t("weeklyReview.openGoals")}</Link>
                        </Button>
                      </div>
                    </SoftPanel>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-life-areas"
              title={t("weeklyReview.lifeAreasSection")}
              description={t("weeklyReview.lifeAreasSectionDescription")}
              icon={<Compass className="h-5 w-5" />}
              status={
                <StatusChip
                  tone={summary.lifeAreaSummary.dueCount > 0 ? "warning" : "neutral"}
                >
                  {summary.lifeAreaSummary.dueCount}
                </StatusChip>
              }
              contentClassName="space-y-3"
            >
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.lifeAreasSectionNote")}
                </p>
                <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
                  <Link to="/life-areas">{t("weeklyReview.openLifeAreas")}</Link>
                </Button>
              </SoftPanel>

              {summary.lifeAreaSummary.dueCount === 0 ? (
                <EmptyState
                  icon={<Compass className="h-6 w-6" />}
                  title={
                    hasEmptyState(summary.emptyStates, "lifeAreas")
                      ? t("weeklyReview.lifeAreasEmptyTitle")
                      : t("weeklyReview.lifeAreasNoReviewDueTitle")
                  }
                  description={
                    hasEmptyState(summary.emptyStates, "lifeAreas")
                      ? t("weeklyReview.lifeAreasEmptyDescription")
                      : t("weeklyReview.lifeAreasNoReviewDueDescription")
                  }
                  note={
                    hasEmptyState(summary.emptyStates, "lifeAreas")
                      ? t("weeklyReview.lifeAreasEmptyNote")
                      : t("weeklyReview.lifeAreasNoReviewDueNote")
                  }
                  actions={
                    <Button asChild variant="outline">
                      <Link to="/life-areas">{t("weeklyReview.openLifeAreas")}</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {summary.lifeAreaSummary.dueEntries.map((area) => (
                    <SoftPanel key={area.id} className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold leading-7">{area.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {area.focusNote || area.description}
                          </p>
                        </div>
                        <StatusChip tone="warning">{t("weeklyReview.lifeAreasDue")}</StatusChip>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{t(GOAL_AREA_LABEL_KEYS[area.areaKey])}</Badge>
                        <Badge variant="outline">
                          {t(LIFE_AREA_STATUS_LABEL_KEYS[area.status])}
                        </Badge>
                        <Badge variant="outline">
                          {t(LIFE_AREA_ATTENTION_LABEL_KEYS[area.attentionLevel])}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                          onClick={() => void markLifeAreaReviewed(area.areaKey)}
                          >
                          {t("weeklyReview.lifeAreasMarkReviewed")}
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/life-areas">{t("weeklyReview.openLifeAreas")}</Link>
                        </Button>
                      </div>
                    </SoftPanel>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-manual"
              title={t("weeklyReview.manualSection")}
              description={t("weeklyReview.manualSectionDescription")}
              icon={<BookText className="h-5 w-5" />}
              status={
                <StatusChip
                  tone={summary.manualSummary.dueCount > 0 ? "warning" : "neutral"}
                >
                  {summary.manualSummary.dueCount}
                </StatusChip>
              }
              contentClassName="space-y-3"
            >
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.manualSectionNote")}
                </p>
                <Button asChild variant="outline" className="w-full justify-start sm:w-auto">
                  <Link to="/manual">{t("weeklyReview.openManual")}</Link>
                </Button>
              </SoftPanel>

              {hasEmptyState(summary.emptyStates, "manual") ? (
                <EmptyState
                  icon={<BookText className="h-6 w-6" />}
                  title={t("weeklyReview.manualEmptyTitle")}
                  description={t("weeklyReview.manualEmptyDescription")}
                  note={t("weeklyReview.manualEmptyNote")}
                  actions={
                    <Button asChild variant="outline">
                      <Link to="/manual">{t("weeklyReview.openManual")}</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {summary.manualSummary.dueEntries.map((entry) => (
                    <SoftPanel key={entry.id} className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold leading-7">{entry.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {getManualReviewContext(entry, formatDateTime, t)}
                          </p>
                        </div>
                        <StatusChip tone="warning">{t("manual.reviewDue")}</StatusChip>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {t(MANUAL_CATEGORY_LABEL_KEYS[entry.category])}
                        </Badge>
                        <Badge variant="outline">
                          {t(MANUAL_IMPORTANCE_LABEL_KEYS[entry.importance])}
                        </Badge>
                        <Badge variant="outline">
                          {t("manual.reviewIntervalDays")}: {entry.reviewIntervalDays ?? t("common.notRecorded")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void markManualEntryReviewed(entry.id)}
                        >
                          {t("weeklyReview.manualMarkReviewed")}
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/manual">{t("weeklyReview.openManual")}</Link>
                        </Button>
                      </div>
                    </SoftPanel>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-finance"
              title={t("weeklyReview.financeSection")}
              description={t("weeklyReview.financeSectionDescription")}
              icon={<Wallet className="h-5 w-5" />}
              status={<StatusChip tone={summary.financeSummary.netCashflowInWindow >= 0 ? "success" : "warning"}>{formatAmount(summary.financeSummary.netCashflowInWindow)}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.income")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatAmount(summary.financeSummary.incomeInWindow)}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.expenses")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatAmount(summary.financeSummary.expensesInWindow)}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.activeObligations")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.financeSummary.activeObligationsCount}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.remainingObligationTotal")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatAmount(summary.financeSummary.remainingObligationTotal)}</p>
                </SoftPanel>
              </div>
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.financeWindowDescription")}
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("weeklyReview.financeAwarenessNote")}
                </p>
              </SoftPanel>

              {hasEmptyState(summary.emptyStates, "finance") ? (
                <EmptyState
                  icon={<Wallet className="h-6 w-6" />}
                  title={t("weeklyReview.financeEmptyTitle")}
                  description={t("weeklyReview.financeEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              id="weekly-review-wellness"
              title={t("weeklyReview.wellnessSection")}
              description={t("weeklyReview.wellnessSectionDescription")}
              icon={<CalendarDays className="h-5 w-5" />}
              status={<StatusChip tone="neutral">{summary.wellnessSummary.checkinCountInWindow}</StatusChip>}
              contentClassName="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.checkins")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.wellnessSummary.checkinCountInWindow}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.notesCount")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{summary.wellnessSummary.notesCountInWindow}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.averageMood")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatAverage(summary.wellnessSummary.averageMoodLevel)}</p>
                </SoftPanel>
                <SoftPanel>
                  <p className="text-xs text-muted-foreground">{t("weeklyReview.averageEnergy")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatAverage(summary.wellnessSummary.averageEnergyLevel)}</p>
                </SoftPanel>
              </div>
              <SoftPanel className="space-y-2">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("weeklyReview.wellnessAwarenessNote")}
                </p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("weeklyReview.wellnessNeutralNote")}
                </p>
              </SoftPanel>

              {hasEmptyState(summary.emptyStates, "wellness") ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title={t("weeklyReview.wellnessEmptyTitle")}
                  description={t("weeklyReview.wellnessEmptyDescription")}
                />
              ) : null}
            </CollapsibleSection>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PremiumCard className="border-primary/10">
              <div className="p-5 sm:p-6">
                <SectionHeader
                  icon={<Sparkles className="h-5 w-5" />}
                  title={t("weeklyReview.focusObservationsTitle")}
                  description={t("weeklyReview.focusObservationsDescription")}
                  status={<StatusChip tone="neutral">{summary.focusObservations.length}</StatusChip>}
                />
                <div className="mt-5 space-y-3">
                  {summary.focusObservations.map((observation, index) => (
                    <SoftPanel key={`${observation.kind}-${index}`} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip tone={getObservationTone(observation) as "neutral" | "success" | "warning"}>
                          {t(
                            observation.tone === "good-signal"
                              ? "weeklyReview.goodSignal"
                              : observation.tone === "needs-review"
                                ? "weeklyReview.needsReview"
                                : "weeklyReview.awareness"
                          )}
                        </StatusChip>
                        {observation.count !== undefined ? (
                          <StatusChip tone="neutral">{observation.count}</StatusChip>
                        ) : null}
                        {observation.amount !== undefined ? (
                          <StatusChip tone="neutral">{formatAmount(observation.amount)}</StatusChip>
                        ) : null}
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {t(getObservationMessageKey(observation))}
                      </p>
                    </SoftPanel>
                  ))}
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="border-primary/10">
              <div className="p-5 sm:p-6">
                <SectionHeader
                  icon={<ArrowUpRight className="h-5 w-5" />}
                  title={t("weeklyReview.nextFocusTitle")}
                  description={t("weeklyReview.nextFocusDescription")}
                  status={<StatusChip tone="neutral">{summary.suggestedFocus.length}</StatusChip>}
                />
                <div className="mt-5 space-y-3">
                  {summary.suggestedFocus.map((suggestion, index) => (
                    <SoftPanel key={`${suggestion.kind}-${index}`} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip tone="primary">{t("weeklyReview.nextFocusLabel")}</StatusChip>
                        <StatusChip tone="neutral">{t("weeklyReview.localOnlyNote")}</StatusChip>
                      </div>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {t(getFocusMessageKey(suggestion))}
                      </p>
                    </SoftPanel>
                  ))}

                  <div className="grid gap-3 pt-2 sm:flex sm:flex-wrap">
                    {quickLinks.map(({ to, labelKey }) => (
                      <Button key={to} asChild variant="outline" className="w-full justify-start shadow-sm sm:w-auto">
                        <Link to={to}>
                          {t(labelKey)}
                          <ArrowUpRight className="ms-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PremiumCard>
          </div>
        </>
      ) : null}
    </section>
  );
}
