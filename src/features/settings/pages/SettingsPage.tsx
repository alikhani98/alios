import { AlertCircle, Download, FileJson, ShieldCheck, Upload } from "lucide-react";
import { useRef } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";
import { useI18n } from "@/shared/i18n";
import { useBackupRestore } from "../hooks/useBackupRestore";

export function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    pendingBackup,
    pendingFilename,
    isExporting,
    isRestoring,
    error,
    success,
    exportBackup,
    selectBackup,
    cancelRestore,
    confirmRestore,
  } = useBackupRestore();

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="alios-page space-y-6">
      <div className="alios-page-header">
        <h2 className="alios-page-title">{t("settings.title")}</h2>
        <p className="alios-page-description">
          {t("settings.description")}
        </p>
      </div>

      {success ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{success}</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
          <CardDescription>{t("settings.languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3" role="group" aria-label={t("settings.language")}>
            <Button
              type="button"
              variant={language === "fa" ? "default" : "outline"}
              aria-pressed={language === "fa"}
              onClick={() => setLanguage("fa")}
            >
              {t("settings.persian")}
            </Button>
            <Button
              type="button"
              variant={language === "en" ? "default" : "outline"}
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {t("settings.english")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t("settings.backupExport")}
            </CardTitle>
            <CardDescription>
              {t("settings.backupExportDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              disabled={isExporting || isRestoring}
              onClick={() => void exportBackup()}
            >
              <Download className="me-2 h-4 w-4" />
              {isExporting ? t("settings.preparingBackup") : t("settings.backupExport")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {t("settings.backupRestore")}
            </CardTitle>
            <CardDescription>
              {t("settings.backupRestoreDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              disabled={isExporting || isRestoring}
              aria-label={t("settings.chooseBackup")}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void selectBackup(file);
                }
              }}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              {t("settings.restoreWarning")}
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingBackup ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-destructive" />
              {t("settings.confirmRestore")}
            </CardTitle>
            <CardDescription>
              {t("settings.confirmRestoreDescription", {
                filename: pendingFilename ?? "",
                date: new Date(pendingBackup.exportedAt).toLocaleString(language),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isRestoring}
              onClick={() => void confirmRestore()}
            >
              {isRestoring ? t("settings.restoring") : t("settings.restoreAction")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isRestoring}
              onClick={() => {
                cancelRestore();
                resetFileInput();
              }}
            >
              {t("common.cancel")}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
