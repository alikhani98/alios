import { describe, expect, it } from "vitest";

import {
  DEFAULT_ACCENT_COLOR_PREFERENCE,
  getAccentColorThemeVariables,
  normalizeAccentColorPreference,
  parseAccentColorPreference,
} from "../accentColor";

describe("accent color preference helpers", () => {
  it("normalizes only supported accent color values", () => {
    expect(DEFAULT_ACCENT_COLOR_PREFERENCE).toBe("default");
    expect(parseAccentColorPreference("violet")).toBe("violet");
    expect(parseAccentColorPreference(null)).toBe("default");
    expect(normalizeAccentColorPreference("rose")).toBe("rose");
    expect(normalizeAccentColorPreference("caspian")).toBe("caspian");
    expect(normalizeAccentColorPreference("saffron")).toBe("saffron");
    expect(normalizeAccentColorPreference("sepia")).toBe("default");
  });

  it("returns stable theme variables for the selected accent color", () => {
    expect(getAccentColorThemeVariables("amber", false)).toEqual({
      primary: "38 92% 50%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "38 92% 50%",
    });

    expect(getAccentColorThemeVariables("emerald", true)).toEqual({
      primary: "158 64% 46%",
      primaryForeground: "222.2 47.4% 11.2%",
      ring: "158 64% 46%",
    });

    expect(getAccentColorThemeVariables("caspian", false)).toEqual({
      primary: "221 38% 15%",
      primaryForeground: "40 47% 94%",
      ring: "221 38% 15%",
    });

    expect(getAccentColorThemeVariables("herb", true)).toEqual({
      primary: "134 24% 58%",
      primaryForeground: "221 38% 15%",
      ring: "134 24% 58%",
    });
  });
});
