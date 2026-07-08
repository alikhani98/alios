export type AppearancePreference = "light" | "dark" | "system";
export type ResolvedAppearance = "light" | "dark";

export const DEFAULT_APPEARANCE_PREFERENCE: AppearancePreference = "system";

export function isAppearancePreference(
  value: unknown
): value is AppearancePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function parseAppearancePreference(
  value: string | null | undefined
): AppearancePreference {
  return isAppearancePreference(value) ? value : DEFAULT_APPEARANCE_PREFERENCE;
}

export function resolveAppearance(
  preference: AppearancePreference,
  prefersDark: boolean
): ResolvedAppearance {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  return preference;
}
