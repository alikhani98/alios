import {
  AlertTriangle,
  ArrowUpRight,
  CloudOff,
  Cloudy,
  GitCompareArrows,
  LaptopMinimal,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useAccountRuntime,
  useAccountRuntimeState,
  type AccountRuntimeState,
} from "@/core/account";
import {
  EMAIL_ACCOUNT_PROVIDER_ID,
  GOOGLE_ACCOUNT_PROVIDER_ID,
} from "@/core/account/types";
import { useAuth, type AuthProvider } from "@/core/auth";
import { OPTIONAL_SYNC_PROVIDER_ID } from "@/core/sync";
import type {
  SyncCategoryStatus,
  SyncConflictEntity,
  SyncConflictRecord,
  SyncConflictResolutionChoice,
  SyncScope,
} from "@/core/sync";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { EmailAccountAuthForm } from "./EmailAccountAuthForm";

type SyncStatusAdvancedPanelProps = Readonly<{
  onGoToBackupRestore: () => void;
}>;

type SyncStateTone = "neutral" | "primary" | "warning" | "danger";

type SyncStateDefinition = Readonly<{
  icon: typeof CloudOff;
  titleKey: TranslationKey;
  statusKey: TranslationKey;
  descriptionKey: TranslationKey;
  tone: SyncStateTone;
  detailKey?: TranslationKey;
  featured?: boolean;
}>;

type SyncStatePreviewProps = Readonly<{
  state: SyncStateDefinition;
}>;

type ConsentActionPlaceholderProps = Readonly<{
  label: string;
  descriptionId: string;
  disabled?: boolean;
  onClick?: () => void;
}>;

type InteractiveGoogleAuthProvider = AuthProvider &
  Readonly<{
    isConfigured: () => boolean;
  }>;

type InteractiveEmailAuthProvider = AuthProvider &
  Readonly<{
    isConfigured: () => boolean;
    createAccount: NonNullable<AuthProvider["createAccount"]>;
  }>;

type AccountActionDefinition = Readonly<{
  labelKey: TranslationKey;
  statusKey: TranslationKey;
}>;

type RuntimeAccountPresentation = Readonly<{
  titleKey: TranslationKey;
  badgeLabel: string;
  summaryStatusKey: TranslationKey;
  description: string;
  detailsLabelKey: TranslationKey;
  detailsValue: string;
  actionsTitleKey: TranslationKey;
  actionsDescriptionKey: TranslationKey;
  actionStatusKey: TranslationKey;
  actionKeys: readonly AccountActionDefinition[];
  noteKey: TranslationKey;
  hintKey: TranslationKey;
}>;

type RuntimeMetadataRow = Readonly<{
  labelKey: TranslationKey;
  value: string;
  descriptionKey?: TranslationKey;
}>;

type SyncExperienceState = Readonly<{
  key:
    | "preparing"
    | "syncing"
    | "completed"
    | "offline"
    | "failed"
    | "conflict";
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  badgeKey: TranslationKey;
  tone: SyncStateTone;
}>;

type SyncCategoryTone = "neutral" | "primary" | "warning" | "danger";

type ConflictReviewState = Readonly<{
  expanded: boolean;
  loading: boolean;
  records: ReadonlyArray<SyncConflictRecord> | null;
  feedback: string | null;
  error: string | null;
  pendingActionKey: string | null;
}>;

type SyncHealthTone = "neutral" | "primary" | "warning" | "danger";

function SyncStatePreview({ state }: SyncStatePreviewProps) {
  const { t } = useI18n();
  const Icon = state.icon;

  return (
    <SoftPanel
      className={`h-full ${
        state.featured
          ? "border-primary/25 bg-primary/10"
          : "alios-surface-muted"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="alios-icon-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t(state.titleKey)}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(state.descriptionKey)}
            </p>
            {state.detailKey ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(state.detailKey)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex sm:justify-end">
          <StatusChip tone={state.tone}>{t(state.statusKey)}</StatusChip>
        </div>
      </div>
    </SoftPanel>
  );
}

function ConsentActionPlaceholder({
  label,
  descriptionId,
  disabled = true,
  onClick,
}: ConsentActionPlaceholderProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 w-full justify-start sm:w-auto"
      disabled={disabled}
      onClick={onClick}
      aria-describedby={descriptionId}
    >
      <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
      {label}
    </Button>
  );
}

function getInteractiveGoogleProvider(
  provider: AuthProvider
): InteractiveGoogleAuthProvider | null {
  if (
    provider.name !== GOOGLE_ACCOUNT_PROVIDER_ID ||
    !("isConfigured" in provider) ||
    typeof provider.isConfigured !== "function" ||
    !provider.isConfigured()
  ) {
    return null;
  }

  return provider as InteractiveGoogleAuthProvider;
}

function getInteractiveEmailProvider(
  provider: AuthProvider
): InteractiveEmailAuthProvider | null {
  if (
    provider.name !== EMAIL_ACCOUNT_PROVIDER_ID ||
    !("isConfigured" in provider) ||
    typeof provider.isConfigured !== "function" ||
    !provider.isConfigured() ||
    typeof provider.createAccount !== "function"
  ) {
    return null;
  }

  return provider as InteractiveEmailAuthProvider;
}

const syncStates: readonly SyncStateDefinition[] = [
  {
    icon: CloudOff,
    titleKey: "settings.syncStateLocalOnlyTitle",
    statusKey: "settings.syncStatusLocalOnly",
    descriptionKey: "settings.syncStateLocalOnlyDescription",
    tone: "neutral",
    detailKey: "settings.syncStateLocalOnlyDetail",
    featured: true,
  },
  {
    icon: Cloudy,
    titleKey: "settings.syncStateAvailableTitle",
    statusKey: "settings.syncStatusAvailable",
    descriptionKey: "settings.syncStateAvailableDescription",
    tone: "primary",
    detailKey: "settings.syncStateAvailableDetail",
  },
  {
    icon: PauseCircle,
    titleKey: "settings.syncStatePausedTitle",
    statusKey: "settings.syncStatusPaused",
    descriptionKey: "settings.syncStatePausedDescription",
    tone: "warning",
    detailKey: "settings.syncStatePausedDetail",
  },
  {
    icon: WifiOff,
    titleKey: "settings.syncStateOfflineTitle",
    statusKey: "settings.syncStatusOffline",
    descriptionKey: "settings.syncStateOfflineDescription",
    tone: "warning",
    detailKey: "settings.syncStateOfflineDetail",
  },
  {
    icon: GitCompareArrows,
    titleKey: "settings.syncStateConflictTitle",
    statusKey: "settings.syncStatusConflict",
    descriptionKey: "settings.syncStateConflictDescription",
    tone: "danger",
    detailKey: "settings.syncStateConflictDetail",
  },
] as const;

const localOnlyActions: readonly AccountActionDefinition[] = [
  {
    labelKey: "settings.accountCreateAction",
    statusKey: "settings.accountActionPlannedOnly",
  },
  {
    labelKey: "settings.accountSignInAction",
    statusKey: "settings.accountActionPlannedOnly",
  },
  {
    labelKey: "settings.accountEnableSyncAction",
    statusKey: "settings.accountActionPlannedOnly",
  },
] as const;

const signedOutActions: readonly AccountActionDefinition[] = [
  {
    labelKey: "settings.accountSignInAction",
    statusKey: "settings.accountActionFutureEntry",
  },
  {
    labelKey: "settings.accountCreateAction",
    statusKey: "settings.accountActionFutureEntry",
  },
  {
    labelKey: "settings.accountEnableSyncAction",
    statusKey: "settings.accountActionRequiresSignIn",
  },
] as const;

const signedInActions: readonly AccountActionDefinition[] = [
  {
    labelKey: "settings.accountSignOutAction",
    statusKey: "settings.accountActionFutureEntry",
  },
  {
    labelKey: "settings.accountManageAction",
    statusKey: "settings.accountActionFutureEntry",
  },
  {
    labelKey: "settings.accountEnableSyncAction",
    statusKey: "settings.accountActionFutureEntry",
  },
] as const;

function getProviderLabel(
  runtimeState: AccountRuntimeState,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) {
  return runtimeState.accountProviderId === EMAIL_ACCOUNT_PROVIDER_ID
    ? t("settings.accountProviderEmail")
    : runtimeState.accountProviderId === GOOGLE_ACCOUNT_PROVIDER_ID
      ? t("settings.accountProviderGoogle")
      : t("settings.accountProviderLocalOnly");
}

function getSyncLastSeenLabel(
  runtimeState: AccountRuntimeState,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) {
  return runtimeState.syncMetadata.lastSyncedAt
    ? runtimeState.syncMetadata.lastSyncedAt
    : t("settings.syncLastSyncedNever");
}

function getSyncScopeLabelKey(scope: SyncScope): TranslationKey {
  switch (scope) {
    case "preferences":
      return "settings.syncScopePreferences";
    case "tasks":
      return "settings.syncScopeTasks";
    case "routines":
      return "settings.syncScopeRoutines";
    case "projects":
      return "settings.syncScopeProjects";
    case "goals":
      return "settings.syncScopeGoals";
    case "finance":
      return "settings.syncScopeFinance";
    case "manual":
      return "settings.syncScopeManual";
  }
}

function getSyncCategoryLabelKey(
  key: SyncCategoryStatus["key"]
): TranslationKey {
  switch (key) {
    case "preferences":
      return "settings.syncScopePreferences";
    case "tasks":
      return "settings.syncScopeTasks";
    case "routines":
      return "settings.syncScopeRoutines";
    case "projects":
      return "settings.syncScopeProjects";
    case "goals":
      return "settings.syncScopeGoals";
    case "finance":
      return "settings.syncScopeFinance";
    case "manual":
      return "settings.syncScopeManual";
  }
}

function getPrivacyLevelLabelKey(
  level: SyncCategoryStatus["privacyLevel"]
): TranslationKey {
  switch (level) {
    case "standard":
      return "settings.syncPrivacyLevelStandard";
    case "sensitive":
      return "settings.syncPrivacyLevelSensitive";
    case "private":
      return "settings.syncPrivacyLevelPrivate";
  }
}

function getVisibilityLabelKey(
  visibility: SyncCategoryStatus["visibility"]
): TranslationKey {
  switch (visibility) {
    case "synced":
      return "settings.syncVisibilitySynced";
    case "local-only":
      return "settings.syncVisibilityLocalOnly";
    case "metadata-only":
      return "settings.syncVisibilityMetadataOnly";
  }
}

function getCategoryTone(category: SyncCategoryStatus): SyncCategoryTone {
  if (category.state === "error") {
    return "danger";
  }

  if (!category.enabled && category.visibility !== "metadata-only") {
    return "neutral";
  }

  if (category.visibility === "metadata-only" || category.state === "planned") {
    return "warning";
  }

  return "primary";
}

function getConflictEntityLabelKey(entity: SyncConflictEntity): TranslationKey {
  switch (entity) {
    case "tasks":
      return "settings.syncConflictEntityTasks";
    case "routines":
      return "settings.syncConflictEntityRoutines";
    case "projects":
      return "settings.syncConflictEntityProjects";
    case "goals":
      return "settings.syncConflictEntityGoals";
    case "financeTransactions":
      return "settings.syncConflictEntityFinanceTransactions";
    case "financeObligations":
      return "settings.syncConflictEntityFinanceObligations";
    case "manualEntries":
      return "settings.syncConflictEntityManualEntries";
  }
}

function getConflictResolutionActionKey(
  conflict: SyncConflictRecord,
  resolution: SyncConflictResolutionChoice
) {
  return `${conflict.entity}:${conflict.recordId}:${resolution}`;
}

function getConflictConfirmationMessage(
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
  conflict: SyncConflictRecord,
  resolution: SyncConflictResolutionChoice
) {
  return resolution === "keep-local"
    ? t("settings.syncConflictConfirmKeepLocal", {
        title: conflict.title,
      })
    : t("settings.syncConflictConfirmKeepRemote", {
        title: conflict.title,
      });
}

function getSyncHealthSummary(runtimeState: AccountRuntimeState): Readonly<{
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  tone: SyncHealthTone;
}> {
  if (runtimeState.localOnly) {
    return {
      labelKey: "settings.syncHealthLocalOnly",
      descriptionKey: "settings.syncHealthLocalOnlyDescription",
      tone: "neutral",
    };
  }

  if (runtimeState.syncStatus.mode === "syncing") {
    return {
      labelKey: "settings.syncHealthSyncing",
      descriptionKey: "settings.syncHealthSyncingDescription",
      tone: "primary",
    };
  }

  if (runtimeState.syncStatus.mode === "error") {
    return {
      labelKey: "settings.syncHealthIssue",
      descriptionKey:
        runtimeState.syncStatus.issue === "conflict"
          ? "settings.syncHealthConflictDescription"
          : "settings.syncHealthIssueDescription",
      tone: runtimeState.syncStatus.issue === "conflict" ? "danger" : "warning",
    };
  }

  return {
    labelKey: "settings.syncHealthHealthy",
    descriptionKey: "settings.syncHealthHealthyDescription",
    tone: "primary",
  };
}

function getUserFacingSyncDetail(
  detail: string,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) {
  return /alios_sync_records|schema cache|public\./i.test(detail)
    ? t("settings.syncServiceUnavailable")
    : detail;
}

function getSyncExperienceState(
  runtimeState: AccountRuntimeState
): SyncExperienceState {
  if (runtimeState.syncStatus.issue === "conflict") {
    return {
      key: "conflict",
      titleKey: "settings.syncExperienceConflictTitle",
      descriptionKey: "settings.syncExperienceConflictDescription",
      badgeKey: "settings.syncExperienceConflictBadge",
      tone: "danger",
    };
  }

  if (runtimeState.syncStatus.mode === "syncing") {
    return {
      key: "syncing",
      titleKey: "settings.syncExperienceSyncingTitle",
      descriptionKey: "settings.syncExperienceSyncingDescription",
      badgeKey: "settings.syncExperienceSyncingBadge",
      tone: "primary",
    };
  }

  if (runtimeState.syncStatus.mode === "error") {
    if (runtimeState.syncStatus.issue === "connectivity") {
      return {
        key: "offline",
        titleKey: "settings.syncExperienceOfflineTitle",
        descriptionKey: "settings.syncExperienceOfflineDescription",
        badgeKey: "settings.syncExperienceOfflineBadge",
        tone: "warning",
      };
    }

    return {
      key: "failed",
      titleKey: "settings.syncExperienceFailedTitle",
      descriptionKey: "settings.syncExperienceFailedDescription",
      badgeKey: "settings.syncExperienceFailedBadge",
      tone: "warning",
    };
  }

  if (!runtimeState.syncStatus.lastSyncedAt) {
    return {
      key: "preparing",
      titleKey: "settings.syncExperiencePreparingTitle",
      descriptionKey: "settings.syncExperiencePreparingDescription",
      badgeKey: "settings.syncExperiencePreparingBadge",
      tone: "neutral",
    };
  }

  return {
    key: "completed",
    titleKey: "settings.syncExperienceCompletedTitle",
    descriptionKey: "settings.syncExperienceCompletedDescription",
    badgeKey: "settings.syncExperienceCompletedBadge",
    tone: "primary",
  };
}

function getRuntimeSyncState(
  runtimeState: AccountRuntimeState
): SyncStateDefinition {
  if (runtimeState.localOnly) {
    return syncStates[0];
  }

  switch (runtimeState.syncCapability.availability) {
    case "available":
      return syncStates[1];
    case "paused":
      return syncStates[2];
    case "offline":
      return syncStates[3];
    case "conflict":
      return syncStates[4];
    case "disabled":
    case "local-only":
    default:
      return syncStates[0];
  }
}

function getRuntimeAccountPresentation(
  runtimeState: AccountRuntimeState,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
): RuntimeAccountPresentation {
  const emailProviderActive =
    runtimeState.accountProviderId === EMAIL_ACCOUNT_PROVIDER_ID;

  if (runtimeState.localOnly) {
    return {
      titleKey: "settings.accountLocalOnlyTitle",
      badgeLabel: t("settings.noOnlineAccount"),
      summaryStatusKey: "settings.syncStatusLocalOnly",
      description: runtimeState.detail,
      detailsLabelKey: "settings.accountDetailsLabel",
      detailsValue: t("settings.accountDetailsLocalOnly"),
      actionsTitleKey: "settings.accountFutureActionsTitle",
      actionsDescriptionKey: "settings.accountFutureActionsDescription",
      actionStatusKey: "settings.accountFutureActionsStatus",
      actionKeys: localOnlyActions,
      noteKey: "settings.accountFutureActionsNote",
      hintKey: "settings.accountFutureActionsHint",
    };
  }

  if (runtimeState.accountStatus === "authenticated" && runtimeState.identity) {
    return {
      titleKey: "settings.accountSignedInTitle",
      badgeLabel: runtimeState.identity.email ?? runtimeState.session.providerId,
      summaryStatusKey: "settings.accountStatusSignedIn",
      description: runtimeState.detail,
      detailsLabelKey: "settings.accountDetailsLabel",
      detailsValue:
        runtimeState.identity.displayName ??
        runtimeState.identity.email ??
        runtimeState.identity.accountId,
      actionsTitleKey: "settings.accountSessionActionsTitle",
      actionsDescriptionKey: emailProviderActive
        ? "settings.accountEmailSessionActionsDescription"
        : "settings.accountSessionActionsDescription",
      actionStatusKey: "settings.accountSessionActionsStatus",
      actionKeys: signedInActions,
      noteKey: emailProviderActive
        ? "settings.accountEmailSessionActionsNote"
        : "settings.accountSessionActionsNote",
      hintKey: emailProviderActive
        ? "settings.accountEmailSessionActionsHint"
        : "settings.accountSessionActionsHint",
    };
  }

  return {
    titleKey: emailProviderActive
      ? "settings.accountEmailTitle"
      : "settings.accountSignedOutTitle",
    badgeLabel: t("settings.accountStatusSignedOut"),
    summaryStatusKey: "settings.accountStatusSignedOut",
    description: runtimeState.detail,
    detailsLabelKey: "settings.accountDetailsLabel",
    detailsValue: t("settings.accountDetailsSignedOut"),
    actionsTitleKey: emailProviderActive
      ? "settings.accountEmailActionsTitle"
      : "settings.accountSignInPreparationTitle",
    actionsDescriptionKey: emailProviderActive
      ? "settings.accountEmailActionsDescription"
      : "settings.accountSignInPreparationDescription",
    actionStatusKey: emailProviderActive
      ? "settings.accountEmailActionsStatus"
      : "settings.accountSignInPreparationStatus",
    actionKeys: signedOutActions,
    noteKey: emailProviderActive
      ? "settings.accountEmailActionsNote"
      : "settings.accountSignInPreparationNote",
    hintKey: emailProviderActive
      ? "settings.accountEmailActionsHint"
      : "settings.accountSignInPreparationHint",
  };
}

export function SyncStatusAdvancedPanel({
  onGoToBackupRestore,
}: SyncStatusAdvancedPanelProps) {
  const { t } = useI18n();
  const { boundary } = useAccountRuntime();
  const runtimeState = useAccountRuntimeState();
  const { provider } = useAuth();
  const conflictSnapshot = boundary.getSyncConflictSnapshot();
  const [accountActionFeedback, setAccountActionFeedback] = useState<string | null>(
    null
  );
  const [accountActionPending, setAccountActionPending] = useState<
    "create-account" | "sign-in" | "sign-out" | null
  >(null);
  const [syncActionPending, setSyncActionPending] = useState(false);
  const [syncActionFeedback, setSyncActionFeedback] = useState<string | null>(null);
  const [conflictReview, setConflictReview] = useState<ConflictReviewState>(() => ({
    expanded: conflictSnapshot.length > 0,
    loading: false,
    records: conflictSnapshot.length > 0 ? conflictSnapshot : null,
    feedback: null,
    error: null,
    pendingActionKey: null,
  }));
  const futureActionsDescriptionId = "account-sync-future-actions-description";
  const currentState = getRuntimeSyncState(runtimeState);
  const syncHealth = getSyncHealthSummary(runtimeState);
  const syncExperienceState = getSyncExperienceState(runtimeState);
  const accountPresentation = getRuntimeAccountPresentation(runtimeState, t);
  const accountDescription = getUserFacingSyncDetail(
    accountPresentation.description,
    t
  );
  const syncDetail = getUserFacingSyncDetail(runtimeState.syncStatus.detail, t);
  const syncActionFeedbackMessage = syncActionFeedback
    ? getUserFacingSyncDetail(syncActionFeedback, t)
    : null;
  const interactiveGoogleProvider = getInteractiveGoogleProvider(provider);
  const interactiveEmailProvider = getInteractiveEmailProvider(provider);
  const canCreateAccount =
    interactiveEmailProvider !== null && !runtimeState.hasActiveAccount;
  const canSignIn =
    (interactiveEmailProvider !== null || interactiveGoogleProvider !== null) &&
    !runtimeState.hasActiveAccount;
  const canSignOut =
    (interactiveEmailProvider !== null || interactiveGoogleProvider !== null) &&
    runtimeState.hasActiveAccount;
  const canEnableSync =
    runtimeState.hasActiveAccount &&
    runtimeState.syncStatus.enabled !== true &&
    !syncActionPending;
  const accountMetadataRows: readonly RuntimeMetadataRow[] = [
    {
      labelKey: "settings.accountProviderLabel",
      value: getProviderLabel(runtimeState, t),
      descriptionKey: "settings.accountProviderDescription",
    },
    {
      labelKey: "settings.accountDeviceLabel",
      value: runtimeState.syncMetadata.device.label,
      descriptionKey: "settings.accountDeviceDescription",
    },
    {
      labelKey: "settings.syncLastSyncedLabel",
      value: getSyncLastSeenLabel(runtimeState, t),
      descriptionKey: "settings.syncLastSyncedDescription",
    },
    ...(runtimeState.syncStatus.lastTrustedDevice
      ? [
          {
            labelKey: "settings.syncTrustedDeviceLabel" as const,
            value: runtimeState.syncStatus.lastTrustedDevice.label,
            descriptionKey: "settings.syncTrustedDeviceDescription" as const,
          },
        ]
      : []),
  ];
  const futureStates = syncStates.filter(
    (state) => state.titleKey !== currentState.titleKey
  );
  const syncedScopeKeys =
    runtimeState.syncStatus.scopes?.map((scope) => getSyncScopeLabelKey(scope)) ??
    [];
  const categoryStatuses = runtimeState.syncStatus.categoryStatuses ?? [];
  const manualPreparation = runtimeState.syncStatus.manualPreparation;
  const connectedDevices = runtimeState.syncStatus.connectedDevices ?? [];
  const deviceRows = useMemo(() => {
    if (runtimeState.localOnly) {
      return [];
    }

    const devices = new Map<
      string,
      Readonly<{ deviceId: string; label: string; lastSyncedAt?: string }>
    >();

    if (runtimeState.syncMetadata.device.deviceId) {
      devices.set(runtimeState.syncMetadata.device.deviceId, {
        deviceId: runtimeState.syncMetadata.device.deviceId,
        label: runtimeState.syncMetadata.device.label,
        lastSyncedAt: runtimeState.syncStatus.lastSyncedAt,
      });
    }

    connectedDevices.forEach((device) => {
      const existing = devices.get(device.deviceId);
      devices.set(device.deviceId, {
        deviceId: device.deviceId,
        label: device.label,
        lastSyncedAt: existing?.lastSyncedAt ?? device.lastSyncedAt,
      });
    });

    return [...devices.values()].sort((left, right) =>
      (right.lastSyncedAt ?? "").localeCompare(left.lastSyncedAt ?? "")
    );
  }, [
    connectedDevices,
    runtimeState.localOnly,
    runtimeState.syncMetadata.device.deviceId,
    runtimeState.syncMetadata.device.label,
    runtimeState.syncStatus.lastSyncedAt,
  ]);
  const needsFirstSyncGuidance =
    !runtimeState.localOnly && !runtimeState.syncStatus.lastSyncedAt;
  const showRetryPanel =
    !runtimeState.localOnly &&
    runtimeState.hasActiveAccount &&
    runtimeState.syncStatus.enabled === true;
  const canRetrySync =
    showRetryPanel && runtimeState.authStatus === "authenticated" && !syncActionPending;
  const hasConflictIssue =
    runtimeState.syncStatus.issue === "conflict" &&
    (runtimeState.syncStatus.conflictCount ?? 0) > 0;
  const conflictRecords = conflictReview.records ?? [];
  const conflictEntityCounts = useMemo(() => {
    return conflictRecords.reduce<Record<SyncConflictEntity, number>>(
      (counts, conflict) => {
        counts[conflict.entity] += 1;
        return counts;
      },
      {
        tasks: 0,
        routines: 0,
        projects: 0,
        goals: 0,
        financeTransactions: 0,
        financeObligations: 0,
        manualEntries: 0,
      }
    );
  }, [conflictRecords]);

  const handleGoogleSignIn = async () => {
    if (!interactiveGoogleProvider) {
      return;
    }

    setAccountActionPending("sign-in");
    setAccountActionFeedback(null);

    try {
      await interactiveGoogleProvider.login({});
      setAccountActionFeedback(t("settings.accountGoogleSignInSuccess"));
    } catch (error) {
      setAccountActionFeedback(
        error instanceof Error
          ? error.message
          : t("settings.accountGoogleSignInError")
      );
    } finally {
      setAccountActionPending(null);
    }
  };

  const handleEmailCreateAccount = async (input: {
    email: string;
    password: string;
  }) => {
    if (!interactiveEmailProvider) {
      return;
    }

    setAccountActionPending("create-account");
    setAccountActionFeedback(null);

    try {
      const result = await interactiveEmailProvider.createAccount(input);
      setAccountActionFeedback(
        result.requiresVerification
          ? t("settings.accountEmailVerificationRequired")
          : t("settings.accountEmailCreateSuccess")
      );
    } catch (error) {
      setAccountActionFeedback(
        error instanceof Error
          ? error.message
          : t("settings.accountEmailCreateError")
      );
    } finally {
      setAccountActionPending(null);
    }
  };

  const handleEmailSignIn = async (input: {
    email: string;
    password: string;
  }) => {
    if (!interactiveEmailProvider) {
      return;
    }

    setAccountActionPending("sign-in");
    setAccountActionFeedback(null);

    try {
      await interactiveEmailProvider.login(input);
      setAccountActionFeedback(t("settings.accountEmailSignInSuccess"));
    } catch (error) {
      setAccountActionFeedback(
        error instanceof Error
          ? error.message
          : t("settings.accountEmailSignInError")
      );
    } finally {
      setAccountActionPending(null);
    }
  };

  const handleSignOut = async () => {
    const interactiveProvider =
      interactiveEmailProvider ?? interactiveGoogleProvider;
    if (!interactiveProvider) {
      return;
    }

    setAccountActionPending("sign-out");
    setAccountActionFeedback(null);

    try {
      await interactiveProvider.logout();
      setAccountActionFeedback(
        interactiveEmailProvider
          ? t("settings.accountEmailSignOutSuccess")
          : t("settings.accountGoogleSignOutSuccess")
      );
    } catch (error) {
      setAccountActionFeedback(
        error instanceof Error
          ? error.message
          : interactiveEmailProvider
            ? t("settings.accountEmailSignOutError")
            : t("settings.accountGoogleSignOutError")
      );
    } finally {
      setAccountActionPending(null);
    }
  };

  const handleRetrySync = async () => {
    setSyncActionPending(true);
    setSyncActionFeedback(null);

    try {
      const status = await boundary.syncNow();
      setSyncActionFeedback(status.detail);
    } catch (error) {
      setSyncActionFeedback(
        error instanceof Error ? error.message : t("settings.syncRetryError")
      );
    } finally {
      setSyncActionPending(false);
    }
  };

  const handleEnableSync = async () => {
    setSyncActionPending(true);
    setSyncActionFeedback(null);

    try {
      const status = await boundary.syncNow();
      setSyncActionFeedback(status.detail);
    } catch (error) {
      setSyncActionFeedback(
        error instanceof Error ? error.message : t("settings.accountEnableSyncError")
      );
    } finally {
      setSyncActionPending(false);
    }
  };

  useEffect(() => {
    if (hasConflictIssue) {
      return;
    }

    setConflictReview((current) => ({
      ...current,
      expanded: false,
      loading: false,
      records: [],
      error: null,
      pendingActionKey: null,
    }));
  }, [hasConflictIssue]);

  const loadConflictRecords = async () => {
    setConflictReview((current) => ({
      ...current,
      loading: true,
      error: null,
      feedback: null,
    }));

    try {
      const records = await boundary.getSyncConflicts();
      setConflictReview((current) => ({
        ...current,
        loading: false,
        records,
        error: null,
      }));
    } catch (error) {
      setConflictReview((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : t("settings.syncConflictLoadError"),
      }));
    }
  };

  const toggleConflictReview = () => {
    setConflictReview((current) => ({
      ...current,
      expanded: !current.expanded,
      error: null,
      feedback: null,
    }));

    if (!conflictReview.expanded && conflictReview.records === null) {
      void loadConflictRecords();
    }
  };

  const handleResolveConflict = async (
    conflict: SyncConflictRecord,
    resolution: SyncConflictResolutionChoice
  ) => {
    const confirmationMessage = getConflictConfirmationMessage(
      t,
      conflict,
      resolution
    );

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(confirmationMessage)
    ) {
      return;
    }

    const pendingActionKey = getConflictResolutionActionKey(conflict, resolution);
    setConflictReview((current) => ({
      ...current,
      pendingActionKey,
      error: null,
      feedback: null,
    }));

    try {
      await boundary.resolveSyncConflict({
        entity: conflict.entity,
        recordId: conflict.recordId,
        resolution,
      });
      const records = await boundary.getSyncConflicts();
      setConflictReview((current) => ({
        ...current,
        pendingActionKey: null,
        records,
        feedback:
          resolution === "keep-local"
            ? t("settings.syncConflictResolvedKeepLocal", {
                title: conflict.title,
              })
            : t("settings.syncConflictResolvedKeepRemote", {
                title: conflict.title,
              }),
      }));
    } catch (error) {
      setConflictReview((current) => ({
        ...current,
        pendingActionKey: null,
        error:
          error instanceof Error
            ? error.message
            : t("settings.syncConflictResolveError"),
      }));
    }
  };

  const visibleActionKeys = accountPresentation.actionKeys.filter((action) =>
    canCreateAccount
      ? action.labelKey !== "settings.accountCreateAction"
      : canSignIn
        ? action.labelKey !== "settings.accountSignInAction"
      : canSignOut
        ? action.labelKey !== "settings.accountSignOutAction"
        : canEnableSync
          ? action.labelKey !== "settings.accountEnableSyncAction"
        : true
  );
  const accountActionStatusTone: SyncStateTone = runtimeState.localOnly
    ? "neutral"
    : runtimeState.hasActiveAccount || canSignIn || canCreateAccount
      ? "primary"
      : "warning";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-primary" />
          {t("settings.accountSyncTitle")}
        </CardTitle>
        <CardDescription>{t("settings.accountSyncDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className="grid gap-3 md:grid-cols-3"
          aria-label={t("settings.accountSyncSnapshotLabel")}
        >
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountCurrentStateLabel")}
            </p>
            <div className="mt-2">
              <StatusChip
                tone={
                  runtimeState.localOnly
                    ? "neutral"
                    : runtimeState.hasActiveAccount
                      ? "primary"
                      : "warning"
                }
              >
                {t(accountPresentation.summaryStatusKey)}
              </StatusChip>
            </div>
            <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
              {accountPresentation.badgeLabel}
            </p>
            <p className="mt-2 text-sm font-medium">
              {t("settings.accountPrivacyValue")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.syncHealthLabel")}
            </p>
            <div className="mt-2">
              <StatusChip tone={syncHealth.tone}>{t(syncHealth.labelKey)}</StatusChip>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(syncHealth.descriptionKey)}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.syncLastSyncedLabel")}
            </p>
            <p className="mt-2 break-words text-sm font-medium">
              {getSyncLastSeenLabel(runtimeState, t)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("settings.syncLastSyncedDescription")}
            </p>
          </SoftPanel>
        </div>

        <SoftPanel className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t(accountPresentation.actionsTitleKey)}
                </p>
                <p
                  id={futureActionsDescriptionId}
                  className="mt-1 text-sm leading-7 text-muted-foreground"
                >
                  {t(accountPresentation.actionsDescriptionKey)}
                </p>
              </div>
            </div>
            <StatusChip tone={accountActionStatusTone}>
              {t(accountPresentation.actionStatusKey)}
            </StatusChip>
          </div>
          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            role="group"
            aria-label={t(accountPresentation.actionsTitleKey)}
          >
            {!runtimeState.hasActiveAccount && interactiveEmailProvider ? (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmailAccountAuthForm
                  busyAction={accountActionPending}
                  feedback={accountActionFeedback}
                  onCreateAccount={handleEmailCreateAccount}
                  onSignIn={handleEmailSignIn}
                />
              </div>
            ) : null}
            {!runtimeState.hasActiveAccount && interactiveGoogleProvider ? (
              <Button
                type="button"
                className="min-h-11 w-full justify-start sm:w-auto"
                onClick={() => {
                  void handleGoogleSignIn();
                }}
                disabled={accountActionPending !== null}
                aria-describedby={futureActionsDescriptionId}
              >
                <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
                {accountActionPending === "sign-in"
                  ? t("settings.accountGoogleSigningIn")
                  : t("settings.accountGoogleSignInAction")}
              </Button>
            ) : null}
            {canSignOut ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-start sm:w-auto"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={accountActionPending !== null}
                aria-describedby={futureActionsDescriptionId}
              >
                <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
                {accountActionPending === "sign-out"
                  ? interactiveEmailProvider
                    ? t("settings.accountEmailSigningOut")
                    : t("settings.accountGoogleSigningOut")
                  : t("settings.accountSignOutAction")}
              </Button>
            ) : null}
            {canEnableSync ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full justify-start sm:w-auto"
                onClick={() => {
                  void handleEnableSync();
                }}
                disabled={syncActionPending}
                aria-describedby={futureActionsDescriptionId}
              >
                <RefreshCw
                  className={`me-2 h-4 w-4 ${syncActionPending ? "animate-spin" : ""}`}
                />
                {syncActionPending
                  ? t("settings.accountEnableSyncPending")
                  : t("settings.accountEnableSyncAction")}
              </Button>
            ) : null}
            {visibleActionKeys.map((action) => (
              <ConsentActionPlaceholder
                key={action.labelKey}
                label={`${t(action.labelKey)} - ${t(action.statusKey)}`}
                descriptionId={futureActionsDescriptionId}
              />
            ))}
          </div>
          {accountActionFeedback &&
          (interactiveEmailProvider === null || runtimeState.hasActiveAccount) ? (
            <div
              role="status"
              className="rounded-xl border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground"
            >
              {getUserFacingSyncDetail(accountActionFeedback ?? "", t)}
            </div>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            {t(accountPresentation.noteKey)}
          </p>
        </SoftPanel>

        <CollapsibleSection
          id="account-sync-advanced-details"
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t("settings.syncAdvancedDetailsTitle")}
          description={t("settings.syncAdvancedDetailsDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          status={<StatusChip tone="neutral">{t("settings.localFirst")}</StatusChip>}
          defaultOpen={false}
        >
          <div className="space-y-5">
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.syncCategoriesLabel")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {syncedScopeKeys.map((scopeKey) => (
                  <Badge key={scopeKey} variant="secondary">
                    {t(scopeKey)}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {runtimeState.localOnly
                  ? t("settings.syncCategoriesLocalOnlyDescription")
                  : t("settings.syncCategoriesConnectedDescription")}
              </p>
              {manualPreparation ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {t("settings.syncManualPreparationSummary", {
                    count: manualPreparation.entryCount,
                  })}
                </p>
              ) : null}
            </SoftPanel>

        <section
          aria-labelledby="account-sync-current-state"
          className="space-y-3"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="alios-icon-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  id="account-sync-current-state"
                  className="text-base font-semibold leading-6"
                >
                  {t(accountPresentation.titleKey)}
                </p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {accountDescription}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:max-w-[16rem] sm:justify-end">
              <StatusChip
                tone={
                  runtimeState.localOnly
                    ? "neutral"
                    : runtimeState.hasActiveAccount
                      ? "primary"
                      : "warning"
                }
              >
                {t(accountPresentation.summaryStatusKey)}
              </StatusChip>
              <Badge
                variant="secondary"
                className="max-w-full break-all text-start"
              >
                {accountPresentation.badgeLabel}
              </Badge>
            </div>
          </div>
          <SyncStatePreview state={currentState} />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t(accountPresentation.detailsLabelKey)}
              </p>
              <p className="mt-2 break-words text-sm leading-6">
                {accountPresentation.detailsValue}
              </p>
            </SoftPanel>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accountMetadataRows.map((row) => (
                <SoftPanel key={row.labelKey} className="alios-surface-muted">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t(row.labelKey)}
                  </p>
                  <p className="mt-2 break-words text-sm font-medium">
                    {row.value}
                  </p>
                  {row.descriptionKey ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {t(row.descriptionKey)}
                    </p>
                  ) : null}
                </SoftPanel>
              ))}
            </div>
          </div>
          {!runtimeState.localOnly ? (
            <CollapsibleSection
              id="account-sync-device-details"
              icon={<LaptopMinimal className="h-5 w-5" />}
              title={t("settings.syncConnectedDevicesTitle")}
              description={t("settings.syncConnectedDevicesDescription")}
              expandLabel={t("common.expandSection")}
              collapseLabel={t("common.collapseSection")}
              status={
                <StatusChip tone={syncExperienceState.tone}>
                  {t(syncExperienceState.badgeKey)}
                </StatusChip>
              }
              defaultOpen={false}
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
                <SoftPanel className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {t("settings.syncExperienceTitle")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {t(syncExperienceState.descriptionKey)}
                      </p>
                    </div>
                    <StatusChip tone={syncExperienceState.tone}>
                      {t(syncExperienceState.badgeKey)}
                    </StatusChip>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
                    <p className="text-sm font-medium">
                      {t(syncExperienceState.titleKey)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {syncDetail}
                    </p>
                  </div>
                  <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
                    <li>{t("settings.syncExperienceFirstDeviceRule")}</li>
                    <li>{t("settings.syncExperienceSecondDeviceRule")}</li>
                    <li>{t("settings.syncExperienceRecoveryRule")}</li>
                  </ul>
                </SoftPanel>
                <SoftPanel className="space-y-3">
                  <div className="flex items-start gap-2">
                    <LaptopMinimal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("settings.syncConnectedDevicesTitle")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {t("settings.syncConnectedDevicesDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SoftPanel className="alios-surface-muted">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {t("settings.syncCurrentDeviceTitle")}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {runtimeState.syncMetadata.device.label}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {t("settings.syncCurrentDeviceDescription")}
                      </p>
                    </SoftPanel>
                    <SoftPanel className="alios-surface-muted">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {t("settings.syncConnectedDeviceCountTitle")}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {t("settings.syncConnectedDeviceCountValue", {
                          count: deviceRows.length,
                        })}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {t("settings.syncConnectedDeviceCountDescription")}
                      </p>
                    </SoftPanel>
                  </div>
                  {deviceRows.length > 0 ? (
                    <div className="space-y-2" role="list" aria-label={t("settings.syncConnectedDevicesTitle")}>
                      {deviceRows.map((device) => (
                        <div
                          key={device.deviceId}
                          className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                          role="listitem"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{device.label}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {device.deviceId === runtimeState.syncMetadata.device.deviceId
                                ? t("settings.syncCurrentDeviceBadge")
                                : t("settings.syncConnectedDeviceBadge")}
                            </p>
                          </div>
                          <p className="text-xs leading-5 text-muted-foreground sm:text-end">
                            {device.lastSyncedAt
                              ? t("settings.syncConnectedDeviceLastSynced", {
                                  value: device.lastSyncedAt,
                                })
                              : t("settings.syncConnectedDevicePending")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </SoftPanel>
              </div>
            </CollapsibleSection>
          ) : null}
          {needsFirstSyncGuidance ? (
            <CollapsibleSection
              id="account-sync-first-sync-guidance"
              icon={<RefreshCw className="h-5 w-5" />}
              title={t("settings.syncExperiencePreparingTitle")}
              description={t("settings.syncExperiencePreparingDescription")}
              expandLabel={t("common.expandSection")}
              collapseLabel={t("common.collapseSection")}
              status={
                <StatusChip tone="warning">
                  {t("settings.syncExperiencePreparingBadge")}
                </StatusChip>
              }
              defaultOpen={false}
            >
              <div className="grid gap-3 lg:grid-cols-3">
                <SoftPanel className="alios-surface-muted">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("settings.syncConsentScopeLabel")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("settings.syncConsentScopeValue")}
                  </p>
                </SoftPanel>
                <SoftPanel className="alios-surface-muted">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("settings.syncPrivacyLocalTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("settings.syncPrivacyLocalDescription")}
                  </p>
                </SoftPanel>
                <SoftPanel className="alios-surface-muted">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("settings.syncFirstSyncNextStepLabel")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {runtimeState.hasActiveAccount
                      ? t("settings.syncFirstSyncNextStepSignedIn")
                      : canSignIn
                      ? t("settings.accountSignInPreparationDescription")
                      : t("settings.syncRetryDescription")}
                  </p>
                </SoftPanel>
              </div>
            </CollapsibleSection>
          ) : null}
          {categoryStatuses.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {categoryStatuses.map((category) => (
                <SoftPanel
                  key={category.key}
                  className="alios-surface-muted space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {t(getSyncCategoryLabelKey(category.key))}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {category.detail}
                      </p>
                    </div>
                    <StatusChip
                      tone={getCategoryTone(category)}
                    >
                      {t(
                        category.state === "ready"
                          ? "settings.syncStatusAvailable"
                          : category.state === "syncing"
                            ? "settings.syncHealthSyncing"
                            : category.state === "planned"
                              ? "settings.accountActionPlannedOnly"
                              : category.key === "manual" &&
                                  category.visibility === "metadata-only"
                                ? "settings.syncStatusPrepared"
                                : "settings.syncStatusLocalOnly"
                      )}
                    </StatusChip>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs leading-5 text-muted-foreground">
                    <span>
                      {t("settings.syncPrivacyBadge", {
                        level: t(getPrivacyLevelLabelKey(category.privacyLevel)),
                      })}
                    </span>
                    <span>
                      {t("settings.syncVisibilityBadge", {
                        visibility: t(getVisibilityLabelKey(category.visibility)),
                      })}
                    </span>
                    {typeof category.itemCount === "number" ? (
                      <span>
                        {t("settings.syncCategoryItemCount", {
                          count: category.itemCount,
                        })}
                      </span>
                    ) : null}
                    {category.lastSyncedAt ? (
                      <span>
                        {t("settings.syncCategoryLastUpdated", {
                          value: category.lastSyncedAt,
                        })}
                      </span>
                    ) : null}
                  </div>
                </SoftPanel>
              ))}
            </div>
          ) : null}

          <CollapsibleSection
            id="account-sync-privacy"
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t("settings.syncPrivacySectionTitle")}
            description={t("settings.syncPrivacySectionDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            status={
              <StatusChip tone="primary">
                {t("settings.syncPrivacySectionStatus")}
              </StatusChip>
            }
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <SoftPanel className="alios-surface-muted">
                  <p className="text-sm font-medium">
                    {t("settings.syncPrivacySyncedTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("settings.syncPrivacySyncedDescription")}
                  </p>
                </SoftPanel>
                <SoftPanel className="alios-surface-muted">
                  <p className="text-sm font-medium">
                    {t("settings.syncPrivacyLocalTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("settings.syncPrivacyLocalDescription")}
                  </p>
                </SoftPanel>
              </div>
              <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
                <li>{t("settings.syncPrivacyRuleNoSilentUpload")}</li>
                <li>{t("settings.syncPrivacyRuleNoCategoryActivation")}</li>
                <li>{t("settings.syncPrivacyRuleLocalAvailability")}</li>
              </ul>
            </div>
          </CollapsibleSection>
          {showRetryPanel ? (
            <SoftPanel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {t("settings.syncRetryTitle")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("settings.syncRetryDescription")}
                </p>
                {syncActionFeedback ? (
                  <p className="text-xs leading-5 text-muted-foreground">
                    {syncActionFeedbackMessage}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-start sm:w-auto"
                onClick={() => {
                  void handleRetrySync();
                }}
                disabled={!canRetrySync}
              >
                <RefreshCw
                  className={`me-2 h-4 w-4 ${syncActionPending ? "animate-spin" : ""}`}
                />
                {syncActionPending
                  ? t("settings.syncRetryPending")
                  : t("settings.syncRetryAction")}
              </Button>
            </SoftPanel>
          ) : null}

          {!runtimeState.localOnly ? (
            <SoftPanel className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitCompareArrows className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">
                      {t("settings.syncConflictReviewTitle")}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {hasConflictIssue
                      ? t("settings.syncConflictReviewDetectedDescription", {
                          count: runtimeState.syncStatus.conflictCount ?? 0,
                        })
                      : t("settings.syncConflictReviewEmptyDescription")}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <StatusChip tone={hasConflictIssue ? "danger" : "primary"}>
                    {hasConflictIssue
                      ? t("settings.syncConflictReviewDetectedBadge", {
                          count: runtimeState.syncStatus.conflictCount ?? 0,
                        })
                      : t("settings.syncConflictReviewEmptyBadge")}
                  </StatusChip>
                  {hasConflictIssue ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full justify-start sm:w-auto"
                      onClick={toggleConflictReview}
                      aria-expanded={conflictReview.expanded}
                    >
                      <GitCompareArrows className="me-2 h-4 w-4" />
                      {conflictReview.expanded
                        ? t("settings.syncConflictHideAction")
                        : t("settings.syncConflictReviewAction")}
                    </Button>
                  ) : null}
                </div>
              </div>

              {hasConflictIssue ? (
                <div className="flex flex-wrap gap-2">
                  {(conflictEntityCounts.tasks > 0 ||
                    conflictEntityCounts.projects > 0 ||
                    conflictEntityCounts.goals > 0 ||
                    conflictEntityCounts.financeTransactions > 0 ||
                    conflictEntityCounts.financeObligations > 0 ||
                    conflictEntityCounts.manualEntries > 0
                    ? (
                        [
                          "tasks",
                          "projects",
                          "goals",
                          "financeTransactions",
                          "financeObligations",
                          "manualEntries",
                        ] as const
                      ).filter(
                        (entity) => conflictEntityCounts[entity] > 0
                      )
                    : (
                        [
                          "tasks",
                          "projects",
                          "goals",
                          "financeTransactions",
                          "financeObligations",
                          "manualEntries",
                        ] as const
                      )
                  ).map((entity) => (
                    <Badge key={entity} variant="secondary">
                      {t(getConflictEntityLabelKey(entity))}
                      {conflictEntityCounts[entity] > 0
                        ? ` (${conflictEntityCounts[entity]})`
                        : ""}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {conflictReview.feedback ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {conflictReview.feedback}
                </p>
              ) : null}
              {conflictReview.error ? (
                <p className="text-sm leading-6 text-destructive">
                  {conflictReview.error}
                </p>
              ) : null}

              {conflictReview.expanded ? (
                conflictReview.loading ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("settings.syncConflictLoading")}
                  </p>
                ) : conflictRecords.length === 0 ? (
                  <SoftPanel className="alios-surface-muted">
                    <p className="text-sm font-medium">
                      {t("settings.syncConflictEmptyTitle")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t("settings.syncConflictEmptyDescription")}
                    </p>
                  </SoftPanel>
                ) : (
                  <div className="space-y-3" role="list" aria-label={t("settings.syncConflictReviewTitle")}>
                    {conflictRecords.map((conflict) => {
                      const keepLocalActionKey = getConflictResolutionActionKey(
                        conflict,
                        "keep-local"
                      );
                      const keepRemoteActionKey = getConflictResolutionActionKey(
                        conflict,
                        "keep-remote"
                      );

                      return (
                        <SoftPanel
                          key={`${conflict.entity}:${conflict.recordId}`}
                          className="space-y-4"
                          role="listitem"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {conflict.title}
                                </p>
                                <Badge variant="secondary">
                                  {t(getConflictEntityLabelKey(conflict.entity))}
                                </Badge>
                              </div>
                              <p className="text-xs leading-5 text-muted-foreground">
                                {t("settings.syncConflictDetectedAt", {
                                  value: conflict.conflictAt,
                                })}
                              </p>
                            </div>
                            <StatusChip tone="danger">
                              {t("settings.syncStatusConflict")}
                            </StatusChip>
                          </div>

                          <div className="grid gap-3 lg:grid-cols-2">
                            <SoftPanel className="alios-surface-muted">
                              <div className="flex items-center gap-2">
                                <LaptopMinimal className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">
                                  {t("settings.syncConflictLocalVersionLabel")}
                                </p>
                              </div>
                              <dl className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictDeviceLabel")}
                                  </dt>
                                  <dd>{conflict.localDeviceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictModifiedAtLabel")}
                                  </dt>
                                  <dd>{conflict.localUpdatedAt}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictLastSyncedLabel")}
                                  </dt>
                                  <dd>
                                    {conflict.localLastSyncedAt ??
                                      t("settings.syncLastSyncedNever")}
                                  </dd>
                                </div>
                              </dl>
                            </SoftPanel>

                            <SoftPanel className="alios-surface-muted">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium">
                                  {t("settings.syncConflictRemoteVersionLabel")}
                                </p>
                              </div>
                              <dl className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictDeviceLabel")}
                                  </dt>
                                  <dd>{conflict.remoteDeviceLabel}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictModifiedAtLabel")}
                                  </dt>
                                  <dd>{conflict.remoteUpdatedAt}</dd>
                                </div>
                                <div>
                                  <dt className="font-medium text-foreground">
                                    {t("settings.syncConflictLastSyncedLabel")}
                                  </dt>
                                  <dd>
                                    {conflict.remoteLastSyncedAt ??
                                      t("settings.syncLastSyncedNever")}
                                  </dd>
                                </div>
                              </dl>
                            </SoftPanel>
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11 w-full justify-start sm:w-auto"
                              disabled={conflictReview.pendingActionKey !== null}
                              onClick={() => {
                                void handleResolveConflict(conflict, "keep-local");
                              }}
                            >
                              <LaptopMinimal className="me-2 h-4 w-4" />
                              {conflictReview.pendingActionKey === keepLocalActionKey
                                ? t("settings.syncConflictPendingKeepLocal")
                                : t("settings.syncConflictKeepLocalAction")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="min-h-11 w-full justify-start sm:w-auto"
                              disabled={conflictReview.pendingActionKey !== null}
                              onClick={() => {
                                void handleResolveConflict(conflict, "keep-remote");
                              }}
                            >
                              <Smartphone className="me-2 h-4 w-4" />
                              {conflictReview.pendingActionKey === keepRemoteActionKey
                                ? t("settings.syncConflictPendingKeepRemote")
                                : t("settings.syncConflictKeepRemoteAction")}
                            </Button>
                          </div>
                        </SoftPanel>
                      );
                    })}
                  </div>
                )
              ) : null}
            </SoftPanel>
          ) : null}
        </section>

        <CollapsibleSection
          id="account-sync-other-states"
          icon={<Cloudy className="h-5 w-5" />}
          title={t("settings.syncStatesTitle")}
          description={t("settings.syncStatesDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          status={
            <StatusChip tone="neutral">
              {t("settings.syncStatusAvailable")}
            </StatusChip>
          }
          defaultOpen={false}
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {futureStates.map((state) => (
              <SyncStatePreview key={state.titleKey} state={state} />
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="account-sync-consent"
          icon={<Cloudy className="h-5 w-5" />}
          title={t("settings.syncConsentTitle")}
          description={t("settings.syncConsentDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          status={
            <StatusChip tone="primary">
              {t("settings.syncStatusAvailable")}
            </StatusChip>
          }
          defaultOpen={false}
        >
          <div className="space-y-4">
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncConsentAccount")}</li>
              <li>{t("settings.syncConsentExplicit")}</li>
              <li>{t("settings.syncConsentScope")}</li>
              <li>{t("settings.syncConsentLocal")}</li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-3">
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentScopeLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentScopeValue")}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentControlLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentControlValue")}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentSafetyLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentSafetyValue")}
                </p>
              </SoftPanel>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.syncPlannedProvider", {
                provider: OPTIONAL_SYNC_PROVIDER_ID,
              })}
            </p>
          </div>
        </CollapsibleSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <CollapsibleSection
            id="account-sync-offline"
            icon={<WifiOff className="h-5 w-5" />}
            title={t("settings.syncOfflineFoundationTitle")}
            description={t("settings.syncOfflineFoundationDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            status={
              <StatusChip tone="warning">
                {t("settings.syncStatusOffline")}
              </StatusChip>
            }
            defaultOpen={false}
          >
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncOfflineFoundationLocalWork")}</li>
              <li>{t("settings.syncOfflineFoundationUnavailable")}</li>
              <li>{t("settings.syncOfflineFoundationReturn")}</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            id="account-sync-conflict"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t("settings.syncConflictFoundationTitle")}
            description={t("settings.syncConflictFoundationDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            status={
              <StatusChip tone="danger">
                {t("settings.syncStatusConflict")}
              </StatusChip>
            }
            defaultOpen={false}
          >
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncConflictFoundationDecision")}</li>
              <li>{t("settings.syncConflictFoundationNoOverwrite")}</li>
              <li>{t("settings.syncConflictFoundationReview")}</li>
            </ul>
          </CollapsibleSection>
        </div>

        <CollapsibleSection
          id="account-sync-device-transfer"
          icon={<LaptopMinimal className="h-5 w-5" />}
          title={t("settings.deviceTransferTitle")}
          description={t("settings.deviceTransferDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
        >
          <ol className="mt-3 list-decimal space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
            <li>{t("settings.deviceTransferExport")}</li>
            <li>{t("settings.deviceTransferMove")}</li>
            <li>{t("settings.deviceTransferRestore")}</li>
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 w-full sm:w-auto"
            onClick={onGoToBackupRestore}
          >
            {t("settings.deviceTransferAction")}
          </Button>
        </CollapsibleSection>
          </div>
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
}
