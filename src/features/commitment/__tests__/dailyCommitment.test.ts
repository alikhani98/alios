import { describe, expect, it } from "vitest";

import { dailyCommitmentRecord } from "@/test/factories";
import { dailyCommitmentSchema } from "@/shared/types";

import { DailyCommitmentCard } from "../components/DailyCommitmentCard";
import { CommitmentForm } from "../components/CommitmentForm";

describe("commitment feature exports", () => {
  it("keeps the daily commitment data contract valid", () => {
    expect(dailyCommitmentSchema.parse(dailyCommitmentRecord)).toEqual(
      dailyCommitmentRecord
    );
  });

  it("exports the ported commitment UI components", () => {
    expect(DailyCommitmentCard).toBeTypeOf("function");
    expect(CommitmentForm).toBeTypeOf("function");
  });
});
