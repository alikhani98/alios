import { useCallback, useEffect, useMemo, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import {
  CommitmentForm,
  type CommitmentFormValues,
} from "@/features/commitment/components/CommitmentForm";
import { useI18n } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { DailyCommitment } from "@/shared/types";
import { Button, Card, CardContent, SoftPanel } from "@/shared/ui";

export const RECOVERY_DISMISSED_AT_STORAGE_KEY = "alios.recovery.dismissedAt";
const RECOVERY_DISMISS_MS = 24 * 60 * 60 * 1000;

type RecoveryCardProps = {
  today: string;
  onAddTask: () => void;
};

function getRecentDateKeys(days: number): string[] {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return getLocalDateKey(date);
  });
}

function readDismissedAt(): string | null {
  try {
    return window.localStorage.getItem(RECOVERY_DISMISSED_AT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function isDismissedRecently(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const dismissedAt = Date.parse(value);

  if (Number.isNaN(dismissedAt)) {
    return false;
  }

  return Date.now() - dismissedAt < RECOVERY_DISMISS_MS;
}

function writeDismissedAt(): string {
  const dismissedAt = new Date().toISOString();

  try {
    window.localStorage.setItem(RECOVERY_DISMISSED_AT_STORAGE_KEY, dismissedAt);
  } catch {
    // The card still hides for the current render when localStorage is unavailable.
  }

  return dismissedAt;
}

export function RecoveryCard({ today, onAddTask }: RecoveryCardProps) {
  const { t } = useI18n();
  const { dailyCommitments } = useStorageAdapter();
  const [isActive, setIsActive] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(() => readDismissedAt());
  const [todayCommitment, setTodayCommitment] =
    useState<DailyCommitment | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recentDateKeys = useMemo(() => getRecentDateKeys(3), []);

  const loadRecoveryState = useCallback(async () => {
    setError(null);

    try {
      const [recentCommitments, commitment] =
        await Promise.all([
          dailyCommitments.getRecentCommitments(3),
          dailyCommitments.getCommitmentByDate(today),
        ]);
      const hasStartedCommitment = recentCommitments.some(
        (item) => recentDateKeys.includes(item.date) && item.didStart
      );

      setTodayCommitment(commitment);
      setIsActive(!hasStartedCommitment);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : null);
      setIsActive(false);
    }
  }, [dailyCommitments, recentDateKeys, today]);

  useEffect(() => {
    void loadRecoveryState();
  }, [loadRecoveryState]);

  if (!isActive || isDismissedRecently(dismissedAt)) {
    return null;
  }

  const dismiss = () => {
    setDismissedAt(writeDismissedAt());
    setIsActive(false);
  };

  const handleSubmitCommitment = async (values: CommitmentFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await dailyCommitments.upsertCommitment({
        id: todayCommitment?.id,
        date: today,
        title: values.title,
        plannedStartTime: values.plannedStartTime,
        minimumVersion: values.minimumVersion,
        didStart: todayCommitment?.didStart ?? false,
        startedAt: todayCommitment?.startedAt,
        preStartFeeling: todayCommitment?.preStartFeeling,
        mainBlocker: todayCommitment?.mainBlocker,
        endOfDayNote: todayCommitment?.endOfDayNote,
      });
      dismiss();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("commitment.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <p className="text-base font-semibold leading-7">
          {t("recovery.returnPrompt")}
        </p>

        {error ? (
          <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
            {error}
          </div>
        ) : null}

        {isFormOpen ? (
          <SoftPanel className="bg-background/85">
            <CommitmentForm
              commitment={todayCommitment}
              isSubmitting={isSubmitting}
              onCancel={() => setIsFormOpen(false)}
              onSubmit={handleSubmitCommitment}
            />
          </SoftPanel>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={dismiss}>
              {t("recovery.optionRoutine")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(true)}
            >
              {t("recovery.optionCommitment")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                dismiss();
                onAddTask();
              }}
            >
              {t("recovery.optionTask")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
