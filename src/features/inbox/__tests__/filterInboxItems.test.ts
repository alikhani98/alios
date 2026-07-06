import { describe, expect, it } from "vitest";

import type { InboxItem } from "@/shared/types";
import { filterInboxItems } from "../filterInboxItems";

const timestamp = "2026-07-05T08:30:00.000Z";

const items: InboxItem[] = [
  {
    id: "idea",
    content: "Read the BOOK about product thinking",
    type: "idea",
    status: "unprocessed",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "task",
    content: "Return library book",
    type: "task",
    status: "processed",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "note",
    content: "Plan the weekend",
    type: "note",
    status: "unprocessed",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

describe("filterInboxItems", () => {
  it("matches content case-insensitively and trims the query", () => {
    expect(
      filterInboxItems(items, { query: "  book  ", status: "all", type: "all" })
    ).toHaveLength(2);
  });

  it("returns all items matching filters for an empty query", () => {
    expect(
      filterInboxItems(items, { query: "   ", status: "unprocessed", type: "all" })
    ).toEqual([items[0], items[2]]);
  });

  it("filters by status", () => {
    expect(
      filterInboxItems(items, { query: "", status: "processed", type: "all" })
    ).toEqual([items[1]]);
  });

  it("filters by type", () => {
    expect(
      filterInboxItems(items, { query: "", status: "all", type: "note" })
    ).toEqual([items[2]]);
  });

  it("combines search, status, and type filters", () => {
    expect(
      filterInboxItems(items, {
        query: "book",
        status: "unprocessed",
        type: "idea",
      })
    ).toEqual([items[0]]);
  });

  it("returns an empty result when nothing matches", () => {
    expect(
      filterInboxItems(items, { query: "missing", status: "processed", type: "link" })
    ).toEqual([]);
  });
});
