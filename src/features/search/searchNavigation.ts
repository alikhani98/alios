import type { SearchResultKind } from "./searchLocalData";

type NavigableSearchResultKind = Exclude<SearchResultKind, "attachment">;

const searchResultPaths: Record<NavigableSearchResultKind, string> = {
  inbox: "/inbox",
  task: "/today",
  project: "/projects",
  goal: "/goals",
  lifeArea: "/life-areas",
  resource: "/resources",
  journal: "/journal",
  knowledge: "/knowledge",
  decision: "/decisions",
  manual: "/manual",
  routine: "/routines",
};

export function getSearchResultPath(kind: NavigableSearchResultKind): string {
  return searchResultPaths[kind];
}

export function buildSearchResultHref(
  kind: SearchResultKind,
  focusId: string
): string {
  if (kind === "resource") {
    return `/resources/${encodeURIComponent(focusId)}`;
  }

  if (kind === "attachment") {
    throw new Error("Attachment results navigate through their owner.");
  }

  const searchParams = new URLSearchParams({ focusId });
  return `${getSearchResultPath(kind)}?${searchParams.toString()}`;
}
