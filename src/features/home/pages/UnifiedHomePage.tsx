import {
  AlertCircle,
  ArrowUpLeft,
  BookOpenText,
  Brain,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  GraduationCap,
  Inbox,
  ListTodo,
  RotateCcw,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, format } from "date-fns";

import {
  isOnboardingCompleted,
  isOnboardingDismissed,
} from "@/features/onboarding/onboardingStorage";
import { LocalReminderPanel } from "@/features/reminders";
import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";
import { WellnessBadmintonCard } from "@/features/wellness";
import { useDateFormatter } from "@/shared/date";
import { DISPLAY_NAME_STORAGE_KEY } from "@/shared/constants/preferences";
import { useBackupStatus } from "@/shared/hooks";
import { usePersistentString } from "@/shared/hooks/usePersistentString";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { getBackupAgeInDays } from "@/shared/preferences/backupStatus";
import type { Task } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CollapsibleSection,
  MetricCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import { ClearStartCard } from "../components/ClearStartCard";
import { DailyBriefingCard } from "../components/DailyBriefingCard";
import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeManualCard } from "../components/HomeManualCard";
import { HomePersonalMetricsCard } from "../components/HomePersonalMetricsCard";
import { HomePersonalInsightsCard } from "../components/HomePersonalInsightsCard";
import { WelcomeCard } from "../components/WelcomeCard";
import {
  readHomeBackupReminderDismissedUntil,
  shouldShowHomeBackupReminder,
  writeHomeBackupReminderDismissal,
} from "../backupReminder";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";
import type { HomeDashboardData } from "../types";
import type { HomeLearningSnapshot } from "../homeLearningSnapshot";

const quickLinks: ReadonlyArray<{ to: string; labelKey: TranslationKey }> = [
  { to: "/today", labelKey: "home.goToday" },
  { to: "/weekly-review", labelKey: "home.goWeeklyReview" },
  { to: "/decisions", labelKey: "home.goDecisions" },
  { to: "/inbox", labelKey: "home.goInbox" },
  { to: "/projects", labelKey: "home.goProjects" },
  { to: "/goals", labelKey: "home.goGoals" },
  { to: "/journal", labelKey: "home.goJournal" },
  { to: "/knowledge", labelKey: "home.goKnowledge" },
  { to: "/manual", labelKey: "home.goManual" },
  { to: "/settings", labelKey: "home.goSettings" },
];

const taskPriorityRank: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function isActiveTask(task: Task): boolean {
  return task.status === "todo" || task.status === "doing";
}

function compareDecisionTasks(left: Task, right: Task): number {
  const leftTime = left.scheduledStartTime ?? "99:99";
  const rightTime = right.scheduledStartTime ?? "99:99";
  const scheduledTimeOrder = leftTime.localeCompare(rightTime);

  if (scheduledTimeOrder !== 0) {
    return scheduledTimeOrder;
  }

  const priorityOrder =
    taskPriorityRank[left.priority] - taskPriorityRank[right.priority];

  if (priorityOrder !== 0) {
    return priorityOrder;
  }

  return left.createdAt.localeCompare(right.createdAt);
}

function createTodayTaskFocusPath(task: Task): string {
  const searchParams = new URLSearchParams({ focusId: task.id });
  if (task.dueDate) {
    searchParams.set("date", task.dueDate);
  }
  return `/today?${searchParams.toString()}`;
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return <MetricCard icon={icon} label={label} value={<span className="font-mono tabular-nums">{value}</span>} />;
}

function OverviewPanel({ children }: { children: ReactNode }) {
  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-md">
      <CardContent className="space-y-4 p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function TodaySummaryBar({
  data,
  today,
}: {
  data: HomeDashboardData;
  today: Date;
}) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const remainingTaskCount = data.today.tasks.filter(isActiveTask).length;

  return (
    <SoftPanel className="alios-home-context-shelf grid gap-3 border-alios-herb/25 bg-background/90 p-4 shadow-sm md:grid-cols-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 text-alios-herb" aria-hidden="true" />
        <span>
          {t("home.todaySummaryCompleted", {
            count: data.today.completedTaskCount,
          })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <RotateCcw className="h-4 w-4 text-alios-saffron" aria-hidden="true" />
        <span>
          {t("home.todaySummaryRemaining", {
            count: remainingTaskCount,
          })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium md:justify-end">
        <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span>{formatDate(today)}</span>
      </div>
    </SoftPanel>
  );
}

function TodayPreviewCard({ data }: { data: HomeDashboardData }) {
  const { t } = useI18n();
  const activeTasks = [...data.today.tasks]
    .filter(isActiveTask)
    .sort(compareDecisionTasks);
  const previewTasks = activeTasks.slice(0, 3);

  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <SectionHeader
          title={t("home.todayPreviewTitle", { count: activeTasks.length })}
          icon={<ListTodo className="h-5 w-5" aria-hidden="true" />}
        />

        {previewTasks.length > 0 ? (
          <div className="space-y-2">
            {previewTasks.map((task) => (
              <Link
                key={task.id}
                to={createTodayTaskFocusPath(task)}
                className="flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border bg-background/80 px-4 py-3 text-sm shadow-sm transition hover:border-primary/25 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="min-w-0 truncate font-medium">{task.title}</span>
                {task.scheduledStartTime ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.scheduledStartTime}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border bg-background/80 p-4 text-sm text-muted-foreground">
            {t("home.todayPreviewEmpty")}
          </p>
        )}

        <Button asChild variant="outline" className="w-full justify-center">
          <Link to="/today">
            {t("home.viewAllTodayTasks")}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TomorrowCard({
  data,
  tomorrow,
}: {
  data: HomeDashboardData;
  tomorrow: Date;
}) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const tomorrowKey = format(tomorrow, "yyyy-MM-dd");
  const tomorrowTask = data.tasks
    .filter((task) => isActiveTask(task) && task.dueDate === tomorrowKey)
    .sort(compareDecisionTasks)[0];
  const tomorrowPath = tomorrowTask
    ? createTodayTaskFocusPath(tomorrowTask)
    : `/today?${new URLSearchParams({ date: tomorrowKey }).toString()}`;

  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <SectionHeader
          title={t("home.importantTomorrow")}
          description={formatDate(tomorrow)}
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        />

        <p className="rounded-2xl border bg-background/80 p-4 text-sm font-medium leading-6">
          {tomorrowTask?.title ?? t("home.tomorrowEmpty")}
        </p>

        <Button asChild variant="outline" className="w-full justify-center">
          <Link to={tomorrowPath}>
            {t("home.openTomorrowTask")}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function HomeLearningPanel({
  snapshot,
}: {
  snapshot: HomeLearningSnapshot;
}) {
  const { t } = useI18n();

  if (!snapshot.hasAnyData) {
    return null;
  }

  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <SectionHeader
          title={t("home.learningKnowledgeTitle")}
          description={t("home.learningKnowledgeDescription")}
          icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
          status={
            <Badge variant="secondary" className="font-mono tabular-nums">
              {snapshot.activeLearningGoals.length +
                snapshot.inProgressResources.length +
                snapshot.recentKnowledgeItems.length}
            </Badge>
          }
        />

        <div className="grid gap-3 lg:grid-cols-3">
          {snapshot.activeLearningGoals.length > 0 ? (
            <HomeLearningList
              title={t("home.currentlyLearning")}
              items={snapshot.activeLearningGoals.map((goal) => ({
                id: goal.id,
                title: goal.title,
                to: `/goals?${new URLSearchParams({
                  focusId: goal.id,
                }).toString()}`,
              }))}
            />
          ) : null}

          {snapshot.continueLearningResource ? (
            <HomeLearningList
              title={t("home.continueLearning")}
              items={[
                {
                  id: snapshot.continueLearningResource.id,
                  title: snapshot.continueLearningResource.title,
                  meta:
                    snapshot.continueLearningResource.progressPercent !==
                    undefined
                      ? t("resources.progressValue", {
                          count:
                            snapshot.continueLearningResource.progressPercent,
                        })
                      : t("resources.statusInProgress"),
                  to: `/resources/${encodeURIComponent(
                    snapshot.continueLearningResource.id
                  )}`,
                },
              ]}
            />
          ) : null}

          {snapshot.recentKnowledgeItems.length > 0 ? (
            <HomeLearningList
              title={t("home.recentLearningKnowledge")}
              items={snapshot.recentKnowledgeItems.map((item) => ({
                id: item.id,
                title: item.title,
                to: `/knowledge?${new URLSearchParams({
                  focusId: item.id,
                }).toString()}`,
              }))}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HomeLearningList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{
    id: string;
    title: string;
    meta?: string;
    to: string;
  }>;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-background/80 p-4 shadow-sm">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition hover:border-primary/25 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="min-w-0 truncate font-medium">{item.title}</span>
            {item.meta ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.meta}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MoreContext({
  data,
  selectedRoutineTemplateId,
  setSelectedRoutineTemplateId,
}: {
  data: HomeDashboardData;
  selectedRoutineTemplateId: RoutineTemplateId | null;
  setSelectedRoutineTemplateId: (templateId: RoutineTemplateId | null) => void;
}) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [openSections, setOpenSections] = useState<Record<HomeCollapsibleSectionId, boolean>>({
    emptyState: false,
    routineNudge: false,
    wellnessBadminton: false,
    routineTemplates: false,
    upcomingTasks: false,
    calendar: false,
    summaryStats: false,
    personalInsights: false,
    projectsOverview: false,
    journalOverview: false,
    knowledgeOverview: false,
    manualOverview: false,
    quickActions: false,
  });

  const sectionOpenProps = (sectionId: HomeCollapsibleSectionId) => ({
    open: openSections[sectionId],
    onOpenChange: (open: boolean) =>
      setOpenSections((current) => ({
        ...current,
        [sectionId]: open,
      })),
  });

  return (
    <CollapsibleSection
      id="unified-home-more-context"
      title={t("home.moreDashboard")}
      description={t("home.moreDashboardDescription")}
      icon={<SparklesIcon />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">11</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-5"
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-12 xl:items-start">
        <div className="min-w-0 xl:col-span-6">
          <ProjectsOverview data={data} formatDate={formatDate} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <JournalOverview data={data} formatDate={formatDate} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <KnowledgeOverview data={data} formatDate={formatDate} />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <HomeManualCard
            data={data}
            sectionId="manualOverview"
            {...sectionOpenProps("manualOverview")}
          />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <HomePersonalMetricsCard metrics={data.personalMetrics} />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <SummaryStats data={data} />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <HomePersonalInsightsCard
            data={data}
            sectionId="personalInsights"
            {...sectionOpenProps("personalInsights")}
          />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <WellnessBadmintonCard
            id="unified-home-wellnessBadminton"
            onOpenRoutineTemplate={setSelectedRoutineTemplateId}
            {...sectionOpenProps("wellnessBadminton")}
          />
        </div>
        <div className="min-w-0 xl:col-span-6">
          <RoutineTemplatesCard
            id="unified-home-routineTemplates"
            selectedTemplateId={selectedRoutineTemplateId}
            onSelectTemplate={setSelectedRoutineTemplateId}
            {...sectionOpenProps("routineTemplates")}
          />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <QuickActions />
        </div>
        <div className="min-w-0 xl:col-span-12">
          <HomeCalendarCard
            tasks={data.tasks}
            sectionId="calendar"
            {...sectionOpenProps("calendar")}
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}

function SparklesIcon() {
  return <Target className="h-5 w-5" aria-hidden="true" />;
}

function ProjectsOverview({
  data,
  formatDate,
}: {
  data: HomeDashboardData;
  formatDate: (value: string | Date) => string;
}) {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-projectsOverview"
      title={t("home.projectsOverview")}
      description={`${t("home.activeProjects")}: ${data.projects.activeCount} / ${data.projects.totalCount}`}
      icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">{data.projects.totalCount}</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      <OverviewPanel>
        <p className="text-sm font-medium">{t("home.recentProjects")}</p>
        {data.projects.recent.length ? (
          <div className="space-y-3">
            {data.projects.recent.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-3xl border bg-background/90 px-4 py-3 shadow-sm"
              >
                <span className="min-w-0 truncate text-sm font-medium">{project.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t("home.updated", { date: formatDate(project.updatedAt) })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("home.noRecentProjects")}</p>
        )}
      </OverviewPanel>
    </CollapsibleSection>
  );
}

function JournalOverview({
  data,
  formatDate,
}: {
  data: HomeDashboardData;
  formatDate: (value: string | Date) => string;
}) {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-journalOverview"
      title={t("home.journalOverview")}
      description={`${t("home.journalEntries")}: ${data.journal.totalCount}`}
      icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">{data.journal.totalCount}</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      <OverviewPanel>
        <p className="text-sm font-medium">{t("home.latestJournal")}</p>
        {data.journal.latest ? (
          <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
            <p className="font-medium">{data.journal.latest.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(data.journal.latest.date)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("home.noJournal")}</p>
        )}
      </OverviewPanel>
    </CollapsibleSection>
  );
}

function KnowledgeOverview({
  data,
  formatDate,
}: {
  data: HomeDashboardData;
  formatDate: (value: string | Date) => string;
}) {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-knowledgeOverview"
      title={t("home.knowledgeOverview")}
      description={`${t("home.knowledgeItems")}: ${data.knowledge.totalCount}`}
      icon={<Brain className="h-5 w-5" aria-hidden="true" />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">{data.knowledge.totalCount}</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      <OverviewPanel>
        <p className="text-sm font-medium">{t("home.latestKnowledge")}</p>
        {data.knowledge.latest ? (
          <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
            <p className="font-medium">{data.knowledge.latest.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.updated", { date: formatDate(data.knowledge.latest.updatedAt) })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("home.noKnowledge")}</p>
        )}
      </OverviewPanel>
    </CollapsibleSection>
  );
}

function SummaryStats({ data }: { data: HomeDashboardData }) {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-summaryStats"
      title={t("home.sectionSummaryStats")}
      icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">5</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />}
          label={t("home.todayTasks")}
          value={data.today.tasks.length}
        />
        <SummaryCard
          icon={<Inbox className="h-5 w-5" aria-hidden="true" />}
          label={t("home.unprocessedInbox")}
          value={data.inbox.unprocessedCount}
        />
        <SummaryCard
          icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
          label={t("home.totalProjects")}
          value={data.projects.totalCount}
        />
        <SummaryCard
          icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
          label={t("home.journalEntries")}
          value={data.journal.totalCount}
        />
        <SummaryCard
          icon={<Brain className="h-5 w-5" aria-hidden="true" />}
          label={t("home.knowledgeItems")}
          value={data.knowledge.totalCount}
        />
        <SummaryCard
          icon={<Target className="h-5 w-5" aria-hidden="true" />}
          label={t("home.goals")}
          value={data.goals.activeCount}
        />
      </div>
    </CollapsibleSection>
  );
}

function QuickActions() {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-quickActions"
      title={t("home.quickActions")}
      icon={<ArrowUpLeft className="h-5 w-5" aria-hidden="true" />}
      status={<Badge variant="secondary" className="font-mono tabular-nums">{quickLinks.length}</Badge>}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        {quickLinks.map(({ to, labelKey }) => (
          <Button key={to} asChild variant="outline" className="w-full justify-start shadow-sm sm:w-auto">
            <Link to={to}>
              {t(labelKey)}
              <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export function UnifiedHomePage() {
  const { t } = useI18n();
  const { freshness: backupFreshness, status: backupStatus } = useBackupStatus();
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const { value: displayName } = usePersistentString({
    key: DISPLAY_NAME_STORAGE_KEY,
    defaultValue: "",
  });
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const onboardingState = isOnboardingCompleted()
    ? "completed"
    : isOnboardingDismissed()
      ? "dismissed"
      : "pending";
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);
  const [backupReminderDismissedUntil, setBackupReminderDismissedUntil] =
    useState(() => readHomeBackupReminderDismissedUntil());

  const showBackupReminder =
    !isLoading &&
    !hasError &&
    shouldShowHomeBackupReminder({
      lastBackupAt: backupStatus?.lastBackupAt,
      dismissedUntil: backupReminderDismissedUntil,
    });
  const backupAgeInDays = getBackupAgeInDays(backupStatus?.lastBackupAt);
  const backupReminderBody =
    backupAgeInDays === null
      ? t("home.backupReminderNever")
      : t("home.backupReminderDaysAgo", { count: backupAgeInDays });
  const showEveningBriefing =
    today.getHours() >= 18 && (data?.today.tasks.length ?? 0) > 0;

  if (!data && !isLoading && !hasError) {
    return null;
  }

  return (
    <section className="alios-page alios-home-page space-y-5 lg:space-y-6">
      {hasError ? (
        <div
          role="alert"
          className="alios-status-danger flex flex-col gap-3 rounded-[1.5rem] border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t("home.loadError")}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadDashboard()}
          >
            <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-label={t("home.loading")}>
          <div className="h-72 animate-pulse rounded-[2rem] border border-alios-saffron/20 bg-gradient-to-br from-alios-paper via-muted/55 to-muted/70 shadow-sm dark:from-alios-night" />
          <div className="h-96 animate-pulse rounded-[2rem] border border-alios-saffron/20 bg-gradient-to-br from-alios-paper via-muted/50 to-muted/65 shadow-sm dark:from-alios-night" />
        </div>
      ) : data ? (
        <>
          <ClearStartCard data={data} />
          {showBackupReminder ? (
            <SoftPanel className="flex flex-col gap-3 border-alios-saffron/30 bg-gradient-to-l from-alios-saffron/10 via-background to-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-alios-saffron/30 bg-alios-saffron/15 text-alios-caspian dark:text-alios-paper">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-6">{t("home.backupReminderTitle")}</p>
                    <StatusChip>
                      {t(
                        backupFreshness === "never"
                          ? "settings.backupStatusNever"
                          : "settings.backupStatusOverdue"
                      )}
                    </StatusChip>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {backupReminderBody}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
                  <Link to="/settings#settings-backup-restore">{t("home.backupReminderAction")}</Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={() => {
                    setBackupReminderDismissedUntil(writeHomeBackupReminderDismissal());
                  }}
                >
                  <X className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("home.backupReminderDismiss")}
                </Button>
              </div>
            </SoftPanel>
          ) : null}
          {data.isEmpty ? (
            <WelcomeCard
              key={onboardingState}
              displayName={displayName}
            />
          ) : null}
          <TodaySummaryBar data={data} today={today} />
          <div className="grid gap-5 xl:grid-cols-2">
            <TodayPreviewCard data={data} />
            <LocalReminderPanel snapshot={data.reminderSnapshot} />
          </div>
          <TomorrowCard data={data} tomorrow={tomorrow} />
          <HomeLearningPanel snapshot={data.learningSnapshot} />
          {showEveningBriefing ? <DailyBriefingCard data={data} /> : null}
          <MoreContext
            data={data}
            selectedRoutineTemplateId={selectedRoutineTemplateId}
            setSelectedRoutineTemplateId={setSelectedRoutineTemplateId}
          />
        </>
      ) : null}
    </section>
  );
}
