import { describe, expect, it } from "vitest";

import type { SearchResultKind } from "../searchLocalData";
import { buildSearchResultHref, getSearchResultPath } from "../searchNavigation";

describe("searchNavigation", () => {
  it("builds focused links for each result kind", () => {
    const cases: Array<[SearchResultKind, string, string]> = [
      ["inbox", "item-1", "/inbox?focusId=item-1"],
      ["task", "item-2", "/today?focusId=item-2"],
      ["project", "item-3", "/projects?focusId=item-3"],
      ["journal", "item-4", "/journal?focusId=item-4"],
      ["knowledge", "item-5", "/knowledge?focusId=item-5"],
    ];

    for (const [kind, focusId, href] of cases) {
      expect(buildSearchResultHref(kind, focusId)).toBe(href);
    }
  });

  it("returns the module path for each result kind", () => {
    expect(getSearchResultPath("inbox")).toBe("/inbox");
    expect(getSearchResultPath("task")).toBe("/today");
    expect(getSearchResultPath("project")).toBe("/projects");
    expect(getSearchResultPath("journal")).toBe("/journal");
    expect(getSearchResultPath("knowledge")).toBe("/knowledge");
  });
});
