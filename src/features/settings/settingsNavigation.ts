export const settingsTabs = ["general", "appearance", "workspace", "notifications", "account", "data"] as const;
export type SettingsTab = (typeof settingsTabs)[number];
export type SettingsDestination = SettingsTab | "help" | "diagnostics" | "about";

// Hashes identify operations and therefore take precedence over stale tab queries.
export const settingsHashDestinations: Readonly<Record<string, SettingsDestination>> = {
  "settings-profile": "general",
  "settings-profile-group": "general",
  "settings-profile-settings-group": "general",
  "settings-language": "general",
  "settings-calendar": "general",
  "settings-appearance-behavior-group": "appearance",
  "settings-personalization-group": "workspace",
  "settings-additional-preferences": "workspace",
  "settings-dashboard": "workspace",
  "settings-reminder-settings-group": "notifications",
  "settings-account-sync-group": "account",
  "settings-backup-export-group": "data",
  "settings-backup-restore": "data",
  "settings-export-center": "data",
  "settings-export-center-group": "data",
  "settings-local-data-recovery-group": "data",
  "settings-local-data-details": "data",
  "settings-recovery-mode": "data",
  "settings-recovery-mode-details": "data",
  "settings-clear-data": "data",
  "settings-help-center": "help",
  "settings-advanced-developer-group": "diagnostics",
  "settings-advanced-local-tools": "diagnostics",
  "settings-local-error-log": "diagnostics",
  "settings-app-info": "about",
};

export function resolveSettingsTab(search: string, hash: string): SettingsDestination {
  const id = hash.replace(/^#/, "");
  if (Object.prototype.hasOwnProperty.call(settingsHashDestinations, id)) return settingsHashDestinations[id];
  if (id.startsWith("settings-help-")) return "help";
  const tab = new URLSearchParams(search).get("tab") ?? "";
  if (tab === "profile") return "general";
  if (tab === "help" || tab === "diagnostics" || tab === "about") return tab;
  return settingsTabs.find((candidate) => candidate === tab) ?? "general";
}
