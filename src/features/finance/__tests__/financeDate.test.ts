import { describe, expect, it } from "vitest";

import { getJalaliDatePreview } from "../financeDate";

describe("finance date helpers", () => {
  it("formats a Jalali preview without changing stored ISO dates", () => {
    expect(getJalaliDatePreview("2026-07-05", "en")).toBeTruthy();
    expect(getJalaliDatePreview("2026-07-05", "fa")).toBeTruthy();
  });

  it("returns null for empty or invalid values", () => {
    expect(getJalaliDatePreview("", "fa")).toBeNull();
    expect(getJalaliDatePreview("not-a-date", "fa")).toBeNull();
  });
});
