import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Dumbbell,
  Home,
  PiggyBank,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import { LIFE_AREA_DEFINITIONS } from "@/features/lifeAreas/constants";
import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { Button, Card, CardContent, Input } from "@/shared/ui";
import { cn } from "@/shared/utils/cn";
import type { LifeAreaKey } from "@/shared/types";

import {
  completeOnboarding,
  type OnboardingGoalOptionId,
  type OnboardingSelectedArea,
} from "../onboardingSeed";
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from "../onboardingStorage";

type Step = 0 | 1 | 2 | 3 | 4;

type GoalOption = {
  id: OnboardingGoalOptionId;
  areaKey: LifeAreaKey;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: typeof BookOpen;
  attention: OnboardingSelectedArea["attentionLevel"];
};

const TOTAL_PROGRESS_STEPS = 4;

const goalOptions: ReadonlyArray<GoalOption> = [
  {
    id: "learning",
    areaKey: "learning",
    labelKey: "onboarding.optionLearning",
    descriptionKey: "lifeAreas.learningDescription",
    icon: BookOpen,
    attention: "medium",
  },
  {
    id: "work",
    areaKey: "work",
    labelKey: "onboarding.optionWork",
    descriptionKey: "lifeAreas.workDescription",
    icon: BriefcaseBusiness,
    attention: "high",
  },
  {
    id: "health",
    areaKey: "health",
    labelKey: "onboarding.optionHealth",
    descriptionKey: "lifeAreas.healthDescription",
    icon: Dumbbell,
    attention: "high",
  },
  {
    id: "finance",
    areaKey: "finance",
    labelKey: "onboarding.optionFinance",
    descriptionKey: "lifeAreas.financeDescription",
    icon: PiggyBank,
    attention: "medium",
  },
  {
    id: "goals",
    areaKey: "personal",
    labelKey: "onboarding.optionGoals",
    descriptionKey: "lifeAreas.personalDescription",
    icon: Target,
    attention: "medium",
  },
  {
    id: "personal",
    areaKey: "relationships",
    labelKey: "onboarding.optionPersonal",
    descriptionKey: "lifeAreas.relationshipsDescription",
    icon: Home,
    attention: "medium",
  },
] as const;

function clampStep(step: number): Step {
  if (step <= 0) {
    return 0;
  }
  if (step >= 4) {
    return 4;
  }
  return step as Step;
}

export function OnboardingWizard() {
  const storage = useStorageAdapter();
  const navigate = useNavigate();
  const { direction, language, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState<OnboardingGoalOptionId[]>([]);
  const [firstTaskTitle, setFirstTaskTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(!isOnboardingCompleted());
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
        ) ?? []
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const handlePreferenceChange = () => {
      if (isOnboardingCompleted()) {
        setOpen(false);
      }
    };

    window.addEventListener("storage", handlePreferenceChange);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handlePreferenceChange);

    return () => {
      window.removeEventListener("storage", handlePreferenceChange);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handlePreferenceChange);
    };
  }, []);

  const selectedAreas = useMemo<OnboardingSelectedArea[]>(() => {
    return goalOptions
      .filter((option) => selectedGoalIds.includes(option.id))
      .map((option) => {
        const definition = LIFE_AREA_DEFINITIONS.find(
          (entry) => entry.areaKey === option.areaKey
        );

        return {
          id: option.id,
          areaKey: option.areaKey,
          title: t(definition?.titleKey ?? option.labelKey),
          description: t(definition?.descriptionKey ?? option.descriptionKey),
          attentionLevel: option.attention,
        };
      });
  }, [selectedGoalIds, t]);

  const canContinue =
    step === 0 ||
    step === 3 ||
    step === 4 ||
    (step === 1 && name.trim().length > 0 && name.trim().length <= 50) ||
    (step === 2 && selectedGoalIds.length > 0);

  const goNext = useCallback(() => {
    setError(null);
    setStep((current) => clampStep(current + 1));
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    setStep((current) => clampStep(current - 1));
  }, []);

  const toggleGoal = (id: OnboardingGoalOptionId) => {
    setSelectedGoalIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleComplete = async () => {
    if (selectedAreas.length === 0 || isCompleting) {
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      await completeOnboarding(storage, {
        displayName: name,
        selectedAreas,
        firstTaskTitle,
      }, language);
      markOnboardingCompleted();
      setOpen(false);
      navigate("/");
    } catch {
      setError(t("onboarding.saveError"));
      setIsCompleting(false);
    }
  };

  if (!open) {
    return null;
  }

  const progressStep = Math.min(step + 1, TOTAL_PROGRESS_STEPS);
  const nextIcon = direction === "rtl" ? ArrowLeft : ArrowRight;
  const NextIcon = nextIcon;

  return (
    <div
      className="fixed inset-0 z-[70] flex min-h-screen items-stretch justify-center bg-background/85 p-0 backdrop-blur-xl sm:p-4"
      data-testid="onboarding-wizard"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="flex h-screen w-full max-w-5xl flex-col overflow-hidden rounded-none border-0 bg-background/98 shadow-2xl sm:h-[min(48rem,calc(100vh-2rem))] sm:rounded-[2rem] sm:border"
        dir={direction}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("onboarding.stepCounter", {
                current: progressStep,
                total: TOTAL_PROGRESS_STEPS,
              })}
            </p>
            <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${(progressStep / TOTAL_PROGRESS_STEPS) * 100}%` }}
              />
            </div>
          </div>

          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label={t("onboarding.close")}
            title={t("onboarding.close")}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-8">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-4">
            <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
              {step === 0 ? (
                <section className="space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-sm">
                    <Sparkles aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <div className="space-y-3">
                    <h2
                      id="onboarding-title"
                      className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                      {t("onboarding.welcomeTitle")}
                    </h2>
                    <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {t("onboarding.welcomeDescription")}
                    </p>
                  </div>
                </section>
              ) : null}

              {step === 1 ? (
                <section className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2
                      id="onboarding-title"
                      className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      {t("onboarding.nameTitle")}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t("onboarding.nameDescription")}
                    </p>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">
                      {t("settings.displayName")}
                    </span>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value.slice(0, 50))}
                      maxLength={50}
                      required
                      autoFocus
                      placeholder={t("settings.displayNamePlaceholder")}
                    />
                  </label>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2
                      id="onboarding-title"
                      className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      {t("onboarding.goalsTitle")}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t("onboarding.goalsDescription")}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {goalOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = selectedGoalIds.includes(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={cn(
                            "flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-start transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                              : "border-border bg-card hover:bg-accent"
                          )}
                          aria-pressed={selected}
                          onClick={() => toggleGoal(option.id)}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon aria-hidden="true" className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 space-y-1">
                            <span className="block font-semibold">
                              {t(option.labelKey)}
                            </span>
                            <span className="block text-xs leading-6 text-muted-foreground">
                              {t(option.descriptionKey)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {step === 3 ? (
                <section className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2
                      id="onboarding-title"
                      className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      {t("onboarding.firstTaskTitle")}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {t("onboarding.firstTaskDescription")}
                    </p>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">
                      {t("onboarding.firstTaskLabel")}
                    </span>
                    <Input
                      value={firstTaskTitle}
                      onChange={(event) => setFirstTaskTitle(event.target.value)}
                      maxLength={120}
                      placeholder={t("onboarding.firstTaskPlaceholder")}
                    />
                  </label>
                </section>
              ) : null}

              {step === 4 ? (
                <section className="space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-alios-saffron/20 text-primary shadow-sm">
                    <Sparkles aria-hidden="true" className="h-7 w-7" />
                  </div>
                  <div className="space-y-3">
                    <h2
                      id="onboarding-title"
                      className="text-3xl font-semibold tracking-tight sm:text-4xl"
                    >
                      {t("onboarding.readyTitle")}
                    </h2>
                    <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {t("onboarding.readyDescription")}
                    </p>
                  </div>
                  <div className="mx-auto grid w-full max-w-xl gap-2 text-start text-sm text-muted-foreground">
                    <p>{t("onboarding.readyLifeAreas", { count: selectedAreas.length })}</p>
                    <p>
                      {t("onboarding.readyTasks", {
                        count: firstTaskTitle.trim() ? 3 : 2,
                      })}
                    </p>
                    <p>{t("onboarding.readyJournalProject")}</p>
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={step === 0 ? () => setOpen(false) : goBack}
              disabled={isCompleting}
            >
              {step === 0 ? t("onboarding.later") : t("onboarding.back")}
            </Button>

            {step < 4 ? (
              <Button type="button" onClick={goNext} disabled={!canContinue}>
                {step === 0 ? t("onboarding.start") : t("onboarding.next")}
                <NextIcon aria-hidden="true" className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={!canContinue || isCompleting}
              >
                {isCompleting ? t("onboarding.creating") : t("onboarding.finish")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only" data-onboarding-key={ONBOARDING_COMPLETED_STORAGE_KEY} />
    </div>
  );
}
