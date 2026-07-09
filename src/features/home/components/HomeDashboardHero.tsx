import {
  BookOpenText,
  Brain,
  CalendarCheck2,
  FolderKanban,
  Inbox,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import { Badge, Card, CardContent } from "@/shared/ui";
import type { HomeDashboardData } from "../types";
import type { ReactNode } from "react";

type HomeDashboardHeroProps = {
  data: HomeDashboardData;
  actions?: ReactNode;
};

const levelLabelKeys = {
  low: "common.low",
  medium: "common.medium",
  good: "common.good",
} as const;

type HeroMetric = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "primary" | "secondary" | "muted";
};

function HeroMetricTile({ icon: Icon, label, value, tone }: HeroMetric) {
  const toneClasses: Record<HeroMetric["tone"], string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-3xl border bg-background/85 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="outline" className="shrink-0">
          {label}
        </Badge>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function HomeDashboardHero({ data, actions }: HomeDashboardHeroProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const todayCount = data.today.tasks.length;
  const completedCount = data.today.completedTaskCount;
  const checkinSummary = data.today.checkin
    ? t("home.checkinSummary", {
        mood: t(levelLabelKeys[data.today.checkin.moodLevel]),
        energy: t(levelLabelKeys[data.today.checkin.energyLevel]),
      })
    : t("home.noCheckin");
  const mitLabel = data.today.mitTask?.title ?? t("home.noMit");

  const heroMetrics: HeroMetric[] = [
    {
      icon: CalendarCheck2,
      label: t("home.todayTasks"),
      value: String(todayCount),
      tone: "primary",
    },
    {
      icon: Inbox,
      label: t("home.unprocessedInbox"),
      value: String(data.inbox.unprocessedCount),
      tone: "secondary",
    },
    {
      icon: FolderKanban,
      label: t("home.activeProjects"),
      value: String(data.projects.activeCount),
      tone: "muted",
    },
    {
      icon: Brain,
      label: t("home.knowledgeItems"),
      value: String(data.knowledge.totalCount),
      tone: "muted",
    },
  ];

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
      <CardContent className="relative p-5 sm:p-6 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-secondary/40 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.3fr_0.95fr] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {formatDate(new Date())}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("home.title")}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[0.95rem]">
                {t("home.description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <CalendarCheck2 className="h-3.5 w-3.5" />
                {t("home.todayTasks")}: {todayCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <Inbox className="h-3.5 w-3.5" />
                {t("home.unprocessedInbox")}: {data.inbox.unprocessedCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <FolderKanban className="h-3.5 w-3.5" />
                {t("home.activeProjects")}: {data.projects.activeCount}
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                <BookOpenText className="h-3.5 w-3.5" />
                {t("home.journalEntries")}: {data.journal.totalCount}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {heroMetrics.map((metric) => (
              <HeroMetricTile key={metric.label} {...metric} />
            ))}

            <div className="rounded-3xl border border-primary/15 bg-background/90 p-4 shadow-sm sm:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("home.todayOverview")}
                  </p>
                  <p className="text-sm font-medium">{t("home.mit")}</p>
                </div>
                <Badge variant={data.today.checkin ? "secondary" : "outline"}>
                  {data.today.completedTaskCount} / {todayCount}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {mitLabel}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {checkinSummary}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
