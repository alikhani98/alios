import { describe, expect, it } from "vitest";

import {
  createInitialFocusTimerState,
  POMODORO_SHORT_BREAK_SECONDS,
  POMODORO_WORK_SECONDS,
  startFocusTimer,
  tickFocusTimer,
} from "../focusTimer";

describe("focus timer helpers", () => {
  it("moves Pomodoro work to a short break after 25 minutes", () => {
    const running = startFocusTimer(createInitialFocusTimerState("pomodoro"));

    const result = tickFocusTimer(running, POMODORO_WORK_SECONDS);

    expect(result.completed).toBe(true);
    expect(result.completedWorkSession).toBe(true);
    expect(result.completedSessionState?.elapsedSeconds).toBe(
      POMODORO_WORK_SECONDS
    );
    expect(result.state.phase).toBe("shortBreak");
    expect(result.state.remainingSeconds).toBe(POMODORO_SHORT_BREAK_SECONDS);
    expect(result.state.isRunning).toBe(false);
  });

  it("runs and completes a free timer with a custom duration", () => {
    const running = startFocusTimer(createInitialFocusTimerState("free", 12));

    const result = tickFocusTimer(running, 12 * 60);

    expect(result.completed).toBe(true);
    expect(result.completedWorkSession).toBe(true);
    expect(result.completedSessionState?.mode).toBe("free");
    expect(result.completedSessionState?.elapsedSeconds).toBe(12 * 60);
    expect(result.state.remainingSeconds).toBe(0);
    expect(result.state.isRunning).toBe(false);
  });
});
