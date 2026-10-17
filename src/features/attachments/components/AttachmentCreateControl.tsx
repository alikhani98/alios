import { Paperclip } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

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
  onStatusChange?: (status: "saving" | "success" | "error") => void;
  showStatus?: boolean;
};

export function AttachmentCreateControl({
  ownerType,
  ownerId,
  dependencies,
  onCreated,
  onStatusChange,
  showStatus = true,
}: AttachmentCreateControlProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || savingRef.current) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setStatus("idle");
    onStatusChange?.("saving");

    try {
      const attachment = await createAttachmentForFile(
        { ownerType, ownerId, file },
        dependencies
      );
      onCreated?.(attachment);
      setStatus("success");
      onStatusChange?.("success");
    } catch {
      setStatus("error");
      onStatusChange?.("error");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isSaving}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="me-2 h-4 w-4" aria-hidden="true" />
        {isSaving ? t("attachments.adding") : t("attachments.add")}
      </Button>
      <Input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void handleFileChange(event)}
        disabled={isSaving}
        aria-label={t("attachments.fileInputLabel")}
      />
      {showStatus && status === "success" ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
          {t("attachments.added")}
        </p>
      ) : null}
      {showStatus && status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {t("attachments.addError")}
        </p>
      ) : null}
    </div>
  );
}
