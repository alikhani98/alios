import { Target } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { useStorageAdapter } from "@/core/storage";
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
import type { Task } from "@/shared/types";
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
import { cn } from "@/shared/utils/cn";

import {
  countWeeklyPlannedTasks,
  getWeeklyPlanningWeekStart,
  summarizeWeeklyPlanningBudget,
  type WeeklyPlanningBudgetStatus,
} from "@/features/weeklyReview/weeklyPlanningBudget";
import {
  getNextWeeklyTaskBudgetKeyboardValue,
  parseWeeklyTaskBudgetSliderValue,
} from "../weeklyTaskBudgetControl";
import {
  getWeeklyTaskBudgetText,
  type WeeklyTaskBudgetContentKey,
} from "../weeklyTaskBudgetContent";

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

function getDifferenceMessageKey(
  status: WeeklyPlanningBudgetStatus
): WeeklyTaskBudgetContentKey {
  switch (status) {
    case "underBudget":
      return "wbUn";
    case "atBudget":
      return "wbEq";
    case "overBudget":
      return "wbOv";
    case "notConfigured":
    default:
      return "wbD0";
  }
}

type BudgetSummaryCardProps = {
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "muted";
};

function BudgetSummaryCard({
  label,
  value,
  description,
  tone = "default",
}: BudgetSummaryCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border px-4 py-3",
        tone === "muted" ? "bg-muted/30" : "bg-background"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-2xl font-semibold tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function WeeklyTaskBudgetSection() {
  const { language, t } = useI18n();
  const { tasks: tasksRepository } = useStorageAdapter();
  const [savedBudget, setSavedBudget] = useState<number | undefined>(
    readStoredBudget
  );
  const [inputValue, setInputValue] = useState(() =>
    formatWeeklyTaskBudgetInput(readStoredBudget())
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLoadError, setTaskLoadError] = useState(false);

  useEffect(() => {
    let isActive = true;

    void tasksRepository
      .list()
      .then((loadedTasks) => {
        if (isActive) {
          setTasks(loadedTasks);
          setTaskLoadError(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setTasks([]);
          setTaskLoadError(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [tasksRepository]);

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
  const draftBudget = validation.success ? validation.value : undefined;
  const weekStart = getWeeklyPlanningWeekStart();
  const weeklyPlannedTaskCount = useMemo(
    () => countWeeklyPlannedTasks(tasks, weekStart),
    [tasks, weekStart]
  );
  const budgetSummary = useMemo(
    () =>
      summarizeWeeklyPlanningBudget({
        tasks,
        weeklyTaskBudget: draftBudget,
      }),
    [draftBudget, tasks]
  );
  const tx = (
    key: WeeklyTaskBudgetContentKey,
    values?: Parameters<typeof getWeeklyTaskBudgetText>[2]
  ) => getWeeklyTaskBudgetText(language, key, values);
  const differenceDescription = tx(
    getDifferenceMessageKey(budgetSummary.status),
    {
      count: Math.abs(budgetSummary.difference ?? 0),
    }
  );

  const setBudgetDraft = (value: number) => {
    const nextValue = String(value);
    setInputValue(nextValue);
    setStatusMessage(null);
  };

  const handleSliderKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (draftBudget === undefined) {
      return;
    }

    const nextValue = getNextWeeklyTaskBudgetKeyboardValue({
      currentValue: draftBudget,
      key: event.key,
    });

    if (nextValue === undefined) {
      return;
    }

    event.preventDefault();
    setBudgetDraft(nextValue);
  };

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

        {draftBudget === undefined ? (
          <div
            className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm leading-7 text-muted-foreground"
            id="weekly-task-budget-slider-description"
          >
            {tx("wbSt")}
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label
                htmlFor="weekly-task-budget-slider"
                className="text-sm font-medium"
              >
                {tx("wbSl")}
              </label>
              <Badge variant="outline" className="w-fit">
                {tx("wbDr", { count: draftBudget })}
              </Badge>
            </div>
            <input
              id="weekly-task-budget-slider"
              type="range"
              min={WEEKLY_TASK_BUDGET_MIN}
              max={WEEKLY_TASK_BUDGET_MAX}
              step={WEEKLY_TASK_BUDGET_STEP}
              value={draftBudget}
              aria-label={tx("wbSl")}
              aria-describedby="weekly-task-budget-description weekly-task-budget-slider-help"
              aria-valuemin={WEEKLY_TASK_BUDGET_MIN}
              aria-valuemax={WEEKLY_TASK_BUDGET_MAX}
              aria-valuenow={draftBudget}
              aria-valuetext={tx("wbDr", { count: draftBudget })}
              className="h-11 w-full min-w-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              onChange={(event) => {
                const nextValue = parseWeeklyTaskBudgetSliderValue(
                  event.currentTarget.value
                );
                if (nextValue !== undefined) {
                  setBudgetDraft(nextValue);
                }
              }}
              onKeyDown={handleSliderKeyDown}
            />
            <p
              id="weekly-task-budget-slider-help"
              className="text-xs leading-5 text-muted-foreground"
            >
              {tx("wbSh")}
            </p>
          </div>
        )}

        <div
          className="grid gap-3 sm:grid-cols-3"
          aria-label={tx("wbSu")}
        >
          <BudgetSummaryCard
            label={tx("wbB")}
            value={
              draftBudget === undefined
                ? t("settings.wb0")
                : t("settings.wb1", { count: draftBudget })
            }
            description={tx("wbBN")}
          />
          <BudgetSummaryCard
            label={tx("wbP")}
            value={weeklyPlannedTaskCount}
            description={
              taskLoadError
                ? tx("wbPU")
                : tx("wbPN")
            }
            tone={taskLoadError ? "muted" : "default"}
          />
          <BudgetSummaryCard
            label={tx("wbDf")}
            value={
              budgetSummary.difference === undefined
                ? tx("wbUk")
                : budgetSummary.difference
            }
            description={differenceDescription}
            tone={budgetSummary.status === "notConfigured" ? "muted" : "default"}
          />
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
