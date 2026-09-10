import { describe, expect, it, vi } from "vitest";

import type { StorageAdapter } from "@/core/storage";
import {
  addQuickAccessItem,
  createQuickAccessItem,
  normalizeQuickAccessPreference,
  parseQuickAccessPreference,
  QUICK_ACCESS_DEFAULT_PREFERENCE,
} from "../quickAccess";
import { resolveQuickAccessItems } from "../resolver";

describe("quick access preferences", () => {
  it("parses and normalizes the versioned preference shape", () => {
    expect(
      parseQuickAccessPreference(
        JSON.stringify({
          version: 99,
          items: [
            { id: "module:today", itemType: "module", order: 4, enabled: true },
            { id: "module:today", itemType: "module", order: 1, enabled: false },
            { id: "goal:g1", itemType: "goal", targetId: "g1", order: 2, enabled: true },
            { id: "invalid", itemType: "unknown", order: 3, enabled: true },
          ],
        })
      )
    ).toEqual({
      version: 1,
      items: [
        { id: "module:today", itemType: "module", order: 0, enabled: true },
        { id: "goal:g1", itemType: "goal", targetId: "g1", order: 1, enabled: true },
      ],
    });
  });

  it("prevents duplicate shortcuts while preserving the existing preference", () => {
    const item = createQuickAccessItem("goal", "g1");
    const preference = addQuickAccessItem(
      addQuickAccessItem(QUICK_ACCESS_DEFAULT_PREFERENCE, item),
      item
    );

    expect(preference.items.filter((entry) => entry.id === "goal:g1")).toHaveLength(1);
  });

  it("normalizes malformed values to a safe empty preference", () => {
    expect(normalizeQuickAccessPreference({ items: [{ id: "", itemType: "goal" }] })).toEqual({
      version: 1,
      items: [],
    });
  });
});

describe("quick access resolver", () => {
  it("resolves module routes and reports orphaned entity shortcuts", async () => {
    const storage = {
      resources: {
        list: vi.fn(async () => []),
      },
    } as unknown as StorageAdapter;

    const resolved = await resolveQuickAccessItems(
      [
        {
          id: "module:today",
          itemType: "module",
          order: 0,
          enabled: true,
        },
        {
          id: "resource:missing",
          itemType: "resource",
          targetId: "missing",
          order: 1,
          enabled: true,
        },
      ],
      storage,
      (key) => key
    );

    expect(resolved[0]).toMatchObject({
      title: "nav.today",
      href: "/today",
      unavailable: false,
    });
    expect(resolved[1]).toMatchObject({
      title: "quickAccess.unavailable",
      href: undefined,
      unavailable: true,
    });
  });
});
