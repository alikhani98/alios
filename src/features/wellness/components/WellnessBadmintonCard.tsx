import {
  RefreshCcw,
  Trees,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";

import { usePersistentBoolean, usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  createDefaultWellnessRoutineDailyState,
  getWellnessRoutineDailyState,
  getWellnessRoutineSectionById,
  getWellnessRoutineStepLabelKey,
  isWellnessRoutineEnabled,
  normalizeWellnessRoutineCheckedStepIds,
  saveWellnessRoutineDailyState,
  toggleWellnessRoutineStepId,
  WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY,
  type WellnessBadmintonRoutineTemplateId,
  type WellnessRoutineEnergyLevel,
  type WellnessRoutineFatigueLevel,
  type WellnessRoutineSectionId,
  type WellnessRoutineStepId,
} from "../badmintonRoutine";

type WellnessBadmintonCardProps = {
  onOpenRoutineTemplate: (templateId: WellnessBadmintonRoutineTemplateId) => void;
};

const energyChoices: ReadonlyArray<{
  value: WellnessRoutineEnergyLevel;
  labelKey: "wellness.low" | "wellness.okay" | "wellness.good";
}> = [
  { value: "low", labelKey: "wellness.low" },
  { value: "okay", labelKey: "wellness.okay" },
  { value: "good", labelKey: "wellness.good" },
];

const fatigueChoices: ReadonlyArray<{
  value: WellnessRoutineFatigueLevel;
  labelKey: "wellness.low" | "wellness.medium" | "wellness.high";
}> = [
  { value: "low", labelKey: "wellness.low" },
  { value: "medium", labelKey: "wellness.medium" },
  { value: "high", labelKey: "wellness.high" },
];

function getSafeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function WellnessStepGroup({
  sectionId,
  labelKey,
  checkedStepIds,
  onToggleStep,
}: {
  sectionId: WellnessRoutineSectionId;
  labelKey: "wellness.beforePlay" | "wellness.duringPlay" | "wellness.afterPlay" | "wellness.reflection";
  checkedStepIds: WellnessRoutineStepId[];
  onToggleStep: (stepId: WellnessRoutineStepId) => void;
}) {
  const { t } = useI18n();
  const section = getWellnessRoutineSectionById(sectionId);

  if (!section) {
    return null;
  }

  return (
    <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{t(labelKey)}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            {sectionId === "beforePlay"
              ? t("wellness.warmUp")
              : sectionId === "duringPlay"
                ? t("wellness.waterNearby")
                : sectionId === "afterPlay"
                  ? t("wellness.coolDown")
                  : t("wellness.reflection")}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {section.stepIds.length}
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        {section.stepIds.map((stepId) => {
          const labelKeyForStep = getWellnessRoutineStepLabelKey(stepId);
          if (!labelKeyForStep) {
            return null;
          }

          const checked = checkedStepIds.includes(stepId);

          return (
            <label
              key={stepId}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm leading-6 transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none hover:-translate-y-0.5 hover:shadow-sm",
                checked ? "border-primary/30 bg-primary/5 shadow-sm" : "bg-background"
              )}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-muted-foreground/30 text-primary transition-colors duration-200 ease-out focus:ring-primary motion-reduce:transition-none"
                checked={checked}
                onChange={() => onToggleStep(stepId)}
              />
              <span>{t(labelKeyForStep)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function WellnessBadmintonCard({
  onOpenRoutineTemplate,
}: WellnessBadmintonCardProps) {
  const { t } = useI18n();
  const { value: routineEnabled, setValue: setRoutineEnabled } =
    usePersistentBoolean({
      key: WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
      defaultValue: true,
    });
  const { value: storedDate, setValue: setStoredDate } = usePersistentString({
    key: WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
    defaultValue: "",
  });
  const { value: storedCheckedSteps, setValue: setStoredCheckedSteps } =
    usePersistentString({
      key: WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
      defaultValue: "[]",
    });
  const { value: storedEnergy, setValue: setStoredEnergy } = usePersistentString({
    key: WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY,
    defaultValue: "",
  });
  const { value: storedFatigue, setValue: setStoredFatigue } =
    usePersistentString({
      key: WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY,
      defaultValue: "",
    });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!isWellnessRoutineEnabled(routineEnabled)) {
    return null;
  }

  const currentDate = getLocalDateKey(now);
  const dailyState = getWellnessRoutineDailyState({
    currentDate,
    storedDate,
    storedCheckedStepIds: storedCheckedSteps,
    storedEnergy,
    storedFatigue,
  });
  const effectiveCheckedStepIds =
    storedDate === currentDate
      ? dailyState.checkedStepIds
      : createDefaultWellnessRoutineDailyState(currentDate).checkedStepIds;

  const persistDailyState = (nextState: {
    checkedStepIds: WellnessRoutineStepId[];
    energy: WellnessRoutineEnergyLevel | null;
    fatigue: WellnessRoutineFatigueLevel | null;
  }) => {
    const storageState = {
      date: currentDate,
      checkedStepIds: nextState.checkedStepIds,
      energy: nextState.energy,
      fatigue: nextState.fatigue,
    };

    setStoredDate(storageState.date);
    setStoredCheckedSteps(JSON.stringify(normalizeWellnessRoutineCheckedStepIds(storageState.checkedStepIds)));
    setStoredEnergy(storageState.energy ?? "");
    setStoredFatigue(storageState.fatigue ?? "");

    saveWellnessRoutineDailyState(getSafeLocalStorage(), storageState);
  };

  const handleToggleStep = (stepId: WellnessRoutineStepId) => {
    persistDailyState({
      checkedStepIds: toggleWellnessRoutineStepId(effectiveCheckedStepIds, stepId),
      energy: dailyState.energy,
      fatigue: dailyState.fatigue,
    });
  };

  const handleResetToday = () => {
    persistDailyState({
      checkedStepIds: [],
      energy: null,
      fatigue: null,
    });
  };

  const handleSetEnergy = (energy: WellnessRoutineEnergyLevel) => {
    persistDailyState({
      checkedStepIds: effectiveCheckedStepIds,
      energy,
      fatigue: dailyState.fatigue,
    });
  };

  const handleSetFatigue = (fatigue: WellnessRoutineFatigueLevel) => {
    persistDailyState({
      checkedStepIds: effectiveCheckedStepIds,
      energy: dailyState.energy,
      fatigue,
    });
  };

  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
      <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Trees className="h-5 w-5" />
              </span>
              {t("wellness.badmintonRoutineTitle")}
            </CardTitle>
            <CardDescription>{t("wellness.badmintonRoutineDescription")}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="w-fit">
              {t("wellness.localOnlyChecklist")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("wellness.notMedicalAdvice")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 lg:grid-cols-2">
          <WellnessStepGroup
            sectionId="beforePlay"
            labelKey="wellness.beforePlay"
            checkedStepIds={effectiveCheckedStepIds}
            onToggleStep={handleToggleStep}
          />
          <WellnessStepGroup
            sectionId="duringPlay"
            labelKey="wellness.duringPlay"
            checkedStepIds={effectiveCheckedStepIds}
            onToggleStep={handleToggleStep}
          />
          <WellnessStepGroup
            sectionId="afterPlay"
            labelKey="wellness.afterPlay"
            checkedStepIds={effectiveCheckedStepIds}
            onToggleStep={handleToggleStep}
          />
          <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{t("wellness.reflection")}</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("wellness.anyDiscomfortNote")}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {t("wellness.markDone")}
              </Badge>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("wellness.energyToday")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {energyChoices.map(({ value, labelKey }) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={dailyState.energy === value ? "default" : "outline"}
                      aria-pressed={dailyState.energy === value}
                      onClick={() => handleSetEnergy(value)}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("wellness.fatigueToday")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {fatigueChoices.map(({ value, labelKey }) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={dailyState.fatigue === value ? "default" : "outline"}
                      aria-pressed={dailyState.fatigue === value}
                      onClick={() => handleSetFatigue(value)}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t("wellness.parkPreparation")}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("wellness.perspectiveSafeReminder")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onOpenRoutineTemplate("parkBadmintonRoutine")
                }
              >
                <Wind className="me-2 h-4 w-4" />
                {t("routines.viewRoutine")}
              </Button>
              <Button type="button" variant="ghost" onClick={handleResetToday}>
                <RefreshCcw className="me-2 h-4 w-4" />
                {t("wellness.resetToday")}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{t("wellness.beforePlay")}</Badge>
            <Badge variant="outline">{t("wellness.duringPlay")}</Badge>
            <Badge variant="outline">{t("wellness.afterPlay")}</Badge>
            <Badge variant="outline">{t("wellness.reflection")}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
