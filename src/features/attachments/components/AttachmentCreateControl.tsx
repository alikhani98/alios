import { Paperclip } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";

import type { Attachment, AttachmentOwnerType } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input } from "@/shared/ui";
import {
  createAttachmentForFile,
  type AttachmentWorkflowDependencies,
} from "../attachmentWorkflow";

export type AttachmentCreateControlProps = {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  dependencies: AttachmentWorkflowDependencies;
  onCreated?: (attachment: Attachment) => void;
};

export function AttachmentCreateControl({
  ownerType,
  ownerId,
  dependencies,
  onCreated,
}: AttachmentCreateControlProps) {
  const { t } = useI18n();
  const inputId = useId();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsSaving(true);
    setStatus("idle");

    try {
      const attachment = await createAttachmentForFile(
        { ownerType, ownerId, file },
        dependencies
      );
      onCreated?.(attachment);
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild type="button" variant="outline" disabled={isSaving}>
        <label htmlFor={inputId} className="cursor-pointer">
          <Paperclip className="me-2 h-4 w-4" aria-hidden="true" />
          {isSaving ? t("attachments.adding") : t("attachments.add")}
        </label>
      </Button>
      <Input
        id={inputId}
        type="file"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
        disabled={isSaving}
        aria-label={t("attachments.fileInputLabel")}
      />
      {status === "success" ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {t("attachments.added")}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {t("attachments.addError")}
        </p>
      ) : null}
    </div>
  );
}
