import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type {
  DailyCheckin,
  Goal,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

import {
  HomePersonalMetricsCard,
  HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY,
  readStoredPersonalMetricsOpen,
  writeStoredPersonalMetricsOpen,
} from "../components/HomePersonalMetricsCard";
import { buildHomePersonalMetrics } from "../personalMetrics";

const now = new Date("2026-08-15T10:00:00.000Z");

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task",
    title: overrides.title ?? "Task",
    status: overrides.status ?? "todo",
    priority: overrides.priority ?? "medium",
    isMit: overrides.isMit ?? false,
    dueDate: overrides.dueDate,
    completedAt: overrides.completedAt,
    createdAt: overrides.createdAt ?? "2026-08-01T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T08:00:00.000Z",
  };
}

function journalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: overrides.id ?? "journal",
    title: overrides.title ?? "Journal",
    content: overrides.content ?? "Reflection",
    type: overrides.type ?? "daily",
    date: overrides.date ?? "2026-08-15",
    createdAt: overrides.createdAt ?? "2026-08-15T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T08:00:00.000Z",
  };
}

function knowledgeItem(overrides: Partial<KnowledgeItem> = {}): KnowledgeItem {
  return {
    id: overrides.id ?? "knowledge",
    title: overrides.title ?? "Knowledge",
    content: overrides.content ?? "Note",
    type: overrides.type ?? "note",
    createdAt: overrides.createdAt ?? "2026-08-15T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T08:00:00.000Z",
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: overrides.id ?? "project",
    title: overrides.title ?? "Project",
    status: overrides.status ?? "active",
    priority: overrides.priority ?? "medium",
    createdAt: overrides.createdAt ?? "2026-08-15T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T08:00:00.000Z",
  };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: overrides.id ?? "goal",
    title: overrides.title ?? "Goal",
    description: overrides.description ?? "A goal",
    area: overrides.area ?? "work",
    timeframe: overrides.timeframe ?? "quarter",
    status: overrides.status ?? "active",
    importance: overrides.importance ?? "medium",
    progressPercent: overrides.progressPercent ?? 0,
    tags: overrides.tags ?? [],
    createdAt: overrides.createdAt ?? "2026-08-15T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-08-15T08:00:00.000Z",
  };
}

function checkin(date: string): DailyCheckin {
  return {
    id: `checkin-${date}`,
    date,
    sleepQuality: "good",
    energyLevel: "good",
    moodLevel: "good",
    stressLevel: "low",
    medicationDone: true,
    smokingStatus: "none",
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

function renderMetricsCard(metrics = buildHomePersonalMetrics({
  tasks: [],
  journalEntries: [],
  knowledgeItems: [],
  projects: [],
  goals: [],
  dailyCheckins: [],
}, now)) {
  return renderToStaticMarkup(
    createElement(
      I18nProvider,
      null,
      createElement(HomePersonalMetricsCard, { metrics })
    )
  );
}

describe("Home personal metrics", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("calculates life metrics from existing local records", () => {
    const metrics = buildHomePersonalMetrics(
      {
        tasks: [
          task({ id: "done-old", status: "done", completedAt: "2026-07-01T08:00:00.000Z" }),
          task({ id: "done-week", status: "done", completedAt: "2026-08-14T08:00:00.000Z" }),
          task({ id: "active", status: "todo" }),
          task({ id: "cancelled", status: "cancelled" }),
        ],
        journalEntries: [
          journalEntry({ id: "journal-month", date: "2026-08-01" }),
          journalEntry({ id: "journal-old", date: "2026-06-01" }),
        ],
        knowledgeItems: [knowledgeItem()],
        projects: [
          project({ id: "active-project", status: "active" }),
          project({ id: "archived-project", status: "archived" }),
        ],
        goals: [
          goal({ id: "active-goal", status: "active" }),
          goal({ id: "archived-goal", status: "archived" }),
        ],
        dailyCheckins: [
          checkin("2026-08-15"),
          checkin("2026-08-14"),
          checkin("2026-08-13"),
        ],
      },
      now
    );

    expect(metrics.tasks.completedAllTime).toBe(2);
    expect(metrics.tasks.completedLastSevenDays).toBe(1);
    expect(metrics.tasks.activeNow).toBe(1);
    expect(metrics.journal.totalEntries).toBe(2);
    expect(metrics.journal.entriesLastThirtyDays).toBe(1);
    expect(metrics.knowledge.totalItems).toBe(1);
    expect(metrics.projects.activeCount).toBe(1);
    expect(metrics.goals.activeCount).toBe(1);
    expect(metrics.checkins.currentStreak).toBe(3);
    expect(metrics.checkins.completionPercentLastThirtyDays).toBe(10);
  });

  it("renders an encouraging empty state when every metric is zero", () => {
    const markup = renderMetricsCard();

    expect(markup).toContain("My life stats");
    expect(markup).toContain("Your stats will grow with use");
    expect(markup).toContain('aria-expanded="false"');
  });

  it("persists and restores the collapsed state in localStorage", () => {
    expect(readStoredPersonalMetricsOpen(false)).toBe(false);

    writeStoredPersonalMetricsOpen(true);
    expect(localStorage.getItem(HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY)).toBe("true");
    expect(readStoredPersonalMetricsOpen(false)).toBe(true);

    writeStoredPersonalMetricsOpen(false);
    expect(localStorage.getItem(HOME_PERSONAL_METRICS_OPEN_STORAGE_KEY)).toBe("false");
    expect(readStoredPersonalMetricsOpen(true)).toBe(false);
  });
});
