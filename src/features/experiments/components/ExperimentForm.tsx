import { useState } from "react";
import type { FormEvent } from "react";
import { FlaskConical, X } from "lucide-react";

import type { CreateExperimentInput } from "@/core/repositories";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { PremiumCard } from "@/shared/ui/premium";
import { cn } from "@/shared/utils";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";

type ExperimentTemplate = {
  id: string;
  labelKey: TranslationKey;
  ifConditionKey: TranslationKey;
  thenHypothesisKey: TranslationKey;
};

const templates: ExperimentTemplate[] = [
  {
    id: "habit",
    labelKey: "experiments.templateHabit",
    ifConditionKey: "experiments.templateHabitIf",
    thenHypothesisKey: "experiments.templateHabitThen",
  },
  {
    id: "time",
    labelKey: "experiments.templateTime",
    ifConditionKey: "experiments.templateTimeIf",
    thenHypothesisKey: "experiments.templateTimeThen",
  },
  {
    id: "avoid",
    labelKey: "experiments.templateAvoid",
    ifConditionKey: "experiments.templateAvoidIf",
    thenHypothesisKey: "experiments.templateAvoidThen",
  },
];

type ExperimentFormProps = {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateExperimentInput) => Promise<void>;
};

export function ExperimentForm({
  isOpen,
  isSaving,
  onClose,
  onSubmit,
}: ExperimentFormProps) {
  const { direction, t } = useI18n();
  const [ifCondition, setIfCondition] = useState("");
  const [thenHypothesis, setThenHypothesis] = useState("");
  const [title, setTitle] = useState("");

  if (!isOpen) {
    return null;
  }

  function applyTemplate(template: ExperimentTemplate) {
    setIfCondition(t(template.ifConditionKey));
    setThenHypothesis(t(template.thenHypothesisKey));
  }

  function buildTitle() {
    if (title.trim()) {
      return title.trim();
    }

    return `${ifCondition.trim()} - ${thenHypothesis.trim()}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIf = ifCondition.trim();
    const normalizedThen = thenHypothesis.trim();
    if (!normalizedIf || !normalizedThen) {
      return;
    }

    await onSubmit({
      title: buildTitle(),
      ifCondition: normalizedIf,
      thenHypothesis: normalizedThen,
      startDate: getLocalDateKey(new Date()),
    });

    setIfCondition("");
    setThenHypothesis("");
    setTitle("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <PremiumCard className="w-full max-w-2xl" dir={direction}>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" aria-hidden="true" />
              {t("experiments.formTitle")}
            </CardTitle>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("experiments.duration")}
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
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("experiments.templateLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {t(template.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            <Card className="border-dashed bg-muted/30">
              <CardContent className="space-y-4 p-4">
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("experiments.fieldIf")}</span>
                  <Input
                    value={ifCondition}
                    onChange={(event) => setIfCondition(event.target.value)}
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("experiments.fieldThen")}</span>
                  <Input
                    value={thenHypothesis}
                    onChange={(event) => setThenHypothesis(event.target.value)}
                    required
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>{t("experiments.fieldTitle")}</span>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
              </CardContent>
            </Card>

            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row",
                direction === "rtl" ? "sm:justify-start" : "sm:justify-end"
              )}
            >
              <Button type="submit" disabled={isSaving}>
                {t("experiments.startButton")}
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
