import { lazy, Suspense, useState } from "react";
import {
  ArrowUpRight,
  CloudOff,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAccountRuntime, useAccountRuntimeState } from "@/core/account";
import {
  EMAIL_ACCOUNT_PROVIDER_ID,
  GOOGLE_ACCOUNT_PROVIDER_ID,
} from "@/core/account/types";
import { useAuth, type AuthProvider } from "@/core/auth";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  RouteLoadingFallback,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import { EmailAccountAuthForm } from "./EmailAccountAuthForm";

type SyncStatusCardProps = Readonly<{
  onGoToBackupRestore: () => void;
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

const LazySyncStatusAdvancedPanel = lazy(() =>
  import("./SyncStatusAdvancedPanel").then((module) => ({
    default: module.SyncStatusAdvancedPanel,
  }))
);

function getInteractiveGoogleProvider(
  provider: AuthProvider
): InteractiveGoogleAuthProvider | null {
  if (
    provider.name !== GOOGLE_ACCOUNT_PROVIDER_ID ||
    typeof provider.login !== "function" ||
    typeof provider.logout !== "function"
  ) {
    return null;
  }

  const candidate = provider as Partial<InteractiveGoogleAuthProvider>;
  return typeof candidate.isConfigured === "function" && candidate.isConfigured()
    ? (provider as InteractiveGoogleAuthProvider)
    : null;
}

function getInteractiveEmailProvider(
  provider: AuthProvider
): InteractiveEmailAuthProvider | null {
  if (
    provider.name !== EMAIL_ACCOUNT_PROVIDER_ID ||
    typeof provider.login !== "function" ||
    typeof provider.logout !== "function" ||
    typeof provider.createAccount !== "function"
  ) {
    return null;
  }

  const candidate = provider as Partial<InteractiveEmailAuthProvider>;
  return typeof candidate.isConfigured === "function" && candidate.isConfigured()
    ? (provider as InteractiveEmailAuthProvider)
    : null;
}

function getLastSyncLabel(
  lastSyncedAt: string | undefined,
  t: ReturnType<typeof useI18n>["t"]
) {
  return lastSyncedAt ?? t("settings.syncLastSyncedNever");
}

function getUserFacingSyncDetail(
  detail: string | undefined,
  t: ReturnType<typeof useI18n>["t"]
) {
  if (!detail) {
    return detail;
  }

  const normalized = detail.toLowerCase();
  return normalized.includes("alios_sync_records") ||
    normalized.includes("schema cache")
    ? t("settings.syncServiceUnavailable")
    : detail;
}

export function SyncStatusCard({ onGoToBackupRestore }: SyncStatusCardProps) {
  const { t } = useI18n();
  const { boundary } = useAccountRuntime();
  const runtimeState = useAccountRuntimeState();
  const { provider } = useAuth();
  const [accountActionFeedback, setAccountActionFeedback] = useState<string | null>(
    null
  );
  const [accountActionPending, setAccountActionPending] = useState<
    "create-account" | "sign-in" | "sign-out" | null
  >(null);
  const [syncActionPending, setSyncActionPending] = useState(false);
  const [syncActionFeedback, setSyncActionFeedback] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const interactiveGoogleProvider = getInteractiveGoogleProvider(provider);
  const interactiveEmailProvider = getInteractiveEmailProvider(provider);
  const hasInteractiveProvider =
    interactiveEmailProvider !== null || interactiveGoogleProvider !== null;
  const canSignOut = hasInteractiveProvider && runtimeState.hasActiveAccount;
  const canEnableSync =
    runtimeState.hasActiveAccount &&
    runtimeState.syncStatus.enabled !== true &&
    !syncActionPending;
  const futureActionsDescriptionId = "account-sync-future-actions-description";
  const accountStateTone = runtimeState.localOnly
    ? "neutral"
    : runtimeState.hasActiveAccount
      ? "primary"
      : "warning";
  const syncHealthTone =
    runtimeState.syncStatus.issue === "conflict" ||
    runtimeState.syncStatus.issue === "connectivity"
      ? "warning"
      : runtimeState.syncStatus.enabled
        ? "primary"
        : "neutral";
  const syncHealthLabel =
    runtimeState.syncStatus.issue === "conflict"
      ? t("settings.syncHealthIssue")
      : runtimeState.syncStatus.issue === "connectivity"
        ? t("settings.syncStatusOffline")
        : runtimeState.syncStatus.enabled
          ? t("settings.syncStatusAvailable")
          : t("settings.syncStatusLocalOnly");

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

  const handleEnableSync = async () => {
    setSyncActionPending(true);
    setSyncActionFeedback(null);

    try {
      const status = await boundary.syncNow();
      setSyncActionFeedback(getUserFacingSyncDetail(status.detail, t) ?? null);
    } catch (error) {
      setSyncActionFeedback(
        error instanceof Error
          ? (getUserFacingSyncDetail(error.message, t) ??
              t("settings.accountEnableSyncError"))
          : t("settings.accountEnableSyncError")
      );
    } finally {
      setSyncActionPending(false);
    }
  };

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
              <StatusChip tone={accountStateTone}>
                {runtimeState.localOnly
                  ? t("settings.syncStatusLocalOnly")
                  : runtimeState.hasActiveAccount
                    ? t("settings.accountStatusSignedIn")
                    : t("settings.accountStatusSignedOut")}
              </StatusChip>
            </div>
            <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
              {runtimeState.identity?.email ??
                runtimeState.identity?.displayName ??
                t("settings.accountProviderLocalOnly")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.syncHealthLabel")}
            </p>
            <div className="mt-2">
              <StatusChip tone={syncHealthTone}>{syncHealthLabel}</StatusChip>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getUserFacingSyncDetail(runtimeState.syncStatus.detail, t)}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.syncLastSyncedLabel")}
            </p>
            <p className="mt-2 break-words text-sm font-medium">
              {getLastSyncLabel(runtimeState.syncStatus.lastSyncedAt, t)}
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
                  {runtimeState.hasActiveAccount
                    ? t("settings.accountSessionActionsTitle")
                    : t("settings.accountEmailActionsTitle")}
                </p>
                <p
                  id={futureActionsDescriptionId}
                  className="mt-1 text-sm leading-7 text-muted-foreground"
                >
                  {runtimeState.hasActiveAccount
                    ? t("settings.accountSessionActionsDescription")
                    : t("settings.accountEmailActionsDescription")}
                </p>
              </div>
            </div>
            <StatusChip tone={hasInteractiveProvider ? "primary" : "neutral"}>
              {runtimeState.hasActiveAccount
                ? t("settings.accountActionFutureEntry")
                : t("settings.accountEmailActionsStatus")}
            </StatusChip>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            role="group"
            aria-label={t(
              runtimeState.hasActiveAccount
                ? "settings.accountSessionActionsTitle"
                : "settings.accountEmailActionsTitle"
            )}
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
            {!runtimeState.hasActiveAccount && !interactiveEmailProvider ? (
              <>
                <Button
                  type="button"
                  className="min-h-11 w-full justify-start sm:w-auto"
                  disabled
                  aria-describedby={futureActionsDescriptionId}
                >
                  <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
                  {t("settings.accountCreateAction")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full justify-start sm:w-auto"
                  disabled
                  aria-describedby={futureActionsDescriptionId}
                >
                  <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
                  {t("settings.accountSignInAction")}
                </Button>
              </>
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
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full justify-start sm:w-auto"
                disabled
                aria-describedby={futureActionsDescriptionId}
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {runtimeState.hasActiveAccount
                  ? t("settings.accountEnableSyncAction")
                  : `${t("settings.accountEnableSyncAction")} - ${t(
                      "settings.accountActionRequiresSignIn"
                    )}`}
              </Button>
            )}
          </div>
          {accountActionFeedback ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {accountActionFeedback}
            </p>
          ) : null}
          {syncActionFeedback ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {syncActionFeedback}
            </p>
          ) : null}
        </SoftPanel>

        <CollapsibleSection
          id="account-sync-advanced-panel-loader"
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t("settings.advancedSyncDetailsTitle")}
          description={t("settings.advancedSyncDetailsDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          status={<StatusChip tone="neutral">{t("settings.advancedDeveloperStatus")}</StatusChip>}
          defaultOpen={false}
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
        >
          {advancedOpen ? (
            <Suspense fallback={<RouteLoadingFallback />}>
              <LazySyncStatusAdvancedPanel
                onGoToBackupRestore={onGoToBackupRestore}
              />
            </Suspense>
          ) : null}
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
}
