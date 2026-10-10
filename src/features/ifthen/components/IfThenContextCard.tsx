import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { IfThenPlan, UrgeEntry } from "@/shared/types";
import { Button, Card, CardContent } from "@/shared/ui";

type IfThenContextCardProps = {
  refreshKey?: number;
};

const IFTHEN_CONTEXT_DISMISSED_KEY = "alios.ifthen.context.dismissed";

function readDismissedSignature(): string | null {
  try {
    return window.localStorage.getItem(IFTHEN_CONTEXT_DISMISSED_KEY);
  } catch {
    return null;
  }
}

function writeDismissedSignature(signature: string) {
  try {
    window.localStorage.setItem(IFTHEN_CONTEXT_DISMISSED_KEY, signature);
  } catch {
    // Dismissal is a convenience only; unavailable localStorage should not break the card.
  }
}

export function IfThenContextCard({ refreshKey = 0 }: IfThenContextCardProps) {
  const { t } = useI18n();
  const { ifThenPlans, urgeEntries } = useStorageAdapter();
  const [plans, setPlans] = useState<IfThenPlan[]>([]);
  const [entries, setEntries] = useState<UrgeEntry[]>([]);
  const [dismissedSignature, setDismissedSignature] = useState(() =>
    readDismissedSignature()
  );
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    setError(null);
    try {
      const today = getLocalDateKey(new Date());
      const [activePlans, todayEntries] = await Promise.all([
        ifThenPlans.getActivePlans(),
        urgeEntries.getEntriesByDate(today),
      ]);
      setPlans(activePlans.filter((plan) => Boolean(plan.linkedUrgeType)));
      setEntries(todayEntries);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("ifthen.loadError"));
    }
  }, [ifThenPlans, t, urgeEntries]);

  useEffect(() => {
    void loadContext();
  }, [loadContext, refreshKey]);

  const matchedPlans = useMemo(() => {
    const todaysUrgeTypes = new Set(entries.map((entry) => entry.urgeType));
    return plans.filter(
      (plan) => plan.linkedUrgeType && todaysUrgeTypes.has(plan.linkedUrgeType)
    );
  }, [entries, plans]);
  const today = getLocalDateKey(new Date());
  const signature = `${today}:${matchedPlans.map((plan) => plan.id).join(",")}`;
  const visiblePlan = dismissedSignature === signature ? undefined : matchedPlans[0];

  if (!error && !visiblePlan) {
    return null;
  }

  return (
    <Card className="alios-home-context-shelf overflow-hidden border-border/70 bg-card/95 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        {error ? (
          <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
            {error}
          </div>
        ) : visiblePlan ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-base font-semibold">{t("ifthen.contextCardTitle")}</p>
              <p className="break-words text-sm leading-7 text-muted-foreground">
                {t("ifthen.planText", {
                  ifTrigger: visiblePlan.ifTrigger,
                  thenAction: visiblePlan.thenAction,
                })}
              </p>
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                writeDismissedSignature(signature);
                setDismissedSignature(signature);
              }}
            >
              {t("ifthen.dismissButton")}
            </Button>
          </div>
        ) : null}
        {error ? (
          <Button type="button" size="sm" variant="outline" onClick={() => void loadContext()}>
            <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.tryAgain")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
