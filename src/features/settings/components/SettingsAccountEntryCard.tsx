import { ArrowUpRight, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { useAccountRuntime, useAccountRuntimeState } from "@/core/account";
import {
  EMAIL_ACCOUNT_PROVIDER_ID,
  GOOGLE_ACCOUNT_PROVIDER_ID,
} from "@/core/account/types";
import { useAuth, type AuthProvider } from "@/core/auth";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatusChip,
} from "@/shared/ui";

import { EmailAccountAuthForm } from "./EmailAccountAuthForm";

type SettingsAccountEntryCardProps = Readonly<{
  expanded: boolean;
  onOpenDetails: () => void;
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

function getProviderLabelKey(providerId: string) {
  if (providerId === EMAIL_ACCOUNT_PROVIDER_ID) {
    return "settings.accountProviderEmail" as const;
  }

  if (providerId === GOOGLE_ACCOUNT_PROVIDER_ID) {
    return "settings.accountProviderGoogle" as const;
  }

  return "settings.accountProviderLocalOnly" as const;
}

export function SettingsAccountEntryCard({
  expanded,
  onOpenDetails,
}: SettingsAccountEntryCardProps) {
  const { t } = useI18n();
  const { boundary } = useAccountRuntime();
  const runtimeState = useAccountRuntimeState();
  const { provider } = useAuth();
  const [accountActionPending, setAccountActionPending] = useState<
    "create-account" | "sign-in" | "sign-out" | null
  >(null);
  const [syncActionPending, setSyncActionPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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
  const accountIdentityLabel =
    runtimeState.identity?.displayName ??
    runtimeState.identity?.email ??
    t("settings.accountDetailsSignedOut");
  const connectedEmail =
    runtimeState.hasActiveAccount && runtimeState.identity?.email
      ? runtimeState.identity.email
      : null;

  const handleGoogleSignIn = async () => {
    if (!interactiveGoogleProvider) {
      return;
    }

    setAccountActionPending("sign-in");
    setFeedback(null);

    try {
      await interactiveGoogleProvider.login({});
      setFeedback(t("settings.accountGoogleSignInSuccess"));
    } catch (error) {
      setFeedback(
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
    setFeedback(null);

    try {
      const result = await interactiveEmailProvider.createAccount(input);
      setFeedback(
        result.requiresVerification
          ? t("settings.accountEmailVerificationRequired")
          : t("settings.accountEmailCreateSuccess")
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : t("settings.accountEmailCreateError")
      );
    } finally {
      setAccountActionPending(null);
    }
  };

  const handleEmailSignIn = async (input: { email: string; password: string }) => {
    if (!interactiveEmailProvider) {
      return;
    }

    setAccountActionPending("sign-in");
    setFeedback(null);

    try {
      await interactiveEmailProvider.login(input);
      setFeedback(t("settings.accountEmailSignInSuccess"));
    } catch (error) {
      setFeedback(
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
    setFeedback(null);

    try {
      await interactiveProvider.logout();
      setFeedback(
        interactiveEmailProvider
          ? t("settings.accountEmailSignOutSuccess")
          : t("settings.accountGoogleSignOutSuccess")
      );
    } catch (error) {
      setFeedback(
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
    setFeedback(null);

    try {
      const status = await boundary.syncNow();
      setFeedback(status.detail);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : t("settings.accountEnableSyncError")
      );
    } finally {
      setSyncActionPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("settings.accountSyncTitle")}
            </CardTitle>
            <CardDescription>{t("settings.accountSyncDescription")}</CardDescription>
          </div>
          <StatusChip
            tone={
              runtimeState.localOnly
                ? "neutral"
                : runtimeState.hasActiveAccount
                  ? "primary"
                  : "warning"
            }
          >
            {runtimeState.localOnly
              ? t("settings.syncStatusLocalOnly")
              : runtimeState.hasActiveAccount
                ? t("settings.accountStatusSignedIn")
                : t("settings.accountStatusSignedOut")}
          </StatusChip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="alios-icon-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">
                {runtimeState.hasActiveAccount
                  ? accountIdentityLabel
                  : interactiveEmailProvider
                    ? t("settings.accountEmailTitle")
                    : t("settings.accountSignInPreparationTitle")}
              </p>
              {connectedEmail ? (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {connectedEmail}
                </p>
              ) : null}
              <p className="text-sm leading-6 text-muted-foreground">
                {runtimeState.hasActiveAccount
                  ? t("settings.accountSessionActionsDescription")
                  : interactiveEmailProvider
                    ? t("settings.accountEmailDescription")
                    : t("settings.accountSignInPreparationDescription")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {t(getProviderLabelKey(runtimeState.accountProviderId))}
            </Badge>
            <Badge variant="secondary">
              {runtimeState.hasActiveAccount
                ? runtimeState.syncStatus.enabled
                  ? t("settings.syncStatusAvailable")
                  : t("settings.accountEnableSyncAction")
                : t("settings.accountStatusSignedOut")}
            </Badge>
          </div>
        </div>

        {!runtimeState.hasActiveAccount && interactiveEmailProvider ? (
          <EmailAccountAuthForm
            compact
            busyAction={accountActionPending}
            feedback={feedback}
            onCreateAccount={handleEmailCreateAccount}
            onSignIn={handleEmailSignIn}
          />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {!runtimeState.hasActiveAccount && interactiveGoogleProvider ? (
            <Button
              type="button"
              className="min-h-11 w-full justify-start sm:w-auto"
              onClick={() => {
                void handleGoogleSignIn();
              }}
              disabled={accountActionPending !== null}
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {accountActionPending === "sign-in"
                ? t("settings.accountGoogleSigningIn")
                : t("settings.accountGoogleSignInAction")}
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
            >
              <RefreshCw
                className={`me-2 h-4 w-4 ${syncActionPending ? "animate-spin" : ""}`}
              />
              {syncActionPending
                ? t("settings.accountEnableSyncPending")
                : t("settings.accountEnableSyncAction")}
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
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {accountActionPending === "sign-out"
                ? interactiveEmailProvider
                  ? t("settings.accountEmailSigningOut")
                  : t("settings.accountGoogleSigningOut")
                : t("settings.accountSignOutAction")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-start sm:w-auto"
            onClick={onOpenDetails}
            aria-expanded={expanded}
          >
            <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
            {t("settings.accountOpenDetailsAction")}
          </Button>
        </div>

        {feedback && !interactiveEmailProvider ? (
          <div
            role="status"
            className="rounded-xl border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground"
          >
            {feedback}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
