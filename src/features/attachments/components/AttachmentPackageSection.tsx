import { Download, FileArchive, Upload } from "lucide-react";
import { useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { AppError } from "@/core/errors";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";
import {
  AttachmentPackageConflictError,
  exportAttachmentPackage,
  importAttachmentPackage,
  type AttachmentPackageConflict,
} from "../attachmentPackage";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatConflict(
  conflict: AttachmentPackageConflict,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
): string {
  const values = {
    id: conflict.attachmentId ?? "unknown",
    storageKey: conflict.storageKey ?? "unknown",
  };

  switch (conflict.type) {
    case "metadata_id_conflict":
      return t("attachments.packageConflictMetadataId", {
        id: values.id,
        reason: conflict.reason,
      });
    case "storage_key_conflict":
      return t("attachments.packageConflictStorageKey", {
        storageKey: values.storageKey,
        reason: conflict.reason,
      });
    case "package_duplicate_metadata_id":
      return t("attachments.packageConflictDuplicateId", { id: values.id });
    case "package_missing_binary":
      return t("attachments.packageConflictMissingBinary", {
        id: values.id,
        storageKey: values.storageKey,
      });
    case "package_orphan_binary":
      return t("attachments.packageConflictOrphanBinary", {
        storageKey: values.storageKey,
      });
    case "invalid_binary_range":
      return t("attachments.packageConflictInvalidRange", {
        storageKey: values.storageKey,
      });
  }
}

export function formatAttachmentPackageError(
  error: unknown,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
): string {
  if (error instanceof AttachmentPackageConflictError) {
    const details = error.conflicts.map((conflict) => formatConflict(conflict, t));
    return [
      t("attachments.packageImportConflictSummary", {
        count: error.conflicts.length,
      }),
      ...details,
    ].join(" ");
  }

  if (error instanceof AppError) {
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : t("attachments.packageImportError");
}

export function AttachmentPackageSection() {
  const { attachments, attachmentBinary } = useStorageAdapter();
  const { t } = useI18n();
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exportFiles = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await exportAttachmentPackage({
        attachments,
        binaryStorage: attachmentBinary,
      });
      downloadBlob(result.manifestBlob, result.manifestFilename);
      downloadBlob(result.bundleBlob, result.bundleFilename);
      setSuccess(
        t("attachments.packageExportSuccess", {
          attachments: result.attachmentCount,
          binaries: result.binaryCount,
        })
      );
    } catch (exportError) {
      setError(formatAttachmentPackageError(exportError, t));
    } finally {
      setIsExporting(false);
    }
  };

  const importFiles = async () => {
    if (!manifestFile || !bundleFile) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await importAttachmentPackage(
        { manifestFile, bundleFile },
        {
          attachments,
          binaryStorage: attachmentBinary,
        }
      );
      setSuccess(
        t("attachments.packageImportSuccess", {
          attachments: result.importedMetadataCount,
          binaries: result.importedBinaryCount,
        })
      );
      setManifestFile(null);
      setBundleFile(null);
    } catch (importError) {
      setError(formatAttachmentPackageError(importError, t));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-primary" />
          {t("attachments.packageTitle")}
        </CardTitle>
        <CardDescription>
          {t("attachments.packageDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={isExporting || isImporting}
            onClick={() => void exportFiles()}
          >
            <Download className="me-2 h-4 w-4" />
            {isExporting
              ? t("attachments.packageExporting")
              : t("attachments.packageExport")}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            <span>{t("attachments.packageManifestLabel")}</span>
            <Input
              type="file"
              accept="application/json,.json"
              disabled={isExporting || isImporting}
              onChange={(event) =>
                setManifestFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>{t("attachments.packageBundleLabel")}</span>
            <Input
              type="file"
              accept="application/octet-stream,.bin"
              disabled={isExporting || isImporting}
              onChange={(event) =>
                setBundleFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!manifestFile || !bundleFile || isExporting || isImporting}
          onClick={() => void importFiles()}
        >
          <Upload className="me-2 h-4 w-4" />
          {isImporting
            ? t("attachments.packageImporting")
            : t("attachments.packageImport")}
        </Button>

        <p className="text-sm leading-6 text-muted-foreground">
          {t("attachments.packageImportWarning")}
        </p>
        {success ? (
          <p className="alios-status-success rounded-xl px-4 py-3 text-sm" role="status">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="alios-status-danger rounded-xl px-4 py-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
