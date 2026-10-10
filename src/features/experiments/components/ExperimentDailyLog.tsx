import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";

import type { AddExperimentLogInput } from "@/core/repositories";
import type { Experiment, ExperimentLog } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { PremiumCard } from "@/shared/ui/premium";
import { cn } from "@/shared/utils";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";

type ExperimentDailyLogProps = {
  experiment: Experiment | null;
  existingLog?: ExperimentLog;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: AddExperimentLogInput) => Promise<void>;
};

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3 rounded-control border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium leading-6">{label}</span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(true)}
        >
          {t("common.yes")}
        </Button>
        <Button
          type="button"
          variant={!value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(false)}
        >
          {t("common.no")}
        </Button>
      </div>
    </div>
  );
}

export function ExperimentDailyLog({
  experiment,
  existingLog,
  isSaving,
  onClose,
  onSubmit,
}: ExperimentDailyLogProps) {
  const { direction, t } = useI18n();
  const [conditionMet, setConditionMet] = useState(
    existingLog?.conditionMet ?? true
  );
  const [hypothesisResult, setHypothesisResult] = useState(
    existingLog?.hypothesisResult ?? true
  );
  const [note, setNote] = useState(existingLog?.note ?? "");

  if (!experiment) {
    return null;
  }

  const experimentId = experiment.id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      experimentId,
      date: getLocalDateKey(new Date()),
      conditionMet,
      hypothesisResult,
      note: note.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <PremiumCard className="w-full max-w-xl" dir={direction}>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              {t("experiments.dailyLogTitle")}
            </CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {experiment.title}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <ToggleRow
              label={t("experiments.conditionMet")}
              value={conditionMet}
              onChange={setConditionMet}
            />
            <ToggleRow
              label={t("experiments.hypothesisResult")}
              value={hypothesisResult}
              onChange={setHypothesisResult}
            />
            <label className="space-y-2 text-sm font-medium">
              <span>{t("experiments.fieldNote")}</span>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row",
                direction === "rtl" ? "sm:justify-start" : "sm:justify-end"
              )}
            >
              <Button type="submit" disabled={isSaving}>
                {t("experiments.submitLog")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </PremiumCard>
    </div>
  );
}
