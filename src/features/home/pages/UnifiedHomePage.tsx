import {
  AlertCircle,
  ArrowUpLeft,
  BookOpenText,
  Brain,
  CalendarCheck2,
  CalendarDays,
  FolderKanban,
  Inbox,
  RotateCcw,
  ShieldCheck,
  Target,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, isValid, parseISO } from "date-fns";

import { TodayWorkspace } from "@/features/today/components/TodayWorkspace";
import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";
import { WellnessBadmintonCard } from "@/features/wellness";
import { useDateFormatter } from "@/shared/date";
import { useBackupStatus } from "@/shared/hooks";
import { useI18n, type TranslationKey } from "@/shared/i18n";
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
import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeManualCard } from "../components/HomeManualCard";
import { HomePersonalInsightsCard } from "../components/HomePersonalInsightsCard";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";
import type { HomeDashboardData } from "../types";

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

function getRequestedToday(searchParams: URLSearchParams) {
  const requestedDate = searchParams.get("date");
  const requestedDateValue = requestedDate ? parseISO(requestedDate) : undefined;

  return requestedDate && requestedDateValue && isValid(requestedDateValue)
    ? format(requestedDateValue, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
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

function TodayContextStrip({ inboxCount }: { inboxCount: number }) {
  const { t } = useI18n();

  return (
    <CollapsibleSection
      id="unified-home-today-context"
      title={t("home.todayContextTitle")}
      description={t("home.todayContextDescription")}
      icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      status={
        <span className="flex flex-wrap items-center justify-end gap-2">
          <StatusChip tone={inboxCount > 0 ? "warning" : "neutral"} className="alios-home-thread-marker">
            <span className="font-mono tabular-nums">{inboxCount}</span> {t("nav.inbox")}
          </StatusChip>
          <Badge variant="outline" className="alios-home-thread-marker">
            {t("weeklyReview.title")}
          </Badge>
        </span>
      }
      className="alios-home-thread-continuation alios-home-context-shelf overflow-hidden shadow-sm"
    >
      <div className="grid gap-2 sm:grid-cols-3 md:flex md:justify-end">
        <Button asChild variant="outline" className="w-full md:w-auto">
          <Link to="/calendar">
            {t("nav.calendar")}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="alios-home-thread-marker w-full md:w-auto">
          <Link to="/inbox">
            {t("nav.inbox")}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="alios-home-thread-marker w-full md:w-auto">
          <Link to="/weekly-review">
            {t("weeklyReview.title")}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </CollapsibleSection>
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
      status={<Badge variant="secondary" className="font-mono tabular-nums">10</Badge>}
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
  const { freshness: backupFreshness } = useBackupStatus();
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const [searchParams] = useSearchParams();
  const today = getRequestedToday(searchParams);
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);

  const showBackupReminder =
    !isLoading &&
    !hasError &&
    (backupFreshness === "never" || backupFreshness === "overdue");
  const backupReminderBodyKey =
    backupFreshness === "never"
      ? "home.backupReminderNever"
      : "home.backupReminderOverdue";

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
                {t(backupReminderBodyKey)}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
            <Link to="/settings">{t("home.backupReminderAction")}</Link>
          </Button>
        </SoftPanel>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-label={t("home.loading")}>
          <div className="h-72 animate-pulse rounded-[2rem] border border-alios-saffron/20 bg-gradient-to-br from-alios-paper via-muted/55 to-muted/70 shadow-sm dark:from-alios-night" />
          <div className="h-96 animate-pulse rounded-[2rem] border border-alios-saffron/20 bg-gradient-to-br from-alios-paper via-muted/50 to-muted/65 shadow-sm dark:from-alios-night" />
        </div>
      ) : data ? (
        <>
          <ClearStartCard data={data} />
          <TodayContextStrip inboxCount={data.inbox.unprocessedCount} />
          <TodayWorkspace
            today={today}
            focusId={searchParams.get("focusId")}
            goalId={searchParams.get("goalId")}
            hideEmptyTaskState
            hideHero
            hideTaskSummaryHeader
            projectId={searchParams.get("projectId")}
            routineId={searchParams.get("routineId")}
          />
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
