import { Download } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { useI18n } from "@/shared/i18n";
import { useExportCenter } from "../hooks/useExportCenter";

type ExportButtonProps = {
  disabled: boolean;
  isActive: boolean;
  label: string;
  onClick: () => void;
};

function ExportButton({
  disabled,
  isActive,
  label,
  onClick,
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      className="w-full justify-start"
      disabled={disabled}
      aria-pressed={isActive}
      onClick={onClick}
    >
      <Download className="me-2 h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Button>
  );
}

type ExportCenterSectionProps = {
  id?: string;
};

export function ExportCenterSection({ id }: ExportCenterSectionProps) {
  const { t } = useI18n();
  const exportCenter = useExportCenter();

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          {t("settings.exportCenterTitle")}
        </CardTitle>
        <CardDescription>{t("settings.exportCenterDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportButton
            disabled={exportCenter.isExporting}
            isActive={exportCenter.activeExport === "finance"}
            label={
              exportCenter.activeExport === "finance"
                ? t("settings.exportingFinanceCsv")
                : t("settings.exportFinanceCsv")
            }
            onClick={() => void exportCenter.exportFinanceCsv()}
          />
          <ExportButton
            disabled={exportCenter.isExporting}
            isActive={exportCenter.activeExport === "decisionLog"}
            label={
              exportCenter.activeExport === "decisionLog"
                ? t("settings.exportingDecisionLogMarkdown")
                : t("settings.exportDecisionLogMarkdown")
            }
            onClick={() => void exportCenter.exportDecisionLogMarkdown()}
          />
          <ExportButton
            disabled={exportCenter.isExporting}
            isActive={exportCenter.activeExport === "journal"}
            label={
              exportCenter.activeExport === "journal"
                ? t("settings.exportingJournalMarkdown")
                : t("settings.exportJournalMarkdown")
            }
            onClick={() => void exportCenter.exportJournalMarkdown()}
          />
          <ExportButton
            disabled={exportCenter.isExporting}
            isActive={exportCenter.activeExport === "knowledge"}
            label={
              exportCenter.activeExport === "knowledge"
                ? t("settings.exportingKnowledgeMarkdown")
                : t("settings.exportKnowledgeMarkdown")
            }
            onClick={() => void exportCenter.exportKnowledgeMarkdown()}
          />
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm leading-7 text-muted-foreground">
            {t("settings.exportCenterNote")}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {t("settings.exportEmptyNote")}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.exportCenterBackupNote")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{t("settings.exportFinanceCsv")}</Badge>
            <Badge variant="secondary">
              {t("settings.exportDecisionLogMarkdown")}
            </Badge>
            <Badge variant="secondary">{t("settings.exportJournalMarkdown")}</Badge>
            <Badge variant="secondary">
              {t("settings.exportKnowledgeMarkdown")}
            </Badge>
          </div>
        </div>

        {exportCenter.success ? (
          <div
            role="status"
            className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
          >
            {exportCenter.success}
          </div>
        ) : null}

        {exportCenter.error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {exportCenter.error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

