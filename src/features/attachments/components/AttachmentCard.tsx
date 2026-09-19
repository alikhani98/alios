import { FileText, Paperclip } from "lucide-react";

import { useDateFormatter } from "@/shared/date";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Attachment, AttachmentKind } from "@/shared/types";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

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
};

export function AttachmentCard({ attachment, ownerLabel }: AttachmentCardProps) {
  const { language, t } = useI18n();
  const { formatDate } = useDateFormatter();

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
