import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  BACKUP_STATUS_STORAGE_KEY,
  DISPLAY_NAME_STORAGE_KEY,
  LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY,
  MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
  MORNING_WARMUP_ENABLED_STORAGE_KEY,
  RECOVERY_MODE_ENABLED_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { CALENDAR_DISPLAY_STORAGE_KEY } from "@/shared/date/formatDate";
import { LOCAL_ERROR_LOG_STORAGE_KEY } from "@/shared/error/localErrorLog";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n/i18n";
import { FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/finance/financeSections";
import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY } from "@/features/home/dashboardLayout";
import { HOME_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/home/homeCollapsedSections";
import {
  WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY,
} from "@/features/wellness/badmintonRoutine";
import { LEGACY_LAST_BACKUP_EXPORTED_AT_KEY } from "./backupStatus";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "./viewDensityMode";
import { WEEKLY_TASK_BUDGET_STORAGE_KEY } from "./weeklyTaskBudget";

export type PreferenceSyncCategory =
  | "account-synced"
  | "device-local"
  | "intentionally-unsynced";

export type PreferenceDescriptor = Readonly<{
  key: string;
  category: PreferenceSyncCategory;
  label: string;
  notes: string;
}>;

export const PREFERENCE_REGISTRY = [
  {
    key: LANGUAGE_STORAGE_KEY,
    category: "account-synced",
    label: "Language",
    notes: "Preferred interface language across devices.",
  },
  {
    key: APPEARANCE_STORAGE_KEY,
    category: "account-synced",
    label: "Appearance",
    notes: "Theme preference for light, dark, or system appearance.",
  },
  {
    key: ACCENT_COLOR_STORAGE_KEY,
    category: "account-synced",
    label: "Accent color",
    notes: "User-selected accent palette preference.",
  },
  {
    key: DISPLAY_NAME_STORAGE_KEY,
    category: "account-synced",
    label: "Display name",
    notes: "Profile-style display name preference.",
  },
  {
    key: VIEW_DENSITY_MODE_STORAGE_KEY,
    category: "account-synced",
    label: "View density",
    notes: "Simple vs full reading density preference.",
  },
  {
    key: CALENDAR_DISPLAY_STORAGE_KEY,
    category: "account-synced",
    label: "Calendar display",
    notes: "Gregorian vs Jalali display preference.",
  },
  {
    key: HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
    category: "account-synced",
    label: "Home dashboard layout",
    notes: "User-owned dashboard ordering and visibility preference.",
  },
  {
    key: HOME_COLLAPSED_SECTIONS_STORAGE_KEY,
    category: "account-synced",
    label: "Home collapsed sections",
    notes: "User-owned dashboard reading density preference.",
  },
  {
    key: FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY,
    category: "account-synced",
    label: "Finance collapsed sections",
    notes: "User-owned Finance reading density preference.",
  },
  {
    key: WEEKLY_TASK_BUDGET_STORAGE_KEY,
    category: "account-synced",
    label: "Weekly task budget",
    notes: "Planning preference rather than device-specific runtime state.",
  },
  {
    key: MORNING_WARMUP_ENABLED_STORAGE_KEY,
    category: "account-synced",
    label: "Morning warmup enabled",
    notes: "User-owned routine nudge preference.",
  },
  {
    key: MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
    category: "device-local",
    label: "Morning warmup dismissed date",
    notes: "Short-lived local dismissal state tied to the current device session rhythm.",
  },
  {
    key: RECOVERY_MODE_ENABLED_STORAGE_KEY,
    category: "device-local",
    label: "Recovery mode",
    notes: "Safety and troubleshooting mode that should remain local to the current device.",
  },
  {
    key: LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY,
    category: "device-local",
    label: "Local AI endpoint",
    notes: "Machine-specific local endpoint configuration.",
  },
  {
    key: LOCAL_ERROR_LOG_STORAGE_KEY,
    category: "device-local",
    label: "Local error log",
    notes: "Debugging history tied to one browser/device environment.",
  },
  {
    key: WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
    category: "device-local",
    label: "Wellness card enabled",
    notes: "Local helper-card display choice.",
  },
  {
    key: WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
    category: "device-local",
    label: "Wellness routine date",
    notes: "Local helper state for the current device.",
  },
  {
    key: WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
    category: "device-local",
    label: "Wellness checked steps",
    notes: "Temporary helper checklist state.",
  },
  {
    key: WELLNESS_BADMINTON_ROUTINE_ENERGY_STORAGE_KEY,
    category: "device-local",
    label: "Wellness energy input",
    notes: "Temporary helper-card input state.",
  },
  {
    key: WELLNESS_BADMINTON_ROUTINE_FATIGUE_STORAGE_KEY,
    category: "device-local",
    label: "Wellness fatigue input",
    notes: "Temporary helper-card input state.",
  },
  {
    key: BACKUP_STATUS_STORAGE_KEY,
    category: "intentionally-unsynced",
    label: "Backup status metadata",
    notes: "Operational metadata about manual backups; not user intent.",
  },
  {
    key: LEGACY_LAST_BACKUP_EXPORTED_AT_KEY,
    category: "intentionally-unsynced",
    label: "Legacy backup timestamp",
    notes: "Backward-compatibility metadata for local backup reminders.",
  },
] as const satisfies ReadonlyArray<PreferenceDescriptor>;

export function getPreferencesByCategory(category: PreferenceSyncCategory) {
  return PREFERENCE_REGISTRY.filter((entry) => entry.category === category);
}
