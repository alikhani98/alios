import { describe, expect, it } from "vitest";

import { AttachmentPackageConflictError } from "../../attachmentPackage";
import { formatAttachmentPackageError } from "../AttachmentPackageSection";

const translate = (
  key: string,
  values?: Record<string, string | number>
): string => `${key}:${JSON.stringify(values ?? {})}`;

describe("AttachmentPackageSection error reporting", () => {
  it("reports each package conflict with its record or storage key", () => {
    const error = new AttachmentPackageConflictError([
      {
        type: "metadata_id_conflict",
        attachmentId: "attachment-1",
        storageKey: "attachments/one",
        reason: "The owner differs.",
      },
      {
        type: "storage_key_conflict",
        storageKey: "attachments/shared",
        reason: "The binary differs.",
      },
    ]);

    const message = formatAttachmentPackageError(error, translate);

    expect(message).toContain("attachments.packageImportConflictSummary");
    expect(message).toContain("attachments.packageConflictMetadataId");
    expect(message).toContain("attachment-1");
    expect(message).toContain("attachments.packageConflictStorageKey");
    expect(message).toContain("attachments/shared");
  });

  it("shows the attachment ID and declared-versus-actual size for size conflicts", () => {
    const reason = "The metadata declares 4 bytes, but its binary contains 5 bytes.";
    const message = formatAttachmentPackageError(new AttachmentPackageConflictError([{
      type: "metadata_binary_size_mismatch",
      attachmentId: "size-conflict", storageKey: "attachments/shared", reason,
    }]), translate);
    expect(message).toContain("attachments.packageImportConflictSummary");
    expect(message).toContain("size-conflict");
    expect(message).toContain(reason);
  });
});
