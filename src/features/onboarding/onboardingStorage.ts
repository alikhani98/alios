import {
  PREF_ONBOARDING_COMPLETED,
} from "@/shared/constants/preferences";
import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export { PREF_ONBOARDING_COMPLETED as ONBOARDING_COMPLETED_STORAGE_KEY };

export function isOnboardingCompleted(): boolean {
  return readStoredPreference(
    PREF_ONBOARDING_COMPLETED,
    (value) => value === "true",
    false
  );
}

export function markOnboardingCompleted(): boolean {
  return writeStoredPreference(PREF_ONBOARDING_COMPLETED, "true");
}
