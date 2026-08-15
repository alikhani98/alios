import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export const ONBOARDING_COMPLETED_STORAGE_KEY =
  "alios.onboarding.completed";

export function isOnboardingCompleted(): boolean {
  return readStoredPreference(
    ONBOARDING_COMPLETED_STORAGE_KEY,
    (value) => value === "true",
    false
  );
}

export function markOnboardingCompleted(): boolean {
  return writeStoredPreference(ONBOARDING_COMPLETED_STORAGE_KEY, "true");
}
