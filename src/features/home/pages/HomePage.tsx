import {
  AlertCircle,
  ArrowUpLeft,
  BookOpenText,
  Brain,
  CalendarCheck2,
  FolderKanban,
  Inbox,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CollapsibleSection,
  EmptyState,
  MetricCard,
} from "@/shared/ui";

import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";
import { WellnessBadmintonCard } from "@/features/wellness";
import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeDashboardHero } from "../components/HomeDashboardHero";
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
  { to: "/journal", labelKey: "home.goJournal" },
  { to: "/knowledge", labelKey: "home.goKnowledge" },
  { to: "/settings", labelKey: "home.goSettings" },
];

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
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const { layout } = useHomeDashboardLayout();
  const { isSectionCollapsed, setSectionOpen } = useHomeCollapsedSections();
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);

  const visibleSectionIds = getVisibleDashboardSections(layout);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

  return (
    <section className="alios-page space-y-8">
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
          {renderedSections[0]?.content ?? null}
          {renderedSections.slice(1).map(({ sectionId, content }) => (
            <div key={sectionId} className="min-w-0">
              {content}
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}
