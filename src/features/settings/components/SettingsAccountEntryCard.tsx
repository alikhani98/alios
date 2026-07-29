import { ArrowUpRight, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { useAccountRuntime, useAccountRuntimeState } from "@/core/account";
import { GOOGLE_ACCOUNT_PROVIDER_ID } from "@/core/account/types";
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

type SettingsAccountEntryCardProps = Readonly<{
  expanded: boolean;
  onOpenDetails: () => void;
}>;

type InteractiveGoogleAuthProvider = AuthProvider &
  Readonly<{
    isConfigured: () => boolean;
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

export function SettingsAccountEntryCard({
  expanded,
  onOpenDetails,
}: SettingsAccountEntryCardProps) {
  const { t } = useI18n();
  const { boundary } = useAccountRuntime();
  const runtimeState = useAccountRuntimeState();
  const { provider } = useAuth();
  const [accountActionPending, setAccountActionPending] = useState<
    "sign-in" | "sign-out" | null
  >(null);
  const [syncActionPending, setSyncActionPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const interactiveGoogleProvider = getInteractiveGoogleProvider(provider);
  const canSignIn =
    interactiveGoogleProvider !== null && !runtimeState.hasActiveAccount;
  const canSignOut =
    interactiveGoogleProvider !== null && runtimeState.hasActiveAccount;
  const canEnableSync =
    runtimeState.hasActiveAccount &&
    runtimeState.syncStatus.enabled !== true &&
    !syncActionPending;
  const accountIdentityLabel =
    runtimeState.identity?.displayName ??
    runtimeState.identity?.email ??
    t("settings.accountDetailsSignedOut");

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

  const handleGoogleSignOut = async () => {
    if (!interactiveGoogleProvider) {
      return;
    }

    setAccountActionPending("sign-out");
    setFeedback(null);

    try {
      await interactiveGoogleProvider.logout();
      setFeedback(t("settings.accountGoogleSignOutSuccess"));
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
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
                  : t("settings.accountSignInPreparationTitle")}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {runtimeState.hasActiveAccount
                  ? t("settings.accountSessionActionsDescription")
                  : t("settings.accountSignInPreparationDescription")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{t("settings.accountProviderGoogle")}</Badge>
            <Badge variant="secondary">
              {runtimeState.hasActiveAccount
                ? runtimeState.syncStatus.enabled
                  ? t("settings.syncStatusAvailable")
                  : t("settings.accountEnableSyncAction")
                : t("settings.accountStatusSignedOut")}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canSignIn ? (
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
                void handleGoogleSignOut();
              }}
              disabled={accountActionPending !== null}
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {accountActionPending === "sign-out"
                ? t("settings.accountGoogleSigningOut")
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

        {feedback ? (
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
