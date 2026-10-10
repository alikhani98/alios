import { Pencil, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { DailyCommitment } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  SoftPanel,
} from "@/shared/ui";

import {
  CommitmentForm,
  type CommitmentFormValues,
} from "./CommitmentForm";

function getTomorrowDateKey(now: Date): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateKey(tomorrow);
}

function getYesterdayDateKey(now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateKey(yesterday);
}

function getPlanningDate(now: Date): string {
  return now.getHours() >= 18 ? getTomorrowDateKey(now) : getLocalDateKey(now);
}

function getActiveCommitment(
  todayCommitment: DailyCommitment | undefined,
  planningCommitment: DailyCommitment | undefined
) {
  return todayCommitment ?? planningCommitment;
}

export function DailyCommitmentCard() {
  const { t } = useI18n();
  const { dailyCommitments } = useStorageAdapter();
  const [now, setNow] = useState(() => new Date());
  const [todayCommitment, setTodayCommitment] =
    useState<DailyCommitment | undefined>();
  const [yesterdayCommitment, setYesterdayCommitment] =
    useState<DailyCommitment | undefined>();
  const [planningCommitment, setPlanningCommitment] =
    useState<DailyCommitment | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [preStartFeeling, setPreStartFeeling] = useState("");
  const [mainBlocker, setMainBlocker] = useState("");
  const [endOfDayNote, setEndOfDayNote] = useState("");

  const todayDate = useMemo(() => getLocalDateKey(now), [now]);
  const yesterdayDate = useMemo(() => getYesterdayDateKey(now), [now]);
  const planningDate = useMemo(() => getPlanningDate(now), [now]);
  const activeCommitment = getActiveCommitment(
    todayCommitment,
    planningCommitment
  );
  const showMissedYesterday =
    !activeCommitment &&
    yesterdayCommitment?.date === yesterdayDate &&
    !yesterdayCommitment.didStart;
  const targetCommitmentDate = showMissedYesterday ? todayDate : planningDate;
  const showEveningReflection =
    Boolean(activeCommitment?.didStart) &&
    activeCommitment?.date === todayDate &&
    now.getHours() >= 20 &&
    !activeCommitment.endOfDayNote;

  const loadCommitments = async () => {
    setIsLoading(true);
    setActionError(null);
    const nextNow = new Date();
    const nextTodayDate = getLocalDateKey(nextNow);
    const nextYesterdayDate = getYesterdayDateKey(nextNow);
    const nextPlanningDate = getPlanningDate(nextNow);

    try {
      const [
        nextTodayCommitment,
        nextYesterdayCommitment,
        nextPlanningCommitment,
      ] = await Promise.all([
        dailyCommitments.getCommitmentByDate(nextTodayDate),
        dailyCommitments.getCommitmentByDate(nextYesterdayDate),
        nextPlanningDate === nextTodayDate
          ? Promise.resolve(undefined)
          : dailyCommitments.getCommitmentByDate(nextPlanningDate),
      ]);

      setNow(nextNow);
      setTodayCommitment(nextTodayCommitment);
      setYesterdayCommitment(nextYesterdayCommitment);
      setPlanningCommitment(nextPlanningCommitment);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("commitment.loadError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCommitments();
  }, [dailyCommitments]);

  useEffect(() => {
    setPreStartFeeling(activeCommitment?.preStartFeeling ?? "");
    setMainBlocker(activeCommitment?.mainBlocker ?? "");
    setEndOfDayNote(activeCommitment?.endOfDayNote ?? "");
  }, [activeCommitment]);

  const handleSubmit = async (values: CommitmentFormValues) => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      await dailyCommitments.upsertCommitment({
        id: activeCommitment?.id,
        date: activeCommitment?.date ?? targetCommitmentDate,
        title: values.title,
        plannedStartTime: values.plannedStartTime,
        minimumVersion: values.minimumVersion,
        didStart: activeCommitment?.didStart ?? false,
        startedAt: activeCommitment?.startedAt,
        preStartFeeling: activeCommitment?.preStartFeeling,
        mainBlocker: activeCommitment?.mainBlocker,
        endOfDayNote: activeCommitment?.endOfDayNote,
      });
      setIsFormOpen(false);
      await loadCommitments();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("commitment.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkStarted = async () => {
    if (!activeCommitment) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      await dailyCommitments.markStarted(activeCommitment.date);
      await loadCommitments();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("commitment.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReflectionSubmit = async () => {
    if (!activeCommitment) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      await dailyCommitments.saveEveningReflection(activeCommitment.date, {
        preStartFeeling: preStartFeeling.trim() || undefined,
        mainBlocker: mainBlocker.trim() || undefined,
        endOfDayNote: endOfDayNote.trim() || undefined,
      });
      await loadCommitments();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("commitment.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        {actionError ? (
          <div
            role="alert"
            className="alios-status-danger rounded-2xl p-3 text-sm"
          >
            {actionError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl border bg-muted/60" />
        ) : isFormOpen ? (
          <SoftPanel className="space-y-4 bg-background/80">
            <CardTitle>{t("commitment.formTitle")}</CardTitle>
            <CommitmentForm
              commitment={activeCommitment}
              isSubmitting={isSubmitting}
              onCancel={() => setIsFormOpen(false)}
              onSubmit={handleSubmit}
            />
          </SoftPanel>
        ) : showMissedYesterday ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold leading-7">
              {t("commitment.missedPrompt")}
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" aria-hidden="true" />
              {t("commitment.defineButton")}
            </Button>
          </div>
        ) : activeCommitment ? (
          <div className="space-y-4">
            {activeCommitment.didStart ? (
              <div className="min-w-0">
                <p className="break-words text-lg font-semibold leading-7">
                  {t("commitment.startedLabel")} {activeCommitment.title}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="break-words text-xl font-semibold leading-8">
                    {activeCommitment.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {activeCommitment.plannedStartTime}
                    </span>
                  </p>
                  {activeCommitment.minimumVersion ? (
                    <p className="break-words text-sm leading-6 text-muted-foreground">
                      {t("commitment.minimumLabel")}{" "}
                      {activeCommitment.minimumVersion}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => void handleMarkStarted()}
                >
                  {t("commitment.startButton")}
                </Button>
              </>
            )}

            {showEveningReflection ? (
              <SoftPanel className="space-y-3 bg-background/80">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="commitment-blocker"
                      className="text-sm font-medium"
                    >
                      {t("commitment.eveningPromptBlocker")}
                    </label>
                    <Input
                      id="commitment-blocker"
                      value={mainBlocker}
                      onChange={(event) => setMainBlocker(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="commitment-note"
                      className="text-sm font-medium"
                    >
                      {t("commitment.eveningNote")}
                    </label>
                    <Input
                      id="commitment-note"
                      value={endOfDayNote}
                      onChange={(event) => setEndOfDayNote(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => void handleReflectionSubmit()}
                >
                  {t("commitment.eveningSubmit")}
                </Button>
              </SoftPanel>
            ) : activeCommitment.endOfDayNote ? (
              <SoftPanel className="bg-background/80">
                <p className="text-sm leading-6 text-muted-foreground">
                  {activeCommitment.endOfDayNote}
                </p>
              </SoftPanel>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ms-auto flex"
              onClick={() => setIsFormOpen(true)}
            >
              <Pencil className="me-2 h-4 w-4" aria-hidden="true" />
              {t("commitment.editLabel")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold leading-7">
              {now.getHours() >= 18
                ? t("commitment.tomorrowQuestion")
                : t("commitment.todayQuestion")}
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" aria-hidden="true" />
              {t("commitment.defineButton")}
            </Button>
          </div>
        )}

        {actionError ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCommitments()}
          >
            <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
