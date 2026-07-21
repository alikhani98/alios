import { CloudOff, LaptopMinimal, ShieldCheck } from "lucide-react";

import { OPTIONAL_SYNC_PROVIDER_ID, localOnlySyncProvider } from "@/core/sync";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";

type SyncStatusCardProps = Readonly<{
  onGoToBackupRestore: () => void;
}>;

export function SyncStatusCard({ onGoToBackupRestore }: SyncStatusCardProps) {
  const { t } = useI18n();
  const provider = localOnlySyncProvider;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-primary" />
          {t("settings.syncTitle")}
        </CardTitle>
        <CardDescription>{t("settings.syncDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.syncLocalOnly")}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {provider.name === "local-only" ? t("settings.syncStatusLocalOnly") : provider.name}
          </Badge>
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
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
        </div>
        <div className="rounded-xl border border-dashed bg-background/60 p-4 text-sm">
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
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{t("settings.syncFutureNote")}</p>
      </CardContent>
    </Card>
  );
}
