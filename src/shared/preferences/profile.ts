export const DEFAULT_DISPLAY_NAME = "";

export function normalizeDisplayName(value: string): string {
  return value.trim();
}

export function getDisplayNameInitials(
  displayName: string,
  fallback = "LP"
): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("");

  return initials ? initials.toLocaleUpperCase() : fallback;
}
