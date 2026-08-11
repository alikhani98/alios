import { describe, expect, it } from "vitest";

import { detectNaturalDate } from "../naturalDate";

const baseDate = new Date("2026-07-05T12:00:00.000Z");

describe("natural date detection", () => {
  it("detects simple English relative dates", () => {
    expect(detectNaturalDate("Send the note tomorrow", baseDate)).toMatchObject({
      date: "2026-07-06",
      phrase: "tomorrow",
    });
  });

  it("detects simple Persian relative dates", () => {
    expect(detectNaturalDate("خرید را فردا انجام بده", baseDate)).toMatchObject({
      date: "2026-07-06",
      phrase: "فردا",
    });
  });

  it("detects next weekday phrases without adding a heavy NLP dependency", () => {
    expect(detectNaturalDate("Review budget next monday", baseDate)).toMatchObject({
      date: "2026-07-06",
      phrase: "next monday",
    });
    expect(detectNaturalDate("جلسه دوشنبه بعد", baseDate)).toMatchObject({
      date: "2026-07-06",
      phrase: "دوشنبه بعد",
    });
  });
});
