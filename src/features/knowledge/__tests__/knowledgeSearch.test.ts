import { describe, expect, it } from "vitest";

import type { KnowledgeItem } from "@/shared/types";

import { buildKnowledgeExcerpt, searchKnowledgeItems } from "../knowledgeSearch";

function item(
  id: string,
  title: string,
  content: string,
  summary?: string
): KnowledgeItem {
  return {
    id,
    title,
    type: "note",
    summary,
    content,
    createdAt: "2026-08-17T08:00:00.000Z",
    updatedAt: "2026-08-17T08:00:00.000Z",
  };
}

describe("Knowledge smart search", () => {
  it("gives exact title matches the highest score", () => {
    const [result] = searchKnowledgeItems(
      [
        item("content", "Plain note", "Deep work is important."),
        item("title", "Deep work", "Unrelated content."),
      ],
      "deep work"
    );

    expect(result.item.id).toBe("title");
    expect(result.score).toBe(1000);
  });

  it("orders results by ranking strength", () => {
    const results = searchKnowledgeItems(
      [
        item("partial", "Deep rituals", "A note about routines."),
        item("body", "Meeting notes", "Deep work blocks protect attention."),
        item("title", "Deep work blocks", "A short rule."),
      ],
      "deep work"
    );

    expect(results.map((result) => result.item.id)).toEqual([
      "title",
      "body",
      "partial",
    ]);
  });

  it("returns no results when nothing matches", () => {
    expect(
      searchKnowledgeItems([item("a", "Inbox rule", "Capture first.")], "budget")
    ).toEqual([]);
  });

  it("highlights query words in the excerpt", () => {
    const excerpt = buildKnowledgeExcerpt(
      item("a", "Planning rule", "Keep deep work protected in the morning."),
      "deep morning"
    );

    expect(excerpt.filter((segment) => segment.highlighted).map((segment) => segment.text.toLocaleLowerCase())).toEqual([
      "deep",
      "morning",
    ]);
  });
});
