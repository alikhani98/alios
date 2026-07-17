import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Select } from "../select";

describe("Select", () => {
  it("applies the shared mobile, focus, motion, and disabled-state contract", () => {
    const markup = renderToStaticMarkup(
      <Select aria-label="Status" disabled defaultValue="active">
        <option value="active">Active</option>
      </Select>
    );

    expect(markup).toContain("h-11");
    expect(markup).toContain("min-w-0");
    expect(markup).toContain("rounded-xl");
    expect(markup).toContain("focus-visible:ring-2");
    expect(markup).toContain("focus-visible:ring-offset-2");
    expect(markup).toContain("motion-reduce:transition-none");
    expect(markup).toContain("disabled:cursor-not-allowed");
    expect(markup).toContain('aria-label="Status"');
    expect(markup).toContain("disabled");
  });

  it("accepts focused layout overrides without duplicating the base primitive", () => {
    const markup = renderToStaticMarkup(
      <Select className="w-auto rounded-lg" defaultValue="active">
        <option value="active">Active</option>
      </Select>
    );

    expect(markup).toContain("w-auto");
    expect(markup).toContain("rounded-lg");
    expect(markup).not.toContain("w-full");
    expect(markup).not.toContain("rounded-xl");
  });
});
