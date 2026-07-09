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
  SlidersHorizontal,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Level3 } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  MetricCard,
} from "@/shared/ui";

import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeDashboardCustomizer } from "../components/HomeDashboardCustomizer";
import { HomeDashboardHero } from "../components/HomeDashboardHero";
import { HomePersonalInsightsCard } from "../components/HomePersonalInsightsCard";
import { HomeRoutineNudgeCard } from "../components/HomeRoutineNudgeCard";
import { HomeUpcomingTasksCard } from "../components/HomeUpcomingTasksCard";
import {
  getVisibleDashboardSections,
  type HomeDashboardSectionId,
} from "../dashboardLayout";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import { useHomeDashboardLayout } from "../hooks/useHomeDashboardLayout";
import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";
import { WellnessBadmintonCard } from "@/features/wellness";

const quickLinks: ReadonlyArray<{ to: string; labelKey: TranslationKey }> = [
  { to: "/today", labelKey: "home.goToday" },
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

export function HomePage() {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const {
    layout,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    resetLayout,
  } = useHomeDashboardLayout();
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const visibleSectionIds = getVisibleDashboardSections(layout);

  if (!data && !isLoading && !hasError) {
    return null;
  }

  const sectionContent: Record<HomeDashboardSectionId, ReactNode | null> = {
    hero: data ? (
      <HomeDashboardHero data={data} />
    ) : null,
    emptyState:
      data && data.isEmpty ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title={t("home.emptyTitle")}
          description={t("home.emptyDescription")}
        />
      ) : null,
    routineNudge: data ? (
      <HomeRoutineNudgeCard onViewRoutine={setSelectedRoutineTemplateId} />
    ) : null,
    wellnessBadminton: data ? (
      <WellnessBadmintonCard
        onOpenRoutineTemplate={setSelectedRoutineTemplateId}
      />
    ) : null,
    routineTemplates: data ? (
      <RoutineTemplatesCard
        selectedTemplateId={selectedRoutineTemplateId}
        onSelectTemplate={setSelectedRoutineTemplateId}
      />
    ) : null,
    upcomingTasks: data ? (
      <HomeUpcomingTasksCard tasks={data.tasks} />
    ) : null,
    calendar: data ? <HomeCalendarCard tasks={data.tasks} /> : null,
    summaryStats: data ? (
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
    ) : null,
    personalInsights: data ? <HomePersonalInsightsCard data={data} /> : null,
    projectsOverview: data ? (
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
          <CardTitle>{t("home.projectsOverview")}</CardTitle>
          <CardDescription>
            {t("home.activeProjects")}: {data.projects.activeCount} /{" "}
            {data.projects.totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
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
            <p className="text-sm text-muted-foreground">
              {t("home.noRecentProjects")}
            </p>
          )}
        </CardContent>
      </Card>
    ) : null,
    journalOverview: data ? (
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
          <CardTitle>{t("home.journalOverview")}</CardTitle>
          <CardDescription>
            {t("home.journalEntries")}: {data.journal.totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm font-medium">{t("home.latestJournal")}</p>
          {data.journal.latest ? (
            <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
              <p className="font-medium">{data.journal.latest.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(data.journal.latest.date)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("home.noJournal")}
            </p>
          )}
        </CardContent>
      </Card>
    ) : null,
    knowledgeOverview: data ? (
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
          <CardTitle>{t("home.knowledgeOverview")}</CardTitle>
          <CardDescription>
            {t("home.knowledgeItems")}: {data.knowledge.totalCount}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
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
            <p className="text-sm text-muted-foreground">
              {t("home.noKnowledge")}
            </p>
          )}
        </CardContent>
      </Card>
    ) : null,
    quickActions: (
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
          <CardTitle>{t("home.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-5">
          {quickLinks.map(({ to, labelKey }) => (
            <Button key={to} asChild variant="outline" className="shadow-sm">
              <Link to={to}>
                {t(labelKey)}
                <ArrowUpLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    ),
  };

  const renderedSections = visibleSectionIds
    .map((sectionId) => ({
      sectionId,
      content: sectionContent[sectionId],
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
          <div className="flex flex-col gap-3 rounded-3xl border bg-card/85 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{t("home.homeLayout")}</p>
                <Badge variant="secondary">
                  {t("home.localOnlyDashboardPreference")}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("home.customizeDashboardDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant={customizerOpen ? "secondary" : "outline"}
              size="sm"
              aria-expanded={customizerOpen}
              aria-controls="home-dashboard-customizer"
              onClick={() => setCustomizerOpen((currentValue) => !currentValue)}
            >
              <SlidersHorizontal className="me-2 h-4 w-4" />
              {t("home.customizeDashboard")}
            </Button>
          </div>

          {renderedSections[0]?.content ?? null}
          {customizerOpen ? (
            <HomeDashboardCustomizer
              layout={layout}
              onMoveUp={moveSectionUp}
              onMoveDown={moveSectionDown}
              onToggleVisibility={toggleSectionVisibility}
              onReset={resetLayout}
            />
          ) : null}
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
