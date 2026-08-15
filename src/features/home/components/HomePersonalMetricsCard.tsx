import {
  Activity,
  BookOpenText,
  CheckCircle2,
  Flame,
  FolderKanban,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { getPreferenceStorage, writeStoredPreference } from "@/shared/preferences/storage";
import {
  Badge,
  CollapsibleSection,
  EmptyState,
  MetricCard,
  StatusChip,
} from "@/shared/ui";

import type { HomePersonalMetrics } from "../personalMetrics";

export const HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY =
  "alios.home.personalMetrics.open";

export function readStoredPersonalMetricsOpen(defaultOpen = false): boolean {
  const storage = getPreferenceStorage();

  if (!storage) {
    return defaultOpen;
  }

  try {
    const storedValue = storage.getItem(HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY);
    if (storedValue === null) {
      return defaultOpen;
    }

    return storedValue === "true";
  } catch {
    return defaultOpen;
  }
}

export function writeStoredPersonalMetricsOpen(open: boolean) {
  try {
    writeStoredPreference(
      HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY,
      String(open)
    );
  } catch {
    // Keep the disclosure usable in memory when storage is unavailable.
  }
}

function NumberValue({ value, suffix }: { value: number; suffix?: string }) {
  return (
    <span className="font-mono tabular-nums">
      {value}
      {suffix ? <span className="text-base font-medium">{suffix}</span> : null}
    </span>
  );
}

export function HomePersonalMetricsCard({
  metrics,
}: {
  metrics: HomePersonalMetrics;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readStoredPersonalMetricsOpen(false));
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    writeStoredPersonalMetricsOpen(nextOpen);
  };

  return (
    <CollapsibleSection
      id="unified-home-personal-metrics"
      title={t("home.personalMetricsTitle")}
      description={t("home.personalMetricsDescription")}
      icon={<Activity className="h-5 w-5" aria-hidden="true" />}
      status={
        <span className="flex flex-wrap items-center justify-end gap-2">
          <StatusChip tone={metrics.hasAnySignal ? "primary" : "neutral"}>
            <NumberValue value={metrics.tasks.activeNow} /> {t("home.personalMetricsActiveTasksShort")}
          </StatusChip>
          <Badge variant="secondary">
            <NumberValue value={metrics.checkins.currentStreak} /> {t("home.personalMetricsStreakShort")}
          </Badge>
        </span>
      }
      open={open}
      onOpenChange={handleOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-4"
    >
      {metrics.hasAnySignal ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsTasksAllTime")}
            value={<NumberValue value={metrics.tasks.completedAllTime} />}
            description={t("home.personalMetricsTasksWeek", {
              count: metrics.tasks.completedLastSevenDays,
            })}
          />
          <MetricCard
            icon={<Activity className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsActiveTasks")}
            value={<NumberValue value={metrics.tasks.activeNow} />}
            description={t("home.personalMetricsActiveTasksDescription")}
          />
          <MetricCard
            icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsJournal")}
            value={<NumberValue value={metrics.journal.totalEntries} />}
            description={t("home.personalMetricsJournalMonth", {
              count: metrics.journal.entriesLastThirtyDays,
            })}
          />
          <MetricCard
            icon={<BookOpenText className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsKnowledge")}
            value={<NumberValue value={metrics.knowledge.totalItems} />}
            description={t("home.personalMetricsKnowledgeDescription")}
          />
          <MetricCard
            icon={<FolderKanban className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsProjectsGoals")}
            value={<NumberValue value={metrics.projects.activeCount + metrics.goals.activeCount} />}
            description={t("home.personalMetricsProjectsGoalsDescription", {
              projects: metrics.projects.activeCount,
              goals: metrics.goals.activeCount,
            })}
          />
          <MetricCard
            icon={<Flame className="h-5 w-5" aria-hidden="true" />}
            label={t("home.personalMetricsCheckins")}
            value={<NumberValue value={metrics.checkins.completionPercentLastThirtyDays} suffix="%" />}
            description={t("home.personalMetricsCheckinsDescription", {
              streak: metrics.checkins.currentStreak,
              count: metrics.checkins.completedLastThirtyDays,
            })}
          />
        </div>
      ) : (
        <EmptyState
          icon={<Target className="h-6 w-6" aria-hidden="true" />}
          title={t("home.personalMetricsEmptyTitle")}
          description={t("home.personalMetricsEmptyDescription")}
        />
      )}
    </CollapsibleSection>
  );
}
