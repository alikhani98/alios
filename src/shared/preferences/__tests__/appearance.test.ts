import { describe, expect, it } from "vitest";

import {
  DEFAULT_APPEARANCE_PREFERENCE,
  isAppearancePreference,
  parseAppearancePreference,
  resolveAppearance,
} from "../appearance";

describe("appearance preference helpers", () => {
  it("parses only supported appearance values", () => {
    expect(DEFAULT_APPEARANCE_PREFERENCE).toBe("system");
    expect(isAppearancePreference("light")).toBe(true);
    expect(isAppearancePreference("dark")).toBe(true);
    expect(isAppearancePreference("system")).toBe(true);
    expect(isAppearancePreference("sepia")).toBe(false);
    expect(parseAppearancePreference("sepia")).toBe("system");
  });

  it("resolves system appearance based on the current system preference", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });
});
