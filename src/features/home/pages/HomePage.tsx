import {
  AlertCircle,
  ArrowUpLeft,
  BookOpenText,
  Brain,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Inbox,
  Target,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useBackupStatus } from "@/shared/hooks";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  EmptyState,
  MetricCard,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";
import { WellnessBadmintonCard } from "@/features/wellness";
import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeDashboardHero } from "../components/HomeDashboardHero";
import { HomeManualCard } from "../components/HomeManualCard";
import { HomePersonalInsightsCard } from "../components/HomePersonalInsightsCard";
import { HomeRoutineNudgeCard } from "../components/HomeRoutineNudgeCard";
import { HomeUpcomingTasksCard } from "../components/HomeUpcomingTasksCard";
import { getVisibleDashboardSections, type HomeDashboardSectionId } from "../dashboardLayout";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import { useHomeDashboardLayout } from "../hooks/useHomeDashboardLayout";
import { useHomeCollapsedSections } from "../hooks/useHomeCollapsedSections";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";

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

const desktopSectionSpans: Record<HomeDashboardSectionId, string> = {
  hero: "xl:col-span-12",
  emptyState: "xl:col-span-12",
  routineNudge: "xl:col-span-12",
  wellnessBadminton: "xl:col-span-6",
  routineTemplates: "xl:col-span-6",
  upcomingTasks: "xl:col-span-8",
  calendar: "xl:col-span-4",
  summaryStats: "xl:col-span-12",
  personalInsights: "xl:col-span-12",
  projectsOverview: "xl:col-span-6",
  journalOverview: "xl:col-span-6",
  knowledgeOverview: "xl:col-span-6",
  manualOverview: "xl:col-span-6",
  quickActions: "xl:col-span-12",
};

const primaryDashboardSectionIds = new Set<HomeDashboardSectionId>([
  "emptyState",
  "routineNudge",
  "upcomingTasks",
  "calendar",
  "personalInsights",
]);

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
};

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return <MetricCard icon={icon} label={label} value={value} />;
}

function OverviewPanel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const { freshness: backupFreshness } = useBackupStatus();
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const { layout } = useHomeDashboardLayout();
  const { isSectionCollapsed, setSectionOpen } = useHomeCollapsedSections();
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);
  const [secondarySectionsOpen, setSecondarySectionsOpen] = useState(false);

  const visibleSectionIds = getVisibleDashboardSections(layout);
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

  const sectionOpenProps = (sectionId: HomeCollapsibleSectionId) => ({
    open: !isSectionCollapsed(sectionId),
    onOpenChange: (open: boolean) => setSectionOpen(sectionId, open),
  });

  const sectionNodes: Record<HomeDashboardSectionId, ReactNode | null> = {
    hero: data ? <HomeDashboardHero data={data} /> : null,
    emptyState:
      data && data.isEmpty ? (
        <CollapsibleSection
          id="home-emptyState"
          title={t("home.sectionEmptyState")}
          description={t("home.emptyDescription")}
          icon={<Sparkles className="h-5 w-5" />}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
          contentClassName="space-y-4"
          {...sectionOpenProps("emptyState")}
        >
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title={t("home.emptyTitle")}
          description={t("home.emptyDescription")}
          note={t("home.emptyNote")}
          actions={
            <>
              <Button asChild variant="default">
                <Link to="/inbox">{t("nav.inbox")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/finance">{t("nav.finance")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/decisions">{t("nav.decisions")}</Link>
              </Button>
            </>
          }
        />
      </CollapsibleSection>
    ) : null,
    routineNudge: data ? (
      <HomeRoutineNudgeCard
        id="home-routineNudge"
        sectionId="routineNudge"
        onViewRoutine={setSelectedRoutineTemplateId}
        {...sectionOpenProps("routineNudge")}
      />
    ) : null,
    wellnessBadminton: data ? (
      <WellnessBadmintonCard
        id="home-wellnessBadminton"
        onOpenRoutineTemplate={setSelectedRoutineTemplateId}
        {...sectionOpenProps("wellnessBadminton")}
      />
    ) : null,
    routineTemplates: data ? (
      <RoutineTemplatesCard
        id="home-routineTemplates"
        selectedTemplateId={selectedRoutineTemplateId}
        onSelectTemplate={setSelectedRoutineTemplateId}
        {...sectionOpenProps("routineTemplates")}
      />
    ) : null,
    upcomingTasks: data ? (
      <HomeUpcomingTasksCard
        tasks={data.tasks}
        sectionId="upcomingTasks"
        {...sectionOpenProps("upcomingTasks")}
      />
    ) : null,
    calendar: data ? (
      <HomeCalendarCard
        tasks={data.tasks}
        sectionId="calendar"
        {...sectionOpenProps("calendar")}
      />
    ) : null,
    summaryStats: data ? (
      <CollapsibleSection
        id="home-summaryStats"
        title={t("home.sectionSummaryStats")}
        icon={<CalendarCheck2 className="h-5 w-5" />}
        status={<Badge variant="secondary">5</Badge>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
        contentClassName="space-y-4"
        {...sectionOpenProps("summaryStats")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            icon={<CalendarCheck2 className="h-5 w-5" />}
            label={t("home.todayTasks")}
            value={data.today.tasks.length}
          />
          <SummaryCard
            icon={<Inbox className="h-5 w-5" />}
            label={t("home.unprocessedInbox")}
            value={data.inbox.unprocessedCount}
          />
          <SummaryCard
            icon={<FolderKanban className="h-5 w-5" />}
            label={t("home.totalProjects")}
            value={data.projects.totalCount}
          />
          <SummaryCard
            icon={<BookOpenText className="h-5 w-5" />}
            label={t("home.journalEntries")}
            value={data.journal.totalCount}
          />
          <SummaryCard
            icon={<Brain className="h-5 w-5" />}
            label={t("home.knowledgeItems")}
            value={data.knowledge.totalCount}
          />
          <SummaryCard
            icon={<Target className="h-5 w-5" />}
            label={t("home.goals")}
            value={data.goals.activeCount}
          />
        </div>
      </CollapsibleSection>
    ) : null,
    personalInsights: data ? (
      <HomePersonalInsightsCard
        data={data}
        sectionId="personalInsights"
        {...sectionOpenProps("personalInsights")}
      />
    ) : null,
    projectsOverview: data ? (
      <CollapsibleSection
        id="home-projectsOverview"
        title={t("home.projectsOverview")}
        description={`${t("home.activeProjects")}: ${data.projects.activeCount} / ${data.projects.totalCount}`}
        icon={<FolderKanban className="h-5 w-5" />}
        status={<Badge variant="secondary">{data.projects.totalCount}</Badge>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
        contentClassName="space-y-4"
      {...sectionOpenProps("projectsOverview")}
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
                  <span className="min-w-0 truncate text-sm font-medium">
                    {project.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t("home.updated", {
                      date: formatDate(project.updatedAt),
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("home.noRecentProjects")}</p>
          )}
        </OverviewPanel>
      </CollapsibleSection>
    ) : null,
    journalOverview: data ? (
      <CollapsibleSection
        id="home-journalOverview"
        title={t("home.journalOverview")}
        description={`${t("home.journalEntries")}: ${data.journal.totalCount}`}
        icon={<BookOpenText className="h-5 w-5" />}
        status={<Badge variant="secondary">{data.journal.totalCount}</Badge>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
        contentClassName="space-y-4"
      {...sectionOpenProps("journalOverview")}
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
    ) : null,
    knowledgeOverview: data ? (
      <CollapsibleSection
        id="home-knowledgeOverview"
        title={t("home.knowledgeOverview")}
        description={`${t("home.knowledgeItems")}: ${data.knowledge.totalCount}`}
        icon={<Brain className="h-5 w-5" />}
        status={<Badge variant="secondary">{data.knowledge.totalCount}</Badge>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
        contentClassName="space-y-4"
      {...sectionOpenProps("knowledgeOverview")}
      >
        <OverviewPanel>
          <p className="text-sm font-medium">{t("home.latestKnowledge")}</p>
          {data.knowledge.latest ? (
            <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
              <p className="font-medium">{data.knowledge.latest.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("home.updated", {
                  date: formatDate(data.knowledge.latest.updatedAt),
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("home.noKnowledge")}</p>
          )}
        </OverviewPanel>
      </CollapsibleSection>
    ) : null,
    manualOverview: data ? (
      <HomeManualCard
        data={data}
        sectionId="manualOverview"
        {...sectionOpenProps("manualOverview")}
      />
    ) : null,
    quickActions: (
      <CollapsibleSection
        id="home-quickActions"
        title={t("home.quickActions")}
        icon={<ArrowUpLeft className="h-5 w-5" />}
        status={<Badge variant="secondary">{quickLinks.length}</Badge>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
        contentClassName="space-y-4"
        {...sectionOpenProps("quickActions")}
      >
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          {quickLinks.map(({ to, labelKey }) => (
            <Button key={to} asChild variant="outline" className="w-full justify-start shadow-sm sm:w-auto">
              <Link to={to}>
                {t(labelKey)}
                <ArrowUpLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          ))}
        </div>
      </CollapsibleSection>
    ),
  };

  const renderedSections = visibleSectionIds
    .map((sectionId) => ({
      sectionId,
      content: sectionNodes[sectionId],
    }))
    .filter(
      (
        section
      ): section is {
        sectionId: HomeDashboardSectionId;
        content: ReactNode;
      } => Boolean(section.content)
    );

  const heroSection = renderedSections.find(
    (section) => section.sectionId === "hero"
  );
  const dashboardSections = renderedSections.filter(
    (section) => section.sectionId !== "hero"
  );
  const primaryDashboardSections = dashboardSections.filter((section) =>
    primaryDashboardSectionIds.has(section.sectionId)
  );
  const secondaryDashboardSections = dashboardSections.filter(
    (section) => !primaryDashboardSectionIds.has(section.sectionId)
  );

  return (
    <section className="alios-page space-y-5 lg:space-y-6">
      {hasError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("home.loadError")}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void loadDashboard()}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {showBackupReminder ? (
        <SoftPanel className="flex flex-col gap-3 border-primary/10 bg-gradient-to-l from-primary/5 via-background to-background p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
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
          <div className="h-64 animate-pulse rounded-[2rem] border bg-muted/60" />
          <div className="h-56 animate-pulse rounded-[2rem] border bg-muted/60" />
          <div className="grid gap-4 xl:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-[2rem] border bg-muted/60"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-[2rem] border bg-muted/60" />
        </div>
      ) : data ? (
        <>
          {heroSection?.content ?? null}
          <section className="space-y-4 sm:space-y-5" aria-label={t("home.todayOverview")}>
            <div className="flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-lg font-semibold tracking-tight sm:text-xl">
                  {t("home.todayOverview")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("home.primaryDashboardDescription")}
                </p>
              </div>
            </div>
            <div className="grid min-w-0 gap-5 xl:grid-cols-12 xl:items-start">
              {primaryDashboardSections.map((section) => (
                <div
                  key={section.sectionId}
                  className={`min-w-0 ${desktopSectionSpans[section.sectionId]}`}
                >
                  {section.content}
                </div>
              ))}
            </div>
          </section>
          {secondaryDashboardSections.length ? (
            <Card className="overflow-hidden border-primary/15 bg-card shadow-sm">
              <CardHeader className="gap-4 border-b border-primary/10 bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg">{t("home.moreDashboard")}</CardTitle>
                  <CardDescription>{t("home.moreDashboardDescription")}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => setSecondarySectionsOpen((currentValue) => !currentValue)}
                  aria-expanded={secondarySectionsOpen}
                >
                  {secondarySectionsOpen
                    ? t("common.collapseSection")
                    : t("common.expandSection")}
                  {secondarySectionsOpen ? (
                    <ChevronUp className="ms-2 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="ms-2 h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </CardHeader>
              {secondarySectionsOpen ? (
                <CardContent className="p-4 sm:p-6">
                  <div className="grid min-w-0 gap-5 xl:grid-cols-12 xl:items-start">
                    {secondaryDashboardSections.map((section) => (
                      <div
                        key={section.sectionId}
                        className={`min-w-0 ${desktopSectionSpans[section.sectionId]}`}
                      >
                        {section.content}
                      </div>
                    ))}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
