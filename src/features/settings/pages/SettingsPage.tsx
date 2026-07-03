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
import { useBackupRestore } from "../hooks/useBackupRestore";

export function SettingsPage() {
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
        <h2 className="alios-page-title">Settings</h2>
        <p className="alios-page-description">
          Protect your local AliOS data with a manual JSON backup.
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export backup
            </CardTitle>
            <CardDescription>
              Download projects, tasks, daily check-ins, journal entries,
              knowledge items, and settings as one versioned JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              disabled={isExporting || isRestoring}
              onClick={() => void exportBackup()}
            >
              <Download className="me-2 h-4 w-4" />
              {isExporting ? "Preparing backup..." : "Export backup"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Restore backup
            </CardTitle>
            <CardDescription>
              Select an AliOS version 1 JSON backup. The file is validated
              before any local data is changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              disabled={isExporting || isRestoring}
              aria-label="Choose AliOS backup file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void selectBackup(file);
                }
              }}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Restore replaces every supported local table. Automatic and cloud
              backups are not enabled, so keep exported files somewhere safe.
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingBackup ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-destructive" />
              Confirm restore
            </CardTitle>
            <CardDescription>
              {pendingFilename} is valid and was exported on{" "}
              {new Date(pendingBackup.exportedAt).toLocaleString()}. Continuing
              will replace all current AliOS data with this backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isRestoring}
              onClick={() => void confirmRestore()}
            >
              {isRestoring ? "Restoring..." : "Replace data and restore"}
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
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
