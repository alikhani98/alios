import type {
  CreateFocusSessionInput,
} from "@/core/repositories/focusSessionsRepository";
import type { FocusSessionMode } from "@/shared/types";

export const POMODORO_WORK_SECONDS = 25 * 60;
export const POMODORO_SHORT_BREAK_SECONDS = 5 * 60;
export const POMODORO_LONG_BREAK_SECONDS = 15 * 60;
export const POMODORO_SESSIONS_PER_CYCLE = 4;
export const FREE_TIMER_MINUTES_MIN = 1;
export const FREE_TIMER_MINUTES_MAX = 180;

export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export type FocusTimerState = {
  mode: FocusSessionMode;
  phase: PomodoroPhase;
  pomodoroSession: number;
  freeMinutes: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
  startedAt?: string;
};

export type FocusTimerTickResult = {
  state: FocusTimerState;
  completed: boolean;
  completedWorkSession: boolean;
  completedSessionState?: FocusTimerState;
};

export function clampFreeTimerMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return 25;
  }

  return Math.min(
    FREE_TIMER_MINUTES_MAX,
    Math.max(FREE_TIMER_MINUTES_MIN, Math.round(value))
  );
}

export function getPhaseDurationSeconds(
  mode: FocusSessionMode,
  phase: PomodoroPhase,
  freeMinutes: number
): number {
  if (mode === "free") {
    return clampFreeTimerMinutes(freeMinutes) * 60;
  }

  if (phase === "longBreak") {
    return POMODORO_LONG_BREAK_SECONDS;
  }

  return phase === "shortBreak"
    ? POMODORO_SHORT_BREAK_SECONDS
    : POMODORO_WORK_SECONDS;
}

export function createInitialFocusTimerState(
  mode: FocusSessionMode = "pomodoro",
  freeMinutes = 25
): FocusTimerState {
  const safeFreeMinutes = clampFreeTimerMinutes(freeMinutes);

  return {
    mode,
    phase: "work",
    pomodoroSession: 1,
    freeMinutes: safeFreeMinutes,
    remainingSeconds: getPhaseDurationSeconds(mode, "work", safeFreeMinutes),
    elapsedSeconds: 0,
    isRunning: false,
  };
}

export function setFocusTimerMode(
  state: FocusTimerState,
  mode: FocusSessionMode
): FocusTimerState {
  return createInitialFocusTimerState(mode, state.freeMinutes);
}

export function setFocusTimerFreeMinutes(
  state: FocusTimerState,
  freeMinutes: number
): FocusTimerState {
  const safeFreeMinutes = clampFreeTimerMinutes(freeMinutes);

  if (state.mode !== "free" || state.isRunning || state.elapsedSeconds > 0) {
    return {
      ...state,
      freeMinutes: safeFreeMinutes,
    };
  }

  return {
    ...state,
    freeMinutes: safeFreeMinutes,
    remainingSeconds: safeFreeMinutes * 60,
  };
}

export function startFocusTimer(
  state: FocusTimerState,
  startedAt = new Date().toISOString()
): FocusTimerState {
  return {
    ...state,
    isRunning: true,
    startedAt: state.startedAt ?? startedAt,
  };
}

function advancePomodoroPhase(state: FocusTimerState): FocusTimerState {
  if (state.phase === "work") {
    const nextPhase =
      state.pomodoroSession >= POMODORO_SESSIONS_PER_CYCLE
        ? "longBreak"
        : "shortBreak";

    return {
      ...state,
      phase: nextPhase,
      remainingSeconds: getPhaseDurationSeconds(
        "pomodoro",
        nextPhase,
        state.freeMinutes
      ),
      elapsedSeconds: 0,
      isRunning: false,
      startedAt: undefined,
    };
  }

  const nextSession =
    state.phase === "longBreak"
      ? 1
      : Math.min(
          POMODORO_SESSIONS_PER_CYCLE,
          state.pomodoroSession + 1
        );

  return {
    ...state,
    phase: "work",
    pomodoroSession: nextSession,
    remainingSeconds: POMODORO_WORK_SECONDS,
    elapsedSeconds: 0,
    isRunning: false,
    startedAt: undefined,
  };
}

export function tickFocusTimer(
  state: FocusTimerState,
  seconds = 1
): FocusTimerTickResult {
  if (!state.isRunning) {
    return { state, completed: false, completedWorkSession: false };
  }

  const elapsedDelta = Math.max(0, Math.round(seconds));
  const remainingSeconds = Math.max(0, state.remainingSeconds - elapsedDelta);
  const elapsedSeconds = state.elapsedSeconds + elapsedDelta;
  const completed = remainingSeconds === 0;
  const completedWorkSession =
    completed && (state.mode === "free" || state.phase === "work");

  if (!completed) {
    return {
      state: {
        ...state,
        remainingSeconds,
        elapsedSeconds,
      },
      completed: false,
      completedWorkSession: false,
    };
  }

  if (state.mode === "free") {
    return {
      state: {
        ...state,
        remainingSeconds: 0,
        elapsedSeconds,
        isRunning: false,
      },
      completed: true,
      completedWorkSession,
      completedSessionState: {
        ...state,
        remainingSeconds: 0,
        elapsedSeconds,
        isRunning: false,
      },
    };
  }

  return {
    state: advancePomodoroPhase({
      ...state,
      remainingSeconds: 0,
      elapsedSeconds,
    }),
    completed: true,
    completedWorkSession,
    completedSessionState: {
      ...state,
      remainingSeconds: 0,
      elapsedSeconds,
      isRunning: false,
    },
  };
}

export function resetFocusTimer(state: FocusTimerState): FocusTimerState {
  return {
    ...createInitialFocusTimerState(state.mode, state.freeMinutes),
    phase: state.mode === "pomodoro" ? state.phase : "work",
    pomodoroSession: state.pomodoroSession,
  };
}

export function formatFocusTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export function createFocusSessionInput(params: {
  state: FocusTimerState;
  taskId?: string;
  completedAt?: string;
  interrupted: boolean;
}): CreateFocusSessionInput {
  return {
    startedAt: params.state.startedAt ?? new Date().toISOString(),
    durationMinutes: Math.max(
      0,
      Math.round((params.state.elapsedSeconds / 60) * 100) / 100
    ),
    mode: params.state.mode,
    taskId: params.taskId,
    completedAt: params.completedAt,
    interrupted: params.interrupted,
  };
}
