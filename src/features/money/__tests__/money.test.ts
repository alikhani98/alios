import { describe, expect, it } from "vitest";

import {
  MoneyPauseButton,
  MoneyPauseForm,
  MoneyPauseReviewCard,
} from "@/features/money";
import { moneyPauseRecord } from "@/test/factories";
import { moneyPauseSchema } from "@/shared/types";

describe("money feature exports", () => {
  it("exports the quick action components and validates money pause records", () => {
    expect(MoneyPauseButton).toBeTypeOf("function");
    expect(MoneyPauseForm).toBeTypeOf("function");
    expect(MoneyPauseReviewCard).toBeTypeOf("function");
    expect(moneyPauseSchema.parse(moneyPauseRecord)).toEqual(moneyPauseRecord);
  });
});
