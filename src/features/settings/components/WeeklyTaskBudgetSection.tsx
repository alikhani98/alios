import { Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  formatWeeklyTaskBudgetInput,
  normalizeStoredWeeklyTaskBudget,
  parseWeeklyTaskBudgetInput,
  serializeWeeklyTaskBudget,
  WEEKLY_TASK_BUDGET_MAX,
  WEEKLY_TASK_BUDGET_MIN,
  WEEKLY_TASK_BUDGET_STORAGE_KEY,
  WEEKLY_TASK_BUDGET_STEP,
  type WeeklyTaskBudgetValidationError,
} from "@/shared/preferences/weeklyTaskBudget";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";

function readStoredBudget(): number | undefined {
  if (typeof window === "undefined") {
    return normalizeStoredWeeklyTaskBudget(
      globalThis.localStorage?.getItem(WEEKLY_TASK_BUDGET_STORAGE_KEY)
    );
  }

  try {
    return normalizeStoredWeeklyTaskBudget(
      window.localStorage.getItem(WEEKLY_TASK_BUDGET_STORAGE_KEY)
    );
  } catch {
    return undefined;
  }
}

function persistBudget(value: number | undefined): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value === undefined) {
      window.localStorage.removeItem(WEEKLY_TASK_BUDGET_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        WEEKLY_TASK_BUDGET_STORAGE_KEY,
        serializeWeeklyTaskBudget(value)
      );
    }

    window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT));
  } catch {
    // Keep the visible value in memory if localStorage is unavailable.
  }
}

function getValidationMessageKey(
  error: WeeklyTaskBudgetValidationError
): TranslationKey {
  switch (error) {
    case "empty":
      return "settings.wbEE";
    case "belowMin":
      return "settings.wbMin";
    case "aboveMax":
      return "settings.wbMax";
    case "notInteger":
    default:
      return "settings.wbIE";
  }
}

export function WeeklyTaskBudgetSection() {
  const { t } = useI18n();
  const [savedBudget, setSavedBudget] = useState<number | undefined>(
    readStoredBudget
  );
  const [inputValue, setInputValue] = useState(() =>
    formatWeeklyTaskBudgetInput(readStoredBudget())
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      const nextBudget = readStoredBudget();
      setSavedBudget(nextBudget);
      setInputValue(formatWeeklyTaskBudgetInput(nextBudget));
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, handleSync);
    };
  }, []);

  const validation = useMemo(
    () => parseWeeklyTaskBudgetInput(inputValue),
    [inputValue]
  );
  const inputIsEmpty = inputValue.trim().length === 0;
  const errorMessage =
    !inputIsEmpty && !validation.success
      ? t(getValidationMessageKey(validation.error), {
          min: WEEKLY_TASK_BUDGET_MIN,
          max: WEEKLY_TASK_BUDGET_MAX,
        })
      : null;
  const canSave =
    validation.success && validation.value !== savedBudget;
  const describedBy = errorMessage
    ? "weekly-task-budget-description weekly-task-budget-error"
    : "weekly-task-budget-description";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t("settings.wbT")}
        </CardTitle>
        <CardDescription>
          {t("settings.wbD")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <p
            id="weekly-task-budget-description"
            className="text-sm leading-7 text-muted-foreground"
          >
            {t("settings.wbH")}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("settings.wbN")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="weekly-task-budget-input"
            className="text-sm font-medium"
          >
            {t("settings.wbL")}
          </label>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_auto] sm:items-start">
            <Input
              id="weekly-task-budget-input"
              inputMode="numeric"
              min={WEEKLY_TASK_BUDGET_MIN}
              max={WEEKLY_TASK_BUDGET_MAX}
              step={WEEKLY_TASK_BUDGET_STEP}
              aria-describedby={describedBy}
              aria-invalid={errorMessage ? true : undefined}
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                setStatusMessage(null);
              }}
            />
            <span className="rounded-xl border bg-background px-3 py-2 text-sm leading-7 text-muted-foreground">
              {t("settings.wbU")}
            </span>
          </div>
          {errorMessage ? (
            <p
              id="weekly-task-budget-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSave}
            onClick={() => {
              if (!validation.success) {
                return;
              }

              persistBudget(validation.value);
              setSavedBudget(validation.value);
              setInputValue(formatWeeklyTaskBudgetInput(validation.value));
              setStatusMessage(t("settings.wbSv"));
            }}
          >
            {t("settings.wbS")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={savedBudget === undefined && inputIsEmpty}
            onClick={() => {
              persistBudget(undefined);
              setSavedBudget(undefined);
              setInputValue("");
              setStatusMessage(t("settings.wbCl"));
            }}
          >
            {t("settings.wbC")}
          </Button>
          <Badge variant="secondary" className="w-fit">
            {savedBudget === undefined
              ? t("settings.wb0")
              : t("settings.wb1", {
                  count: savedBudget,
                })}
          </Badge>
        </div>

        {statusMessage ? (
          <p
            role="status"
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
          >
            {statusMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
