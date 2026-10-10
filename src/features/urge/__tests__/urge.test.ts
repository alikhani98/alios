import { describe, expect, it } from "vitest";

import { urgeEntryRecord } from "@/test/factories";
import { urgeEntrySchema } from "@/shared/types";

import { URGE_TYPES, UrgeLogButton, UrgeQuickForm, UrgeTodayList } from "..";

describe("urge feature exports", () => {
  it("keeps the urge entry data contract valid", () => {
    expect(urgeEntrySchema.parse(urgeEntryRecord)).toEqual(urgeEntryRecord);
  });

  it("exports quick-log UI and preset urge types", () => {
    expect(URGE_TYPES.map((type) => type.value)).toEqual([
      "cigarette",
      "social_media",
      "procrastination",
      "impulse_buy",
      "other",
    ]);
    expect(UrgeLogButton).toBeTypeOf("function");
    expect(UrgeQuickForm).toBeTypeOf("function");
    expect(UrgeTodayList).toBeTypeOf("function");
  });
});
