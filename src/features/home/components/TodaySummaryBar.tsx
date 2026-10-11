import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import { SoftPanel } from "@/shared/ui";
import { cn } from "@/shared/utils";

import type { HomeDashboardData } from "../types";

type TodaySummaryBarProps = {
  data: HomeDashboardData;
  today: Date;
};

type SummaryMetric = {
  icon: LucideIcon;
  value: string | number;
  labelKey: TranslationKey;
  labelValues?: Record<string, string | number>;
  to: string;
  tone: "success" | "warning" | "neutral";
};

function isActiveTask(task: Task): boolean {
  return task.status === "todo" || task.status === "doing";
}

function getProgressTone(progress: number | null): SummaryMetric["tone"] {
  if (progress === null || progress < 40) {
    return "neutral";
  }

  return progress >= 80 ? "success" : "warning";
}

function getIconClassName(tone: SummaryMetric["tone"]) {
  return cn(
    "h-5 w-5",
    tone === "success" && "text-alios-herb",
    tone === "warning" && "text-alios-saffron",
    tone === "neutral" && "text-muted-foreground"
  );
}

export function TodaySummaryBar({ data, today }: TodaySummaryBarProps) {
  const { language, t } = useI18n();
  const completedTaskCount = data.today.completedTaskCount;
  const remainingTaskCount = data.today.tasks.filter(isActiveTask).length;
  const attentionCount =
    (data.lifeAreas?.highAttentionActiveCount ?? 0) +
    (data.goals?.reviewDueCount ?? 0);
  const totalTaskCount = completedTaskCount + remainingTaskCount;
  const progressPercent =
    totalTaskCount === 0
      ? null
      : Math.round((completedTaskCount / totalTaskCount) * 100);
  const progressValue =
    progressPercent === null
      ? "—"
      : `${new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US").format(
          progressPercent
        )}${language === "fa" ? "٪" : "%"}`;
  void today;
  // TODO: HomeDashboardData.today.tasks is scoped to today's tasks, so this
  // bar cannot count tomorrow's tasks without a broader dashboard fetch.
  const tomorrowTaskValue = "--";

  const metrics: SummaryMetric[] = [
    {
      icon: CheckCircle2,
      value: completedTaskCount,
      labelKey: "home.todaySummaryCompleted",
      labelValues: { count: completedTaskCount },
      to: "/today",
      tone: completedTaskCount > 0 ? "success" : "neutral",
    },
    {
      icon: AlertTriangle,
      value: attentionCount,
      labelKey: "home.todaySummaryAttention",
      to: "/today",
      tone: attentionCount > 0 ? "warning" : "neutral",
    },
    {
      icon: CalendarDays,
      value: tomorrowTaskValue,
      labelKey: "home.todaySummaryTomorrow",
      to: "/today",
      tone: "neutral",
    },
    {
      icon: TrendingUp,
      value: progressValue,
      labelKey: "home.todaySummaryProgress",
      to: "/today",
      tone: getProgressTone(progressPercent),
    },
  ];

  return (
    <SoftPanel className="alios-home-context-shelf grid grid-cols-2 gap-2 border-alios-herb/25 bg-background/90 p-2 shadow-sm md:grid-cols-4">
      {metrics.map(({ icon: Icon, labelKey, labelValues, to, tone, value }) => (
        <Link
          key={labelKey}
          to={to}
          className="flex min-h-20 min-w-0 items-center gap-3 rounded-2xl border bg-card/80 px-3 py-3 text-start shadow-sm transition hover:border-primary/25 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background/80">
            <Icon className={getIconClassName(tone)} aria-hidden="true" />
          </span>
          <span className="min-w-0 space-y-0.5">
            <span className="block truncate text-2xl font-semibold tabular-nums tracking-tight">
              {value}
            </span>
            <span className="block truncate text-xs font-medium leading-5 text-muted-foreground">
              {t(labelKey, labelValues)}
            </span>
          </span>
        </Link>
      ))}
    </SoftPanel>
  );
}
