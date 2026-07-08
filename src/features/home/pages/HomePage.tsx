import {
  AlertCircle,
  ArrowUpLeft,
  BookOpenText,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  FolderKanban,
  Inbox,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
import type { Level3 } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { HomeCalendarCard } from "../components/HomeCalendarCard";
import { HomeRoutineNudgeCard } from "../components/HomeRoutineNudgeCard";
import { HomeUpcomingTasksCard } from "../components/HomeUpcomingTasksCard";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import { RoutineTemplatesCard, type RoutineTemplateId } from "@/features/routines";

const levelLabelKeys: Record<Level3, TranslationKey> = {
  low: "common.low",
  medium: "common.medium",
  good: "common.good",
};

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
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const { data, isLoading, hasError, loadDashboard } = useHomeDashboard();
  const [selectedRoutineTemplateId, setSelectedRoutineTemplateId] =
    useState<RoutineTemplateId | null>(null);

  return (
    <section className="alios-page space-y-6">
      <div className="alios-page-header">
        <h2 className="alios-page-title">{t("home.title")}</h2>
        <p className="alios-page-description">{t("home.description")}</p>
      </div>

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
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label={t("home.loading")}
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : data ? (
        <>
          {data.isEmpty ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{t("home.emptyTitle")}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                  {t("home.emptyDescription")}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <HomeRoutineNudgeCard
            onViewRoutine={setSelectedRoutineTemplateId}
          />

          <RoutineTemplatesCard
            selectedTemplateId={selectedRoutineTemplateId}
            onSelectTemplate={setSelectedRoutineTemplateId}
          />

          <HomeUpcomingTasksCard tasks={data.tasks} />

          <HomeCalendarCard tasks={data.tasks} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("home.todayOverview")}</CardTitle>
                <CardDescription>
                  {t("home.completedTasks")}: {data.today.completedTaskCount} /{" "}
                  {data.today.tasks.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-4">
                  <p className="mb-1 text-sm font-medium">{t("home.mit")}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.today.mitTask?.title ?? t("home.noMit")}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="mb-2 text-sm font-medium">
                    {t("home.dailyCheckin")}
                  </p>
                  {data.today.checkin ? (
                    <Badge variant="secondary">
                      {t("home.checkinSummary", {
                        mood: t(levelLabelKeys[data.today.checkin.moodLevel]),
                        energy: t(levelLabelKeys[data.today.checkin.energyLevel]),
                      })}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("home.noCheckin")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("home.projectsOverview")}</CardTitle>
                <CardDescription>
                  {t("home.activeProjects")}: {data.projects.activeCount} /{" "}
                  {data.projects.totalCount}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm font-medium">
                  {t("home.recentProjects")}
                </p>
                {data.projects.recent.length ? (
                  <div className="space-y-3">
                    {data.projects.recent.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
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

            <Card>
              <CardHeader>
                <CardTitle>{t("home.journalOverview")}</CardTitle>
                <CardDescription>
                  {t("home.journalEntries")}: {data.journal.totalCount}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium">
                  {t("home.latestJournal")}
                </p>
                {data.journal.latest ? (
                  <div className="rounded-xl border p-4">
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

            <Card>
              <CardHeader>
                <CardTitle>{t("home.knowledgeOverview")}</CardTitle>
                <CardDescription>
                  {t("home.knowledgeItems")}: {data.knowledge.totalCount}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium">
                  {t("home.latestKnowledge")}
                </p>
                {data.knowledge.latest ? (
                  <div className="rounded-xl border p-4">
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("home.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {quickLinks.map(({ to, labelKey }) => (
                <Button key={to} asChild variant="outline">
                  <Link to={to}>
                    {t(labelKey)}
                    <ArrowUpLeft className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}
