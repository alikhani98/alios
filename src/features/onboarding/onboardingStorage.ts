import {
  PREF_ONBOARDING_COMPLETED,
} from "@/shared/constants/preferences";
import {
  readStoredPreference,
  writeStoredPreference,
} from "@/shared/preferences/storage";

export { PREF_ONBOARDING_COMPLETED as ONBOARDING_COMPLETED_STORAGE_KEY };

export const ONBOARDING_DISMISSED_STORAGE_KEY = "alios.onboarding.dismissed";

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

export function isOnboardingDismissed(): boolean {
  return readStoredPreference(
    ONBOARDING_DISMISSED_STORAGE_KEY,
    (value) => value === "true",
    false
  );
}

export function markOnboardingDismissed(): boolean {
  return writeStoredPreference(ONBOARDING_DISMISSED_STORAGE_KEY, "true");
}
