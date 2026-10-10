import { describe, expect, it } from "vitest";

import {
  RecoveryCard,
  RECOVERY_DISMISSED_AT_STORAGE_KEY,
} from "@/features/recovery";

describe("recovery feature exports", () => {
  it("exports the Today card and local dismissal key", () => {
    expect(RecoveryCard).toBeTypeOf("function");
    expect(RECOVERY_DISMISSED_AT_STORAGE_KEY).toBe(
      "alios.recovery.dismissedAt"
    );
  });
});
