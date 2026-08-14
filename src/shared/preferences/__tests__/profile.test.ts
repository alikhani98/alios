import { describe, expect, it } from "vitest";

import {
  DEFAULT_PROFILE_AVATAR_PREFERENCE,
  getDisplayNameInitials,
  normalizeDisplayName,
  normalizeProfileAvatarPreference,
} from "../profile";

describe("profile helpers", () => {
  it("normalizes the display name and generates initials", () => {
    expect(normalizeDisplayName("  Sadegh Khani  ")).toBe("Sadegh Khani");
    expect(getDisplayNameInitials("Sadegh Khani")).toBe("SK");
    expect(getDisplayNameInitials("Ali")).toBe("A");
  });

  it("uses a local-only fallback when the display name is empty", () => {
    expect(getDisplayNameInitials("")).toBe("LP");
    expect(getDisplayNameInitials("   ", "LO")).toBe("LO");
  });

  it("normalizes the local avatar preference", () => {
    expect(DEFAULT_PROFILE_AVATAR_PREFERENCE).toBe("initials");
    expect(normalizeProfileAvatarPreference("saffron")).toBe("saffron");
    expect(normalizeProfileAvatarPreference("photo")).toBe("photo");
    expect(normalizeProfileAvatarPreference("unknown")).toBe("initials");
  });
});
