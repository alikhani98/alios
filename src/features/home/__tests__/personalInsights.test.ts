import { describe, expect, it } from "vitest";

import type { HomeDashboardData } from "../types";
import {
  buildPersonalInsightsSnapshot,
  calculateCompletionPercentage,
  countActiveProjects,
  countOverdueTasks,
  countUpcomingTasks,
  countUnprocessedInboxItems,
  getTaskCompletionProgress,
} from "../personalInsights";
import type { InboxItem, Project, Task } from "@/shared/types";

function createTask(
  id: string,
  dueDate?: string,
  overrides: Partial<Task> = {}
): Task {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    priority: "medium",
    dueDate,
    isMit: false,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function createProject(id: string, status: Project["status"]): Project {
  return {
    id,
    title: `Project ${id}`,
    status,
    priority: "medium",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

function createInboxItem(
  id: string,
  status: InboxItem["status"] = "unprocessed"
): InboxItem {
  return {
    id,
    content: `Inbox item ${id}`,
    type: "note",
    status,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

function createHomeData(overrides: Partial<HomeDashboardData> = {}): HomeDashboardData {
  return {
    tasks: [],
    today: {
      tasks: [],
      completedTaskCount: 0,
      checkin: undefined,
      mitTask: undefined,
    },
    projects: {
      totalCount: 0,
      activeCount: 0,
      recent: [],
    },
    journal: {
      totalCount: 0,
      latest: undefined,
    },
    knowledge: {
      totalCount: 0,
      latest: undefined,
    },
    goals: {
      totalCount: 0,
      activeCount: 0,
      reviewDueCount: 0,
      highImportanceActiveCount: 0,
      averageActiveProgress: null,
      latest: undefined,
    },
    manual: {
      totalCount: 0,
      activeCount: 0,
      reviewDueCount: 0,
      latest: undefined,
    },
    inbox: {
      unprocessedCount: 0,
    },
    isEmpty: true,
    ...overrides,
  };
}

describe("home personal insights helpers", () => {
  it("calculates completion percentage safely", () => {
    expect(calculateCompletionPercentage(3, 4)).toBe(75);
    expect(calculateCompletionPercentage(10, 4)).toBe(100);
    expect(calculateCompletionPercentage(0, 0)).toBe(0);
  });

  it("builds task completion progress with a zero-safe fallback", () => {
    expect(getTaskCompletionProgress([])).toEqual({
      completedCount: 0,
      totalCount: 0,
      remainingCount: 0,
      progress: 0,
    });

    expect(
      getTaskCompletionProgress([
        createTask("one", "2026-07-08", { status: "done" }),
        createTask("two", "2026-07-08"),
      ])
    ).toEqual({
      completedCount: 1,
      totalCount: 2,
      remainingCount: 1,
      progress: 50,
    });
  });

  it("counts overdue and upcoming tasks from existing local dates", () => {
    const referenceDate = new Date(2026, 6, 8);
    const tasks = [
      createTask("overdue", "2026-07-07"),
      createTask("today", "2026-07-08"),
      createTask("tomorrow", "2026-07-09"),
      createTask("week", "2026-07-13"),
      createTask("later", "2026-07-18"),
      createTask("done", "2026-07-07", { status: "done" }),
    ];

    expect(countOverdueTasks(tasks, referenceDate)).toBe(1);
    expect(countUpcomingTasks(tasks, referenceDate)).toBe(3);
  });

  it("counts active projects and unprocessed inbox items safely", () => {
    expect(
      countActiveProjects([
        createProject("active-1", "active"),
        createProject("waiting-1", "waiting"),
        createProject("active-2", "active"),
      ])
    ).toBe(2);

    expect(
      countUnprocessedInboxItems([
        createInboxItem("one"),
        createInboxItem("two"),
        createInboxItem("done", "processed"),
      ])
    ).toBe(2);
  });

  it("builds a safe snapshot for missing or empty data", () => {
    const snapshot = buildPersonalInsightsSnapshot(createHomeData());

    expect(snapshot.taskCompletion).toEqual({
      completedCount: 0,
      totalCount: 0,
      remainingCount: 0,
      progress: 0,
    });
    expect(snapshot.overdueCount).toBe(0);
    expect(snapshot.upcomingCount).toBe(0);
    expect(snapshot.activeProjectCount).toBe(0);
    expect(snapshot.unprocessedInboxCount).toBe(0);
    expect(snapshot.journalCount).toBe(0);
    expect(snapshot.knowledgeCount).toBe(0);
    expect(snapshot.wellnessProgress).toBeNull();
    expect(snapshot.hasAnyData).toBe(false);
  });

  it("builds a snapshot from the available home data", () => {
    const snapshot = buildPersonalInsightsSnapshot(
      createHomeData({
        tasks: [
          createTask("overdue", "2026-07-07"),
          createTask("today-1", "2026-07-08", { status: "done" }),
          createTask("today-2", "2026-07-08"),
          createTask("later", "2026-07-12"),
        ],
        today: {
          tasks: [
            createTask("today-1", "2026-07-08", { status: "done" }),
            createTask("today-2", "2026-07-08"),
          ],
          completedTaskCount: 1,
          mitTask: undefined,
          checkin: undefined,
        },
        projects: {
          totalCount: 2,
          activeCount: 1,
          recent: [createProject("active", "active")],
        },
        journal: {
          totalCount: 3,
          latest: undefined,
        },
        knowledge: {
          totalCount: 4,
          latest: undefined,
        },
        inbox: {
          unprocessedCount: 5,
        },
      }),
      {
        wellnessCheckedStepIds: ["gentleShoulderMovement", "gentleWristMovement"],
        wellnessTotalStepCount: 12,
        referenceDate: new Date(2026, 6, 8),
      }
    );

    expect(snapshot.taskCompletion).toEqual({
      completedCount: 1,
      totalCount: 2,
      remainingCount: 1,
      progress: 50,
    });
    expect(snapshot.overdueCount).toBe(1);
    expect(snapshot.upcomingCount).toBe(1);
    expect(snapshot.activeProjectCount).toBe(1);
    expect(snapshot.totalProjectCount).toBe(2);
    expect(snapshot.unprocessedInboxCount).toBe(5);
    expect(snapshot.journalCount).toBe(3);
    expect(snapshot.knowledgeCount).toBe(4);
    expect(snapshot.wellnessProgress).toEqual({
      completedCount: 2,
      totalCount: 12,
      progress: 16.666666666666664,
    });
    expect(snapshot.hasAnyData).toBe(true);
  });
});
