import { format, isWithinInterval, parseISO, subDays } from "date-fns";
import {
  Bell,
  BellOff,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { FocusSession, FocusSessionMode, Task } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  Select,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { cn } from "@/shared/utils/cn";
import {
  createFocusSessionInput,
  createInitialFocusTimerState,
  FocusTimerState,
  formatFocusTime,
  getPhaseDurationSeconds,
  resetFocusTimer,
  setFocusTimerFreeMinutes,
  setFocusTimerMode,
  startFocusTimer,
  tickFocusTimer,
} from "../focusTimer";

function getTodayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function isActiveTodayTask(task: Task, today: string) {
  return task.dueDate === today && task.status !== "done";
}

function playFocusBeep() {
  if (typeof window === "undefined") {
    return;
  }

  const audioWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);
    oscillator.addEventListener("ended", () => {
      void context.close();
    });
  } catch {
    // Audio feedback is optional and must never block a completed session.
  }
}

function showFocusNotification(title: string, body: string) {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new Notification(title, { body });
  } catch {
    // Browser notifications are optional; unsupported cases stay silent.
  }
}

function buildFocusStats(sessions: FocusSession[]) {
  const today = getTodayDate();
  const now = new Date();
  const weekStart = subDays(now, 6);
  const todaySessions = sessions.filter(
    (session) => format(parseISO(session.startedAt), "yyyy-MM-dd") === today
  );
  const weekSessions = sessions.filter((session) =>
    isWithinInterval(parseISO(session.startedAt), {
      start: weekStart,
      end: now,
    })
  );

  return {
    todaySessions: todaySessions.length,
    todayMinutes: Math.round(
      todaySessions.reduce((total, session) => total + session.durationMinutes, 0)
    ),
    weekSessions: weekSessions.length,
  };
}

function getPhaseLabelKey(timerState: FocusTimerState) {
  if (timerState.mode === "free") {
    return "focus.phaseFree" as const;
  }

  if (timerState.phase === "longBreak") {
    return "focus.phaseLongBreak" as const;
  }

  return timerState.phase === "shortBreak"
    ? ("focus.phaseShortBreak" as const)
    : ("focus.phaseWork" as const);
}

export function FocusPage() {
  const { t } = useI18n();
  const { focusSessions, tasks: tasksRepository } = useStorageAdapter();
  const [timerState, setTimerState] = useState<FocusTimerState>(() =>
    createInitialFocusTimerState()
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const selectedTaskIdRef = useRef(selectedTaskId);
  const completionInFlightRef = useRef(false);

  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  const loadFocusData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const today = getTodayDate();
      const [allTasks, allSessions] = await Promise.all([
        tasksRepository.list(),
        focusSessions.list(),
      ]);
      const todayTasks = allTasks.filter((task) =>
        isActiveTodayTask(task, today)
      );
      setTasks(todayTasks);
      setSessions(allSessions);
      if (
        selectedTaskIdRef.current &&
        !todayTasks.some((task) => task.id === selectedTaskIdRef.current)
      ) {
        setSelectedTaskId("");
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : t("focus.loadError")
      );
    } finally {
      setIsLoading(false);
    }
  }, [focusSessions, tasksRepository, t]);

  useEffect(() => {
    void loadFocusData();
  }, [loadFocusData]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [selectedTaskId, tasks]
  );
  const stats = useMemo(() => buildFocusStats(sessions), [sessions]);
  const phaseLabel = t(getPhaseLabelKey(timerState));
  const modeLabel =
    timerState.mode === "pomodoro" ? t("focus.modePomodoro") : t("focus.modeFree");
  const phaseDurationSeconds = getPhaseDurationSeconds(
    timerState.mode,
    timerState.phase,
    timerState.freeMinutes
  );
  const progressPercent =
    phaseDurationSeconds > 0
      ? Math.round(
          ((phaseDurationSeconds - timerState.remainingSeconds) /
            phaseDurationSeconds) *
            100
        )
      : 0;

  const persistSession = useCallback(
    async (completedState: FocusTimerState, interrupted: boolean) => {
      const shouldPersist =
        completedState.mode === "free" || completedState.phase === "work";

      if (!shouldPersist || completedState.elapsedSeconds <= 0) {
        return;
      }

      const completedAt = interrupted ? undefined : new Date().toISOString();
      const session = await focusSessions.create(
        createFocusSessionInput({
          state: completedState,
          taskId: selectedTaskIdRef.current || undefined,
          completedAt,
          interrupted,
        })
      );
      setSessions((current) => [session, ...current]);
    },
    [focusSessions]
  );

  const completeTimerPhase = useCallback(
    async (completedState: FocusTimerState) => {
      if (completionInFlightRef.current) {
        return;
      }

      completionInFlightRef.current = true;
      setSaveError(null);

      try {
        playFocusBeep();
        showFocusNotification(
          t("focus.notificationTitle"),
          selectedTask
            ? t("focus.notificationBodyWithTask", { title: selectedTask.title })
            : t("focus.notificationBody")
        );
        await persistSession(completedState, false);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : t("focus.saveError")
        );
      } finally {
        completionInFlightRef.current = false;
      }
    },
    [persistSession, selectedTask, t]
  );

  useEffect(() => {
    if (!timerState.isRunning) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimerState((current) => {
        const result = tickFocusTimer(current);

        if (
          result.completed &&
          result.completedWorkSession &&
          result.completedSessionState
        ) {
          void completeTimerPhase(result.completedSessionState);
        }

        return result.state;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [completeTimerPhase, timerState.isRunning]);

  const handleModeChange = (mode: FocusSessionMode) => {
    setTimerState((current) => setFocusTimerMode(current, mode));
    setSaveError(null);
  };

  const handleStartPause = () => {
    setTimerState((current) =>
      current.isRunning ? { ...current, isRunning: false } : startFocusTimer(current)
    );
  };

  const handleReset = async () => {
    const currentState = timerState;
    setTimerState((current) => resetFocusTimer(current));
    setSaveError(null);

    if (
      currentState.startedAt &&
      currentState.elapsedSeconds > 0 &&
      (currentState.mode === "free" || currentState.phase === "work")
    ) {
      try {
        await persistSession(
          {
            ...currentState,
            isRunning: false,
          },
          true
        );
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : t("focus.saveError")
        );
      }
    }
  };

  const isNotificationReady =
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted";
  const notificationLabel = isNotificationReady
    ? t("focus.notificationReady")
    : t("focus.notificationUnavailable");

  return (
    <div className="alios-page space-y-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Badge variant="secondary" className="w-fit">
              {t("focus.eyebrow")}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("focus.title")}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {t("focus.description")}
            </p>
          </div>
          <StatusChip tone="warning">{t("focus.tabOpenOnly")}</StatusChip>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Timer className="h-5 w-5" aria-hidden="true" />}
          label={t("focus.todaySessions")}
          value={stats.todaySessions}
          description={t("focus.todaySessionsDescription")}
        />
        <MetricCard
          icon={<Coffee className="h-5 w-5" aria-hidden="true" />}
          label={t("focus.todayMinutes")}
          value={stats.todayMinutes}
          description={t("focus.todayMinutesDescription")}
        />
        <MetricCard
          icon={<Timer className="h-5 w-5" aria-hidden="true" />}
          label={t("focus.weekSessions")}
          value={stats.weekSessions}
          description={t("focus.weekSessionsDescription")}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("focus.timerTitle")}</CardTitle>
              <CardDescription>{t("focus.timerDescription")}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={timerState.mode === "pomodoro" ? "default" : "outline"}
                onClick={() => handleModeChange("pomodoro")}
                disabled={timerState.isRunning || timerState.elapsedSeconds > 0}
              >
                {t("focus.modePomodoro")}
              </Button>
              <Button
                type="button"
                variant={timerState.mode === "free" ? "default" : "outline"}
                onClick={() => handleModeChange("free")}
                disabled={timerState.isRunning || timerState.elapsedSeconds > 0}
              >
                {t("focus.modeFree")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-5 sm:pt-6">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[1.75rem] border border-primary/15 bg-alios-paper/45 p-5 shadow-sm dark:bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">
                    {modeLabel}
                  </p>
                  <h2 className="text-xl font-semibold">{phaseLabel}</h2>
                </div>
                {timerState.mode === "pomodoro" ? (
                  <StatusChip tone="primary">
                    {t("focus.sessionCounter", {
                      current: timerState.pomodoroSession,
                      total: 4,
                    })}
                  </StatusChip>
                ) : null}
              </div>

              <div className="py-8 text-center">
                <p className="font-mono text-[4rem] font-semibold tabular-nums leading-none tracking-tight text-primary sm:text-[6rem]">
                  {formatFocusTime(timerState.remainingSeconds)}
                </p>
                <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-background/80">
                  <div
                    className="h-full rounded-full bg-alios-saffron transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" size="lg" onClick={handleStartPause}>
                  {timerState.isRunning ? (
                    <Pause className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Play className="h-5 w-5" aria-hidden="true" />
                  )}
                  {timerState.isRunning ? t("focus.pause") : t("focus.start")}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={handleReset}>
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                  {t("focus.reset")}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {timerState.mode === "free" ? (
                <SoftPanel className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="focus-free-minutes">
                    {t("focus.freeMinutesLabel")}
                  </label>
                  <Input
                    id="focus-free-minutes"
                    type="number"
                    min={1}
                    max={180}
                    value={timerState.freeMinutes}
                    disabled={timerState.isRunning || timerState.elapsedSeconds > 0}
                    onChange={(event) =>
                      setTimerState((current) =>
                        setFocusTimerFreeMinutes(
                          current,
                          Number(event.target.value)
                        )
                      )
                    }
                  />
                  <p className="text-xs leading-6 text-muted-foreground">
                    {t("focus.freeMinutesHint")}
                  </p>
                </SoftPanel>
              ) : (
                <SoftPanel className="space-y-2">
                  <h3 className="font-semibold">{t("focus.pomodoroRhythmTitle")}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {t("focus.pomodoroRhythmDescription")}
                  </p>
                </SoftPanel>
              )}

              <SoftPanel className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="focus-task">
                  {t("focus.taskLabel")}
                </label>
                <Select
                  id="focus-task"
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  disabled={timerState.isRunning}
                >
                  <option value="">{t("focus.noTaskOption")}</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </Select>
                <p className="text-xs leading-6 text-muted-foreground">
                  {isLoading
                    ? t("focus.loadingTasks")
                    : tasks.length > 0
                      ? t("focus.taskHint")
                      : t("focus.noTodayTasks")}
                </p>
              </SoftPanel>

              <SoftPanel className="flex items-start gap-3">
                {isNotificationReady ? (
                  <Bell className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <BellOff className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                <p className="text-sm leading-7 text-muted-foreground">
                  {notificationLabel}
                </p>
              </SoftPanel>
            </div>
          </div>

          {loadError ? (
            <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {t("focus.loadError")}: {loadError}
            </p>
          ) : null}
          {saveError ? (
            <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {t("focus.saveError")}: {saveError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className={cn(
                  "rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm",
                  session.interrupted && "border-alios-saffron/40 bg-alios-saffron/10"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {session.mode === "pomodoro"
                      ? t("focus.modePomodoro")
                      : t("focus.modeFree")}
                  </span>
                  <span className="font-mono tabular-nums">
                    {Math.round(session.durationMinutes)} {t("focus.minutesShort")}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {format(parseISO(session.startedAt), "yyyy-MM-dd HH:mm")}
                  {session.interrupted ? ` · ${t("focus.interrupted")}` : ""}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
