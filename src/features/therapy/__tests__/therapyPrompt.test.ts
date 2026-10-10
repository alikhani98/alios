import { describe, expect, it } from "vitest";

import type { TherapyNote } from "@/shared/types";
import { buildTherapyPrompt } from "../utils/therapyPrompt";

const timestamp = "2026-07-05T08:30:00.000Z";

function note(
  id: string,
  category: TherapyNote["category"],
  content: string
): TherapyNote {
  return {
    id,
    date: "2026-07-05",
    category,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("buildTherapyPrompt", () => {
  it("includes grouped weekly therapy notes and leaves missing groups empty", () => {
    const prompt = buildTherapyPrompt({
      event: [note("note-1", "event", "Discuss the hard meeting.")],
      feeling: [note("note-2", "feeling", "Anxiety before sleep.")],
      pattern: [],
      question: [note("note-3", "question", "How do I ask for help earlier?")],
      insight: [],
    });

    expect(prompt).toContain("Discuss the hard meeting.");
    expect(prompt).toContain("Anxiety before sleep.");
    expect(prompt).toContain("How do I ask for help earlier?");
    expect(prompt).toContain("هیچ تشخیصی نده");
  });
});
