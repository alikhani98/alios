import { describe, expect, it } from "vitest";

import { ifThenPlanSchema } from "@/shared/types";

const validPlan = {
  id: "ifthen-1",
  ifTrigger: "If I open social media before work",
  thenAction: "Then I close it and start the first task for 10 minutes",
  isActive: true,
  linkedUrgeType: "social_media",
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
};

describe("if-then plan schema", () => {
  it("accepts a valid local if-then plan with an urge link", () => {
    expect(ifThenPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it("keeps the related urge link optional", () => {
    const planWithoutUrge: Record<string, unknown> = { ...validPlan };
    delete planWithoutUrge.linkedUrgeType;

    expect(ifThenPlanSchema.safeParse(planWithoutUrge).success).toBe(true);
  });
});
