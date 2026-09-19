import {
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Attachment, AttachmentKind } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import {
  createAttachmentObjectUrl,
  revokeAttachmentObjectUrl,
  type AttachmentAccessDependencies,
} from "../attachmentAccess";
import {
  deleteAttachment,
  type AttachmentWorkflowDependencies,
} from "../attachmentWorkflow";

const ATTACHMENT_KIND_LABEL_KEYS: Record<AttachmentKind, TranslationKey> = {
  document: "attachments.kind.document",
  image: "attachments.kind.image",
  audio: "attachments.kind.audio",
  cover: "attachments.kind.cover",
  other: "attachments.kind.other",
};

export type AttachmentCardProps = {
  attachment?: Attachment | null;
  ownerLabel?: string;
  accessDependencies?: AttachmentAccessDependencies;
  workflowDependencies?: AttachmentWorkflowDependencies;
  onDeleted?: (attachmentId: string) => void;
};

export function AttachmentCard({
  attachment,
  ownerLabel,
  accessDependencies,
  workflowDependencies,
  onDeleted,
}: AttachmentCardProps) {
  const { language, t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [isAccessing, setIsAccessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<
    "access" | "delete" | null
  >(null);

  if (!attachment) {
    return (
      <Card
        className="border-dashed"
        aria-label={t("attachments.unavailableTitle")}
      >
        <CardContent className="flex items-start gap-3 p-4">
          <Paperclip className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">
              {t("attachments.unavailableTitle")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("attachments.unavailableDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openFile = async () => {
    if (!accessDependencies) {
      return;
    }

    setIsAccessing(true);
    setActionError(null);

    try {
      const objectUrl = await createAttachmentObjectUrl(
        attachment.id,
        accessDependencies
      );
      if (!objectUrl) {
        setActionError("access");
        return;
      }

      const openedWindow = window.open(
        objectUrl,
        "_blank",
        "noopener,noreferrer"
      );
      window.setTimeout(() => revokeAttachmentObjectUrl(objectUrl), 60_000);

      if (!openedWindow) {
        setActionError("access");
      }
    } catch {
      setActionError("access");
    } finally {
      setIsAccessing(false);
    }
  };

  const downloadFile = async () => {
    if (!accessDependencies) {
      return;
    }

    setIsAccessing(true);
    setActionError(null);

    try {
      const objectUrl = await createAttachmentObjectUrl(
        attachment.id,
        accessDependencies
      );
      if (!objectUrl) {
        setActionError("access");
        return;
      }

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.filename;
      link.click();
      window.setTimeout(() => revokeAttachmentObjectUrl(objectUrl), 1_000);
    } catch {
      setActionError("access");
    } finally {
      setIsAccessing(false);
    }
  };

  const removeAttachment = async () => {
    if (!workflowDependencies) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteAttachment(attachment.id, workflowDependencies);
      onDeleted?.(attachment.id);
    } catch {
      setActionError("delete");
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Card aria-label={attachment.filename}>
      <CardHeader className="gap-3 p-4 pb-2 sm:p-4 sm:pb-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-sm leading-6">
              {attachment.filename}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {t(ATTACHMENT_KIND_LABEL_KEYS[attachment.kind])}
              </Badge>
              <Badge variant="outline">{attachment.mimeType}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0 text-sm text-muted-foreground sm:p-4 sm:pt-0">
        <p>
          {t("attachments.size")}: {formatAttachmentSize(attachment.size, language)}
        </p>
        <p>
          {t("attachments.createdAt")}: {formatDate(attachment.createdAt)}
        </p>
        {ownerLabel ? (
          <p className="break-words">
            {t("attachments.owner")}: {ownerLabel}
          </p>
        ) : null}
      </CardContent>
      {accessDependencies || workflowDependencies ? (
        <CardFooter className="flex-wrap gap-2 border-t pt-4">
          {accessDependencies ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAccessing}
                onClick={() => void openFile()}
              >
                <ExternalLink className="me-2 h-4 w-4" aria-hidden="true" />
                {isAccessing ? t("attachments.working") : t("attachments.open")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isAccessing}
                onClick={() => void downloadFile()}
              >
                <Download className="me-2 h-4 w-4" aria-hidden="true" />
                {t("attachments.download")}
              </Button>
            </>
          ) : null}
          {workflowDependencies ? (
            confirmingDelete ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => void removeAttachment()}
                >
                  <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
                  {isDeleting
                    ? t("attachments.deleting")
                    : t("attachments.confirmDelete")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(false)}
                >
                  {t("common.cancel")}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
                {t("attachments.delete")}
              </Button>
            )
          ) : null}
          {actionError ? (
            <p className="basis-full text-sm text-destructive" role="alert">
              {actionError === "access"
                ? t("attachments.accessError")
                : t("attachments.deleteError")}
            </p>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function formatAttachmentSize(size: number, language: string): string {
  if (!Number.isFinite(size)) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const maximumFractionDigits = unitIndex === 0 ? 0 : 1;

  return `${new Intl.NumberFormat(language, {
    maximumFractionDigits,
  }).format(value)} ${units[unitIndex]}`;
}
