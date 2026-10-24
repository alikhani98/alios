import { AppError } from "@/core/errors";
import type { Attachment } from "@/shared/types";

export type AttachmentPackageImportData = Readonly<{
  attachments: ReadonlyArray<Attachment>;
  binaries: ReadonlyArray<Readonly<{ storageKey: string; bytes: Uint8Array }>>;
}>;

export type AttachmentPackageImportResult = Readonly<{
  importedMetadataCount: number;
  importedBinaryCount: number;
  reusedMetadataCount: number;
  reusedBinaryCount: number;
}>;

export type AttachmentPackageConflictType =
  | "metadata_id_conflict"
  | "metadata_binary_size_mismatch"
  | "storage_key_conflict"
  | "package_duplicate_metadata_id"
  | "package_missing_binary"
  | "package_orphan_binary"
  | "invalid_binary_range";

export type AttachmentPackageConflict = Readonly<{
  type: AttachmentPackageConflictType;
  attachmentId?: string;
  storageKey?: string;
  reason: string;
}>;

export class AttachmentPackageConflictError extends AppError {
  readonly conflicts: ReadonlyArray<AttachmentPackageConflict>;

  constructor(conflicts: ReadonlyArray<AttachmentPackageConflict>) {
    super(
      `Attachment package import was rejected because ${conflicts.length} conflict(s) were found.`,
      { code: "ATTACHMENT_PACKAGE_CONFLICT" }
    );
    this.name = "AttachmentPackageConflictError";
    this.conflicts = conflicts;
  }
}

export function collectAttachmentPackageConflicts(
  incoming: ReadonlyArray<Attachment>,
  binaries: AttachmentPackageImportData["binaries"],
  existingById: ReadonlyMap<string, Attachment>
): AttachmentPackageConflict[] {
  const conflicts: AttachmentPackageConflict[] = [];
  const binaryKeys = new Set<string>();
  const binaryByteLengths = new Map(
    binaries.map((binary) => [binary.storageKey, binary.bytes.byteLength])
  );
  for (const binary of binaries) {
    if (binaryKeys.has(binary.storageKey)) {
      conflicts.push({
        type: "storage_key_conflict",
        storageKey: binary.storageKey,
        reason: "The package manifest lists the same storageKey more than once.",
      });
    }
    binaryKeys.add(binary.storageKey);
    if (!incoming.some((attachment) => attachment.storageKey === binary.storageKey)) {
      conflicts.push({
        type: "package_orphan_binary",
        storageKey: binary.storageKey,
        reason: "The package has a binary entry without attachment metadata.",
      });
    }
  }
  const ids = new Set<string>();
  for (const attachment of incoming) {
    if (ids.has(attachment.id)) {
      conflicts.push({
        type: "package_duplicate_metadata_id",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: "The package lists the same metadata ID more than once.",
      });
    }
    ids.add(attachment.id);
    const existing = existingById.get(attachment.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(attachment)) {
      conflicts.push({
        type: "metadata_id_conflict",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: describeMetadataDifference(existing, attachment),
      });
    }
    if (!binaryKeys.has(attachment.storageKey)) {
      conflicts.push({
        type: "package_missing_binary",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: "No binary entry exists for this metadata record.",
      });
    }
    const actualSize = binaryByteLengths.get(attachment.storageKey);
    if (actualSize !== undefined && attachment.size !== actualSize) {
      conflicts.push({
        type: "metadata_binary_size_mismatch",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: `The metadata declares ${attachment.size} bytes, but its binary contains ${actualSize} bytes.`,
      });
    }
  }
  return conflicts;
}

function describeMetadataDifference(left: Attachment, right: Attachment): string {
  if (left.storageKey !== right.storageKey) {
    return `The existing metadata points to ${left.storageKey}, but the package points to ${right.storageKey}.`;
  }
  if (left.filename !== right.filename) return "The existing metadata has a different filename.";
  if (left.ownerType !== right.ownerType || left.ownerId !== right.ownerId) {
    return "The existing metadata has a different owner.";
  }
  return "The existing metadata differs from the package record.";
}
