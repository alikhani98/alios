import type { KnowledgeItem } from "@/shared/types";

export type KnowledgeGraphNode = Readonly<{
  id: string;
  title: string;
  type: KnowledgeItem["type"];
  x: number;
  y: number;
}>;

export type KnowledgeGraphEdge = Readonly<{
  id: string;
  sourceId: string;
  targetId: string;
}>;

export type KnowledgeGraph = Readonly<{
  nodes: readonly KnowledgeGraphNode[];
  edges: readonly KnowledgeGraphEdge[];
}>;

export function extractWikiReferences(content: string): string[] {
  return Array.from(content.matchAll(/\[\[([^\]]+)\]\]/g))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

export function normalizeReferenceTitle(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function buildBacklinksByItemId(
  items: readonly KnowledgeItem[]
): Map<string, KnowledgeItem[]> {
  const titleToItem = new Map(
    items.map((item) => [normalizeReferenceTitle(item.title), item])
  );
  const backlinks = new Map<string, KnowledgeItem[]>();

  items.forEach((source) => {
    extractWikiReferences(source.content).forEach((reference) => {
      const target = titleToItem.get(normalizeReferenceTitle(reference));
      if (!target || target.id === source.id) {
        return;
      }

      const current = backlinks.get(target.id) ?? [];
      if (!current.some((item) => item.id === source.id)) {
        backlinks.set(target.id, [...current, source]);
      }
    });
  });

  return backlinks;
}

export function buildKnowledgeGraph(
  items: readonly KnowledgeItem[]
): KnowledgeGraph {
  const titleToItem = new Map(
    items.map((item) => [normalizeReferenceTitle(item.title), item])
  );
  const edgeKeys = new Set<string>();
  const edges: KnowledgeGraphEdge[] = [];

  items.forEach((source) => {
    extractWikiReferences(source.content).forEach((reference) => {
      const target = titleToItem.get(normalizeReferenceTitle(reference));
      if (!target || target.id === source.id) {
        return;
      }

      const edgeKey = `${source.id}->${target.id}`;
      if (edgeKeys.has(edgeKey)) {
        return;
      }

      edgeKeys.add(edgeKey);
      edges.push({
        id: edgeKey,
        sourceId: source.id,
        targetId: target.id,
      });
    });
  });

  const centerX = 500;
  const centerY = 320;
  const radius = items.length <= 2 ? 170 : 250;
  const nodes = items.map((item, index) => {
    if (items.length === 1) {
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        x: centerX,
        y: centerY,
      };
    }

    const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      x: Math.round(centerX + Math.cos(angle) * radius),
      y: Math.round(centerY + Math.sin(angle) * radius),
    };
  });

  return {
    nodes,
    edges,
  };
}
