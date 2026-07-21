export const OPTIONAL_SYNC_PROVIDER_ID = "supabase" as const;

export type OptionalSyncConsentRequirement =
  | "account"
  | "explicit-consent"
  | "data-scope-disclosure"
  | "local-copy"
  | "backup-compatibility";

export type OptionalSyncConsentCheck = Readonly<{
  eligible: boolean;
  missing: readonly OptionalSyncConsentRequirement[];
}>;

/**
 * Guardrail for a future opt-in remote provider.
 *
 * It deliberately contains no credentials, endpoint, network request, or persisted
 * account state. A later integration must satisfy every requirement before it can
 * activate a remote sync action.
 */
export function assessOptionalSyncConsent(input: Readonly<{
  hasAccount: boolean;
  hasExplicitConsent: boolean;
  hasDisclosedDataScope: boolean;
  keepsLocalCopy: boolean;
  preservesBackupCompatibility: boolean;
}>): OptionalSyncConsentCheck {
  const requirements: ReadonlyArray<readonly [OptionalSyncConsentRequirement, boolean]> = [
    ["account", input.hasAccount],
    ["explicit-consent", input.hasExplicitConsent],
    ["data-scope-disclosure", input.hasDisclosedDataScope],
    ["local-copy", input.keepsLocalCopy],
    ["backup-compatibility", input.preservesBackupCompatibility],
  ];
  const missing = requirements
    .filter(([, isSatisfied]) => !isSatisfied)
    .map(([requirement]) => requirement);

  return { eligible: missing.length === 0, missing };
}
