import { useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, Plus, RefreshCw, XCircle } from "lucide-react";

import type {
  AddExperimentLogInput,
  CreateExperimentInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  type Experiment,
  type ExperimentLog,
  type ExperimentStatus,
} from "@/shared/types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  EmptyState,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui/premium";
import {
  aliosListItemMotion,
  aliosStaggerDelay,
} from "@/shared/ui/motion";
import { cn } from "@/shared/utils";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";

import { ExperimentDailyLog } from "../components/ExperimentDailyLog";
import { ExperimentForm } from "../components/ExperimentForm";

type ExperimentLogsById = Record<string, ExperimentLog[]>;

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function getDaysLeft(endDate: string, today: string): number {
  return Math.max(
    0,
    Math.ceil(
      (parseDateOnly(endDate).getTime() - parseDateOnly(today).getTime()) /
        86_400_000
    ) + 1
  );
}

function hasLoggedToday(logs: ExperimentLog[] | undefined, today: string) {
  return logs?.some((log) => log.date === today) ?? false;
}

function getTodayLog(logs: ExperimentLog[] | undefined, today: string) {
  return logs?.find((log) => log.date === today);
}

function getResultSummary(logs: ExperimentLog[], t: ReturnType<typeof useI18n>["t"]) {
  const conditionMetLogs = logs.filter((log) => log.conditionMet);
  if (conditionMetLogs.length < 3) {
    return t("experiments.noData");
  }

  const resultCount = conditionMetLogs.filter(
    (log) => log.hypothesisResult
  ).length;
  const resultRate = resultCount / conditionMetLogs.length;

  if (resultRate >= 0.7) {
    return t("experiments.resultWorking");
  }

  if (resultRate >= 0.4) {
    return t("experiments.resultMixed");
  }

  return t("experiments.resultNoEffect");
}

function ExperimentCard({
  experiment,
  logs,
  today,
  onOpenLog,
  onUpdateStatus,
  onDismiss,
}: {
  experiment: Experiment;
  logs: ExperimentLog[];
  today: string;
  onOpenLog: (experiment: Experiment) => void;
  onUpdateStatus: (id: string, status: ExperimentStatus) => void;
  onDismiss?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const isActive = experiment.status === "active";
  const loggedToday = hasLoggedToday(logs, today);
  const daysLeft = getDaysLeft(experiment.endDate, today);
  const conditionCount = logs.filter((log) => log.conditionMet).length;
  const resultCount = logs.filter((log) => log.hypothesisResult).length;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle>{experiment.title}</CardTitle>
            <CardDescription>
              {experiment.ifCondition} {"->"} {experiment.thenHypothesis}
            </CardDescription>
          </div>
          <StatusChip tone={isActive ? "primary" : "neutral"}>
            {isActive
              ? t("experiments.daysLeft", { count: daysLeft })
              : t("experiments.completedSection")}
          </StatusChip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SoftPanel>
            <p className="text-xs font-semibold text-muted-foreground">
              {t("experiments.resultSeenCount")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {logs.length}
            </p>
          </SoftPanel>
          <SoftPanel>
            <p className="text-xs font-semibold text-muted-foreground">
              {t("experiments.conditionSummary")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {conditionCount}
            </p>
          </SoftPanel>
          <SoftPanel>
            <p className="text-xs font-semibold text-muted-foreground">
              {t("experiments.hypothesisSummary")}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {resultCount}
            </p>
          </SoftPanel>
        </div>

        {!isActive ? (
          <SoftPanel>
            <p className="text-xs font-semibold text-muted-foreground">
              {t("experiments.resultSummary")}
            </p>
            <p className="mt-2 text-sm leading-7">
              {getResultSummary(logs, t)}
            </p>
          </SoftPanel>
        ) : null}

        <p className="text-xs leading-6 text-muted-foreground">
          {formatDate(experiment.startDate)} - {formatDate(experiment.endDate)}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {isActive ? (
          <>
            <Button type="button" onClick={() => onOpenLog(experiment)}>
              {loggedToday ? t("experiments.editLog") : t("experiments.logToday")}
            </Button>
            {loggedToday ? (
              <StatusChip tone="success">{t("experiments.loggedToday")}</StatusChip>
            ) : null}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onUpdateStatus(experiment.id, "active")}
            >
              {t("experiments.continueYes")}
            </Button>
            {onDismiss ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onDismiss(experiment.id)}
              >
                {t("experiments.continueNo")}
              </Button>
            ) : null}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ExperimentsPage() {
  const { experiments } = useStorageAdapter();
  const { direction, t } = useI18n();
  const [items, setItems] = useState<Experiment[]>([]);
  const [logsById, setLogsById] = useState<ExperimentLogsById>({});
  const [dismissedCompletedIds, setDismissedCompletedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loggingExperiment, setLoggingExperiment] = useState<Experiment | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => getLocalDateKey(new Date()), []);

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allExperiments = await experiments.getAllExperiments();
      const expiredExperiments = allExperiments.filter(
        (experiment) =>
          experiment.status === "active" && experiment.endDate < today
      );

      if (expiredExperiments.length > 0) {
        await Promise.all(
          expiredExperiments.map((experiment) =>
            experiments.updateStatus(experiment.id, "completed")
          )
        );
      }

      const refreshedExperiments =
        expiredExperiments.length > 0
          ? await experiments.getAllExperiments()
          : allExperiments;
      const entries = await Promise.all(
        refreshedExperiments.map(async (experiment) => [
          experiment.id,
          await experiments.getLogsForExperiment(experiment.id),
        ] as const)
      );

      setItems(refreshedExperiments);
      setLogsById(Object.fromEntries(entries));
    } catch {
      setError(t("experiments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [experiments, t, today]);

  useEffect(() => {
    void loadExperiments();
  }, [loadExperiments]);

  const activeExperiments = items.filter(
    (experiment) => experiment.status === "active"
  );
  const completedExperiments = items.filter(
    (experiment) =>
      experiment.status !== "active" && !dismissedCompletedIds.has(experiment.id)
  );

  async function handleCreate(input: CreateExperimentInput) {
    setSaving(true);
    setError(null);
    try {
      await experiments.createExperiment(input);
      setIsFormOpen(false);
      await loadExperiments();
    } catch {
      setError(t("experiments.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleLog(input: AddExperimentLogInput) {
    setSaving(true);
    setError(null);
    try {
      await experiments.addLog(input);
      setLoggingExperiment(null);
      await loadExperiments();
    } catch {
      setError(t("experiments.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(id: string, status: ExperimentStatus) {
    setSaving(true);
    setError(null);
    try {
      await experiments.updateStatus(id, status);
      await loadExperiments();
    } catch {
      setError(t("experiments.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" dir={direction}>
      <PremiumCard>
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader
            icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
            title={t("experiments.pageTitle")}
            description={t("experiments.pageDescription")}
          />
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("experiments.newButton")}
          </Button>
        </CardContent>
      </PremiumCard>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={loadExperiments}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-4">
        <SectionHeader title={t("experiments.activeSection")} />
        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              {t("experiments.loading")}
            </CardContent>
          </Card>
        ) : activeExperiments.length > 0 ? (
          <div className="grid gap-4">
            {activeExperiments.map((experiment, index) => (
              <div
                key={experiment.id}
                className={cn(
                  aliosListItemMotion,
                  aliosStaggerDelay(index),
                  "motion-reduce:animate-none motion-reduce:opacity-100"
                )}
              >
                <ExperimentCard
                  experiment={experiment}
                  logs={logsById[experiment.id] ?? []}
                  today={today}
                  onOpenLog={setLoggingExperiment}
                  onUpdateStatus={handleUpdateStatus}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
            title={t("experiments.emptyActiveTitle")}
            description={t("experiments.emptyActiveDescription")}
            actions={
              <Button type="button" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("experiments.newButton")}
              </Button>
            }
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader title={t("experiments.completedSection")} />
        {completedExperiments.length > 0 ? (
          <div className="grid gap-4">
            {completedExperiments.map((experiment, index) => (
              <div
                key={experiment.id}
                className={cn(
                  aliosListItemMotion,
                  aliosStaggerDelay(index),
                  "motion-reduce:animate-none motion-reduce:opacity-100"
                )}
              >
                <ExperimentCard
                  experiment={experiment}
                  logs={logsById[experiment.id] ?? []}
                  today={today}
                  onOpenLog={setLoggingExperiment}
                  onUpdateStatus={handleUpdateStatus}
                  onDismiss={(id) =>
                    setDismissedCompletedIds((current) => {
                      const next = new Set(current);
                      next.add(id);
                      return next;
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
            title={t("experiments.emptyCompletedTitle")}
            description={t("experiments.emptyCompletedDescription")}
          />
        )}
      </section>

      <ExperimentForm
        isOpen={isFormOpen}
        isSaving={saving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />
      <ExperimentDailyLog
        experiment={loggingExperiment}
        existingLog={
          loggingExperiment
            ? getTodayLog(logsById[loggingExperiment.id], today)
            : undefined
        }
        isSaving={saving}
        onClose={() => setLoggingExperiment(null)}
        onSubmit={handleLog}
      />
    </div>
  );
}
