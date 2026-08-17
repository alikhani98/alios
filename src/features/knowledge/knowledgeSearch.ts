import type { KnowledgeItem } from "@/shared/types";

export type HighlightSegment = Readonly<{
  text: string;
  highlighted: boolean;
}>;

export type KnowledgeSearchResult = Readonly<{
  item: KnowledgeItem;
  score: number;
  excerpt: readonly HighlightSegment[];
}>;

function normalize(value: string): string {
  return value.toLocaleLowerCase();
}

export function getKnowledgeSearchTerms(query: string): string[] {
  const terms = normalize(query)
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((term) => term.length > 1);

  return Array.from(new Set(terms ?? []));
}

function countMatchingTerms(value: string, terms: readonly string[]): number {
  const normalizedValue = normalize(value);
  return terms.filter((term) => normalizedValue.includes(term)).length;
}

function scoreKnowledgeItem(item: KnowledgeItem, query: string): number {
  const trimmedQuery = normalize(query.trim());
  const terms = getKnowledgeSearchTerms(query);

  if (!trimmedQuery || terms.length === 0) {
    return 0;
  }

  const title = normalize(item.title);
  const content = normalize(item.content);
  const summary = normalize(item.summary ?? "");
  const source = normalize(item.source ?? "");
  const searchableBody = `${content} ${summary} ${source}`;

  if (title.includes(trimmedQuery)) {
    return 1000;
  }

  if (searchableBody.includes(trimmedQuery)) {
    return 800;
  }

  if (countMatchingTerms(title, terms) === terms.length) {
    return 650;
  }

  if (countMatchingTerms(searchableBody, terms) === terms.length) {
    return 500;
  }

  const combined = `${title} ${searchableBody}`;
  const matchedTerms = countMatchingTerms(combined, terms);
  if (matchedTerms >= Math.ceil(terms.length / 2)) {
    return 250 + matchedTerms;
  }

  return 0;
}

function findExcerptSource(item: KnowledgeItem, query: string): string {
  const trimmedQuery = normalize(query.trim());
  const terms = getKnowledgeSearchTerms(query);
  const fields = [item.title, item.summary, item.content, item.source].filter(
    (value): value is string => Boolean(value)
  );
  const bestTermCoverage = fields
    .map((field) => ({
      field,
      matches: countMatchingTerms(field, terms),
    }))
    .sort((a, b) => b.matches - a.matches)[0];

  if (bestTermCoverage && bestTermCoverage.matches > 1) {
    return bestTermCoverage.field;
  }

  return (
    fields.find((field) => normalize(field).includes(trimmedQuery)) ??
    fields.find((field) =>
      terms.some((term) => normalize(field).includes(term))
    ) ??
    item.content
  );
}

export function buildKnowledgeExcerpt(
  item: KnowledgeItem,
  query: string,
  excerptLength = 180
): HighlightSegment[] {
  const source = findExcerptSource(item, query).replace(/\s+/g, " ").trim();
  const terms = getKnowledgeSearchTerms(query);

  if (!source || terms.length === 0) {
    return [{ text: source, highlighted: false }];
  }

  const normalizedSource = normalize(source);
  const firstMatchIndex = terms
    .map((term) => normalizedSource.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const excerptStart = Math.max(0, firstMatchIndex - 60);
  const excerptEnd = Math.min(source.length, excerptStart + excerptLength);
  const excerpt = `${excerptStart > 0 ? "..." : ""}${source.slice(
    excerptStart,
    excerptEnd
  )}${excerptEnd < source.length ? "..." : ""}`;

  const pattern = new RegExp(
    `(${terms.map(escapeRegExp).join("|")})`,
    "giu"
  );
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;

  excerpt.replace(pattern, (match, _term, offset: number) => {
    if (offset > lastIndex) {
      segments.push({
        text: excerpt.slice(lastIndex, offset),
        highlighted: false,
      });
    }

    segments.push({ text: match, highlighted: true });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < excerpt.length) {
    segments.push({
      text: excerpt.slice(lastIndex),
      highlighted: false,
    });
  }

  return segments.length > 0 ? segments : [{ text: excerpt, highlighted: false }];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchKnowledgeItems(
  items: readonly KnowledgeItem[],
  query: string,
  limit = 5
): KnowledgeSearchResult[] {
  return items
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, query),
      excerpt: buildKnowledgeExcerpt(item, query),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.item.updatedAt.localeCompare(a.item.updatedAt);
    })
    .slice(0, limit);
}
