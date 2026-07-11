import type { SearchResultKind } from "./searchLocalData";

const searchResultPaths: Record<SearchResultKind, string> = {
  inbox: "/inbox",
  task: "/today",
  project: "/projects",
  journal: "/journal",
  knowledge: "/knowledge",
  manual: "/manual",
};

export function getSearchResultPath(kind: SearchResultKind): string {
  return searchResultPaths[kind];
}

export function buildSearchResultHref(
  kind: SearchResultKind,
  focusId: string
): string {
  const searchParams = new URLSearchParams({ focusId });
  return `${getSearchResultPath(kind)}?${searchParams.toString()}`;
}
