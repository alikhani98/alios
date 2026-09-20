import { describe, expect, it } from "vitest";

import type { FinanceObligation, Task } from "@/shared/types";
import { buildLocalReminderSnapshot } from "../localReminderResolver";

const task = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  title: "Review task",
  status: "todo",
  priority: "medium",
  isMit: false,
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-19T08:00:00.000Z",
  ...overrides,
});

const obligation = (
  overrides: Partial<FinanceObligation> = {}
): FinanceObligation => ({
  id: "obligation-1",
  type: "debt",
  title: "Pay debt",
  totalAmount: 1000,
  paidAmount: 0,
  status: "active",
  createdAt: "2026-09-01T08:00:00.000Z",
  updatedAt: "2026-09-19T08:00:00.000Z",
  ...overrides,
});

describe("buildLocalReminderSnapshot", () => {
  const referenceDate = new Date("2026-09-20T12:00:00.000Z");

  it("separates due-today and overdue open tasks", () => {
    const snapshot = buildLocalReminderSnapshot(
      [
        task({ id: "today", dueDate: "2026-09-20" }),
        task({ id: "overdue", dueDate: "2026-09-19" }),
        task({ id: "done", status: "done", dueDate: "2026-09-19" }),
        task({ id: "cancelled", status: "cancelled", dueDate: "2026-09-19" }),
        task({ id: "undated", dueDate: undefined }),
      ],
      [],
      referenceDate
    );

    expect(snapshot.dueTodayTasks.map((item) => item.task.id)).toEqual(["today"]);
    expect(snapshot.overdueTasks.map((item) => item.task.id)).toEqual(["overdue"]);
  });

  it("matches finance dueDay only on the exact day of month", () => {
    const dueToday = buildLocalReminderSnapshot(
      [],
      [obligation({ id: "due", dueDay: 20 })],
      referenceDate
    );
    const otherDay = buildLocalReminderSnapshot(
      [],
      [obligation({ id: "not-due", dueDay: 19 })],
      referenceDate
    );

    expect(dueToday.dueTodayObligations.map((item) => item.obligation.id)).toEqual([
      "due",
    ]);
    expect(otherDay.hasAnyReminder).toBe(false);
  });

  it("includes explicit overdue obligations and excludes paid or paused ones", () => {
    const snapshot = buildLocalReminderSnapshot(
      [],
      [
        obligation({ id: "overdue", dueDate: "2026-09-19" }),
        obligation({ id: "paid", dueDate: "2026-09-19", paidAmount: 1000 }),
        obligation({ id: "paused", dueDate: "2026-09-19", status: "paused" }),
      ],
      referenceDate
    );

    expect(snapshot.overdueObligations.map((item) => item.obligation.id)).toEqual([
      "overdue",
    ]);
  });

  it("produces an empty deterministic snapshot without reminder records", () => {
    expect(buildLocalReminderSnapshot([], [], referenceDate)).toEqual({
      dueTodayTasks: [],
      overdueTasks: [],
      dueTodayObligations: [],
      overdueObligations: [],
      totalCount: 0,
      hasAnyReminder: false,
      signature: "",
    });
  });
});
