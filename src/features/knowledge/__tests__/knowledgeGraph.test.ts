import { describe, expect, it } from "vitest";

import type { KnowledgeItem } from "@/shared/types";

import {
  buildBacklinksByItemId,
  buildKnowledgeGraph,
  extractWikiReferences,
} from "../knowledgeGraph";

function item(
  id: string,
  title: string,
  content: string
): KnowledgeItem {
  return {
    id,
    title,
    type: "note",
    content,
    createdAt: "2026-08-17T08:00:00.000Z",
    updatedAt: "2026-08-17T08:00:00.000Z",
  };
}

describe("Knowledge graph", () => {
  it("extracts wiki references from item content", () => {
    expect(extractWikiReferences("Use [[Deep Work]] and [[Inbox Zero]].")).toEqual([
      "Deep Work",
      "Inbox Zero",
    ]);
  });

  it("builds nodes and edges from matching wiki references", () => {
    const graph = buildKnowledgeGraph([
      item("source", "Source", "Read [[Target]]."),
      item("target", "Target", "Plain note."),
    ]);

    expect(graph.nodes.map((node) => node.id)).toEqual(["source", "target"]);
    expect(graph.edges).toEqual([
      {
        id: "source->target",
        sourceId: "source",
        targetId: "target",
      },
    ]);
  });

  it("deduplicates missing, repeated, and self references", () => {
    const graph = buildKnowledgeGraph([
      item("a", "Alpha", "[[Alpha]] [[Beta]] [[Beta]] [[Missing]]"),
      item("b", "Beta", ""),
    ]);

    expect(graph.edges).toEqual([
      {
        id: "a->b",
        sourceId: "a",
        targetId: "b",
      },
    ]);
  });

  it("computes backlinks for the existing card display", () => {
    const source = item("source", "Source", "[[Target]]");
    const target = item("target", "Target", "");
    const backlinks = buildBacklinksByItemId([source, target]);

    expect(backlinks.get("target")).toEqual([source]);
  });
});
