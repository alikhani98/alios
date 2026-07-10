import { ClipboardList, Download, FileJson, ShieldCheck } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

type RecoveryModeSectionProps = {
  enabled: boolean;
  onToggle: () => void;
  onGoToBackupRestore: () => void;
  onGoToExportCenter: () => void;
  onGoToLocalErrorLog: () => void;
};

export function RecoveryModeSection({
  enabled,
  onToggle,
  onGoToBackupRestore,
  onGoToExportCenter,
  onGoToLocalErrorLog,
}: RecoveryModeSectionProps) {
  const { t } = useI18n();

  return (
    <Card id="settings-recovery-mode">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t("recovery.title")}
        </CardTitle>
        <CardDescription>{t("recovery.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {enabled ? t("recovery.active") : t("recovery.statusInactive")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("recovery.localDataSafe")}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("recovery.sectionHint")}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {enabled ? t("recovery.statusActive") : t("recovery.statusInactive")}
            </Badge>
          </div>
        </div>

        <Button
          type="button"
          variant={enabled ? "default" : "outline"}
          className="w-full sm:w-auto"
          aria-pressed={enabled}
          onClick={onToggle}
        >
          {enabled ? t("recovery.disable") : t("recovery.enable")}
        </Button>

        {enabled ? (
          <div className="space-y-3 rounded-xl border bg-background/80 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("recovery.actions")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={onGoToBackupRestore}
              >
                <FileJson className="me-2 h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{t("recovery.backupRestore")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={onGoToExportCenter}
              >
                <Download className="me-2 h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{t("recovery.exportCenter")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={onGoToLocalErrorLog}
              >
                <ClipboardList className="me-2 h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{t("recovery.localErrorLog")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-background/80 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("recovery.sectionHint")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("recovery.actions")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
