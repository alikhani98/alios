// Dexie dependency is installed in Stage 1, but the real database is intentionally
// not initialized yet. The actual Dexie implementation will be added in a later stage.

export const dexieDatabaseStatus = {
  enabled: false,
  reason: "Dexie database implementation starts in a later stage.",
} as const;
