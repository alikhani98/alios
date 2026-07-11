import { describe, expect, it } from "vitest";

import { appConfig } from "../app";

describe("app config", () => {
  it("exposes the current release metadata", () => {
    expect(appConfig.name).toBe("AliOS");
    expect(appConfig.version).toBe("1.50.0");
  });
});
