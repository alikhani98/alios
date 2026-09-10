import { describe, expect, it } from "vitest";

import { resourceRecord } from "@/test/factories";
import {
  filterResources,
  getResourceLibrarySummary,
  sortResources,
} from "../resourceLibrary";
import { parseResourceViewMode } from "../resourceViewMode";

describe("resource library derived views", () => {
  const resources = [
    {
      ...resourceRecord,
      id: "book",
      title: "Atomic Habits",
      type: "book" as const,
      status: "in_progress" as const,
      format: "physical" as const,
      progressPercent: 40,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
    },
    {
      ...resourceRecord,
      id: "course",
      title: "TypeScript Course",
      type: "course" as const,
      status: "completed" as const,
      format: "online" as const,
      progressPercent: 100,
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    },
    {
      ...resourceRecord,
      id: "website",
      title: "Web Notes",
      type: "website" as const,
      status: "unread" as const,
      progressPercent: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
    },
  ];

  it("calculates a summary without changing resource records", () => {
    expect(getResourceLibrarySummary(resources)).toEqual({
      total: 3,
      books: 1,
      courses: 1,
      websites: 1,
      inProgress: 1,
      completed: 1,
    });
  });

  it("filters by type, status, and format", () => {
    expect(
      filterResources(resources, {
        type: "book",
        status: "in_progress",
        format: "physical",
      }).map((resource) => resource.id)
    ).toEqual(["book"]);
  });

  it("sorts by title, newest, oldest, updated time, and progress", () => {
    expect(sortResources(resources, "title").map((resource) => resource.id)).toEqual([
      "book",
      "course",
      "website",
    ]);
    expect(sortResources(resources, "newest").map((resource) => resource.id)).toEqual([
      "course",
      "book",
      "website",
    ]);
    expect(sortResources(resources, "oldest").map((resource) => resource.id)).toEqual([
      "website",
      "book",
      "course",
    ]);
    expect(sortResources(resources, "updated").map((resource) => resource.id)).toEqual([
      "website",
      "course",
      "book",
    ]);
    expect(sortResources(resources, "progress").map((resource) => resource.id)).toEqual([
      "course",
      "book",
      "website",
    ]);
    expect(resources[0].id).toBe("book");
  });

  it("accepts only the supported view modes", () => {
    expect(parseResourceViewMode("grid")).toBe("grid");
    expect(parseResourceViewMode("list")).toBe("list");
    expect(parseResourceViewMode("graph")).toBe("list");
  });
});
