import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { DailyCommitment, Routine, Task, UrgeEntry } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { aliosListItemMotion, aliosStaggerDelay } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";

import {
  commitmentByHour,
  commitmentStats,
  confidenceFromSampleSize,
  urgeResistanceRate,
  urgesByHour,
  type PatternConfidence,
} from "../utils/patternAnalyzer";

const REPORT_DAYS = 14;
const MAX_INSIGHTS = 5;

const URGE_TYPES = [
  { value: "cigarette", labelKey: "urge.typeCigarette" },
  { value: "social_media", labelKey: "urge.typeSocialMedia" },
  { value: "procrastination", labelKey: "urge.typeProcrastination" },
  { value: "impulse_buy", labelKey: "urge.typeImpulseBuy" },
  { value: "other", labelKey: "urge.typeOther" },
] as const satisfies ReadonlyArray<{
  value: string;
  labelKey: TranslationKey;
}>;

type RoutinePattern = {
  routineId: string;
  title: string;
  done: number;
  minimum: number;
  confidence: PatternConfidence;
};

type PatternsData = {
  commitments: DailyCommitment[];
  urges: UrgeEntry[];
  routines: Routine[];
  routineTasks: Task[];
  dateKeys: string[];
};

type Insight = {
  id: string;
  section: "helped" | "blocked" | "change";
  text: string;
  confidence: PatternConfidence;
};

function getRecentDateKeys(days: number): string[] {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return getLocalDateKey(date);
  });
}

function getDataDayCount(data: PatternsData): number {
  const days = new Set<string>();

  for (const commitment of data.commitments) {
    days.add(commitment.date);
  }

  for (const urge of data.urges) {
    days.add(urge.date);
  }

  for (const task of data.routineTasks) {
    if (task.dueDate) {
      days.add(task.dueDate);
    }
  }

  return days.size;
}

function getRoutinePatterns(data: PatternsData): RoutinePattern[] {
  const dateSet = new Set(data.dateKeys);

  return data.routines
    .map((routine) => {
      const logs = data.routineTasks.filter(
        (task) =>
          task.routineId === routine.id &&
          task.dueDate &&
          dateSet.has(task.dueDate)
      );

      return {
        routineId: routine.id,
        title: routine.title,
        done: logs.filter((task) => task.status === "done").length,
        minimum: logs.filter((task) => task.completedMinimum).length,
        confidence: confidenceFromSampleSize(logs.length),
      };
    })
    .filter((item) => item.done > 0 || item.minimum > 0)
    .sort(
      (first, second) =>
        second.done + second.minimum - (first.done + first.minimum) ||
        first.title.localeCompare(second.title)
    );
}

function getUrgeTypeLabel(value: string, t: (key: TranslationKey) => string) {
  const preset = URGE_TYPES.find((item) => item.value === value);
  return preset ? t(preset.labelKey) : value;
}

function isVisibleConfidence(confidence: PatternConfidence): boolean {
  return confidence === "medium" || confidence === "high";
}

function withConfidencePrefix(
  text: string,
  confidence: PatternConfidence,
  lowConfidencePrefix: string
) {
  return confidence === "medium" ? `${lowConfidencePrefix} ${text}` : text;
}

function buildInsights(
  data: PatternsData,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
): Insight[] {
  const insights: Insight[] = [];
  const commitmentSummary = commitmentStats(data.commitments);
  const topStartHour = [...commitmentByHour(data.commitments)]
    .filter((item) => item.startedCount > 0)
    .sort(
      (first, second) =>
        second.startedCount - first.startedCount ||
        first.plannedHour - second.plannedHour
    )[0];
  const peakUrgeHour = [...urgesByHour(data.urges)].sort(
    (first, second) => second.count - first.count || first.hour - second.hour
  )[0];
  const topResistance = urgeResistanceRate(data.urges)
    .filter((item) => item.resisted > 0)
    .sort(
      (first, second) =>
        second.resistRate - first.resistRate || second.total - first.total
    )[0];
  const routinePattern = getRoutinePatterns(data)[0];
  const urgeDays = new Set(data.urges.map((urge) => urge.date));
  const missedCommitmentDays = new Set(
    data.commitments
      .filter((commitment) => !commitment.didStart)
      .map((commitment) => commitment.date)
  );
  const highUrgeMissedDays = [...urgeDays].filter((day) =>
    missedCommitmentDays.has(day)
  ).length;
  const combinedConfidence = confidenceFromSampleSize(
    Math.min(urgeDays.size, data.commitments.length)
  );

  if (topStartHour) {
    insights.push({
      id: "start-time-helped",
      section: "helped",
      confidence: topStartHour.confidence,
      text: t("patterns.insightStartTimeHelped"),
    });
  }

  if (routinePattern) {
    insights.push({
      id: "routine-helped",
      section: "helped",
      confidence: routinePattern.confidence,
      text: t("patterns.insightRoutineHelped", {
        title: routinePattern.title,
      }),
    });
  }

  if (topResistance) {
    insights.push({
      id: "resistance-helped",
      section: "helped",
      confidence: topResistance.confidence,
      text: t("patterns.insightResistanceHelped", {
        type: getUrgeTypeLabel(topResistance.urgeType, t),
      }),
    });
  }

  if (peakUrgeHour) {
    insights.push({
      id: "urge-hour-blocked",
      section: "blocked",
      confidence: peakUrgeHour.confidence,
      text: t("patterns.insightUrgeAfterHour", {
        hour: peakUrgeHour.hour,
      }),
    });
  }

  if (commitmentSummary.startRate < 0.5 && commitmentSummary.total > 0) {
    insights.push({
      id: "commitment-blocked",
      section: "blocked",
      confidence: commitmentSummary.confidence,
      text: t("patterns.insightCommitmentBlocked"),
    });
  }

  if (highUrgeMissedDays > 0) {
    insights.push({
      id: "urge-commitment-change",
      section: "change",
      confidence: combinedConfidence,
      text: t("patterns.insightUrgeCommitment"),
    });
  }

  if (topStartHour) {
    insights.push({
      id: "next-week-start-time",
      section: "change",
      confidence: topStartHour.confidence,
      text: t("patterns.insightNextWeekStartTime"),
    });
  }

  return insights
    .filter((insight) => isVisibleConfidence(insight.confidence))
    .slice(0, MAX_INSIGHTS)
    .map((insight) => ({
      ...insight,
      text: withConfidencePrefix(
        insight.text,
        insight.confidence,
        t("patterns.lowConfidence")
      ),
    }));
}

function InsightSection({
  title,
  insights,
  fallback,
}: {
  title: string;
  insights: Insight[];
  fallback: string;
}) {
  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <p
              key={insight.id}
              className={cn(aliosListItemMotion, aliosStaggerDelay(index))}
            >
              {insight.text}
            </p>
          ))
        ) : (
          <p>{fallback}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyPatternsPage() {
  const { t } = useI18n();
  const { dailyCommitments, urgeEntries, routines, tasks } = useStorageAdapter();
  const [data, setData] = useState<PatternsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateKeys = getRecentDateKeys(REPORT_DAYS);
      const dateSet = new Set(dateKeys);
      const [commitments, urges, routineList, taskList] = await Promise.all([
        dailyCommitments.getRecentCommitments(REPORT_DAYS),
        urgeEntries.getRecentEntries(REPORT_DAYS),
        routines.list(),
        tasks.list(),
      ]);
      const routineTasks = taskList.filter(
        (task) => task.routineId && task.dueDate && dateSet.has(task.dueDate)
      );

      setData({
        commitments: commitments.filter((commitment) =>
          dateSet.has(commitment.date)
        ),
        urges: urges.filter((urge) => dateSet.has(urge.date)),
        routines: routineList,
        routineTasks,
        dateKeys,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("patterns.loadError")
      );
    } finally {
      setIsLoading(false);
    }
  }, [dailyCommitments, urgeEntries, routines, tasks, t]);

  useEffect(() => {
    void loadPatterns();
  }, [loadPatterns]);

  const dataDayCount = data ? getDataDayCount(data) : 0;
  const insights = useMemo(() => {
    if (!data || dataDayCount < 3) {
      return [];
    }

    return buildInsights(data, t);
  }, [data, dataDayCount, t]);
  const helpedInsights = insights.filter((insight) => insight.section === "helped");
  const blockedInsights = insights.filter((insight) => insight.section === "blocked");
  const changeInsights = insights.filter((insight) => insight.section === "change");

  return (
    <main className="space-y-4 pb-8">
      {error ? (
        <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void loadPatterns()}
          >
            <RefreshCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t("patterns.loading")}
          </CardContent>
        </Card>
      ) : dataDayCount < 3 ? (
        <p className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground shadow-sm">
          {t("patterns.noData")}
        </p>
      ) : insights.length === 0 ? (
        <p className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground shadow-sm">
          {t("patterns.noInsights")}
        </p>
      ) : (
        <div className="space-y-4">
          <InsightSection
            title={t("patterns.whatHelped")}
            insights={helpedInsights}
            fallback={t("patterns.noInsights")}
          />
          <InsightSection
            title={t("patterns.whatBlocked")}
            insights={blockedInsights}
            fallback={t("patterns.noInsights")}
          />
          <InsightSection
            title={t("patterns.whatToChange")}
            insights={changeInsights}
            fallback={t("patterns.noInsights")}
          />
        </div>
      )}
    </main>
  );
}
