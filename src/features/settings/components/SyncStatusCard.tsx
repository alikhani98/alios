import {
  ArrowUpRight,
  CloudOff,
  LaptopMinimal,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { OPTIONAL_SYNC_PROVIDER_ID, localOnlySyncProvider } from "@/core/sync";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

type SyncStatusCardProps = Readonly<{
  onGoToBackupRestore: () => void;
}>;

export function SyncStatusCard({ onGoToBackupRestore }: SyncStatusCardProps) {
  const { t } = useI18n();
  const provider = localOnlySyncProvider;
  const futureActionsDescriptionId = "account-sync-future-actions-description";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-primary" />
          {t("settings.accountSyncTitle")}
        </CardTitle>
        <CardDescription>{t("settings.accountSyncDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountCurrentStateLabel")}
            </p>
            <div className="mt-2">
              <StatusChip tone="neutral">
                {t("settings.syncStatusLocalOnly")}
              </StatusChip>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("settings.accountCurrentStateDescription")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountPrivacyLabel")}
            </p>
            <p className="mt-2 text-sm font-medium">
              {t("settings.accountPrivacyValue")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.accountPrivacyDescription")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountFutureSyncLabel")}
            </p>
            <p className="mt-2 text-sm font-medium">
              {t("settings.accountFutureSyncValue")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.accountFutureSyncDescription")}
            </p>
          </SoftPanel>
        </div>

        <SoftPanel className="flex flex-col gap-3 alios-surface-muted sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("settings.accountLocalOnlyTitle")}</p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("settings.syncLocalOnly")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="w-fit shrink-0">
              {provider.name === "local-only"
                ? t("settings.syncStatusLocalOnly")
                : provider.name}
            </Badge>
            <Badge variant="secondary" className="w-fit shrink-0">
              {t("settings.noOnlineAccount")}
            </Badge>
          </div>
        </SoftPanel>

        <SoftPanel className="space-y-4">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {t("settings.accountFutureActionsTitle")}
              </p>
              <p
                id={futureActionsDescriptionId}
                className="mt-1 text-sm leading-7 text-muted-foreground"
              >
                {t("settings.accountFutureActionsDescription")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled
              aria-describedby={futureActionsDescriptionId}
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {t("settings.accountCreateAction")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled
              aria-describedby={futureActionsDescriptionId}
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {t("settings.accountSignInAction")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              disabled
              aria-describedby={futureActionsDescriptionId}
            >
              <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
              {t("settings.accountEnableSyncAction")}
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.accountFutureActionsNote")}
          </p>
        </SoftPanel>

        <SoftPanel className="alios-surface-muted">
          <div className="flex items-start gap-2">
            <LaptopMinimal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("settings.deviceTransferTitle")}</p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {t("settings.deviceTransferDescription")}
              </p>
            </div>
          </div>
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
        </SoftPanel>
        <SoftPanel className="border-dashed bg-background/60 text-sm">
          <p className="font-medium">{t("settings.syncConsentTitle")}</p>
          <p className="mt-2 leading-7 text-muted-foreground">{t("settings.syncConsentDescription")}</p>
          <ul className="mt-3 list-disc space-y-1 ps-5 leading-6 text-muted-foreground">
            <li>{t("settings.syncConsentAccount")}</li>
            <li>{t("settings.syncConsentExplicit")}</li>
            <li>{t("settings.syncConsentScope")}</li>
            <li>{t("settings.syncConsentLocal")}</li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t("settings.syncPlannedProvider", { provider: OPTIONAL_SYNC_PROVIDER_ID })}
          </p>
        </SoftPanel>
        <p className="text-xs leading-5 text-muted-foreground">{t("settings.syncFutureNote")}</p>
      </CardContent>
    </Card>
  );
}
