import { AppError, StorageError, ValidationError } from "@/core/errors";
import type { AttachmentRepository } from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import {
  attachmentSchema,
  type Attachment,
} from "@/shared/types";
import { isoDateTimeSchema } from "@/shared/utils";
import { z } from "zod";

export const ATTACHMENT_PACKAGE_APP = "AliOS Attachment Package" as const;
export const ATTACHMENT_PACKAGE_VERSION = 1 as const;

const binaryManifestEntrySchema = z.object({
  storageKey: z.string().trim().min(1),
  offset: z.number().int().nonnegative(),
  length: z.number().int().nonnegative(),
});

export const attachmentPackageManifestSchema = z.object({
  app: z.literal(ATTACHMENT_PACKAGE_APP),
  packageVersion: z.literal(ATTACHMENT_PACKAGE_VERSION),
  exportedAt: isoDateTimeSchema,
  bundleFilename: z.string().trim().min(1),
  attachments: z.array(attachmentSchema),
  binaries: z.array(binaryManifestEntrySchema),
});

export type AttachmentPackageManifest = z.infer<
  typeof attachmentPackageManifestSchema
>;

export type AttachmentPackageDependencies = {
  attachments: AttachmentRepository & {
    restore?(attachment: Attachment): Promise<void>;
  };
  binaryStorage: BinaryStorage;
};

export type AttachmentPackageConflictType =
  | "metadata_id_conflict"
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

export type AttachmentPackageExport = Readonly<{
  manifest: AttachmentPackageManifest;
  manifestBlob: Blob;
  bundleBlob: Blob;
  manifestFilename: string;
  bundleFilename: string;
  attachmentCount: number;
  binaryCount: number;
}>;

export type AttachmentPackageImportInput = Readonly<{
  manifestFile: File | Blob;
  bundleFile: File | Blob;
}>;

export type AttachmentPackageImportResult = Readonly<{
  importedMetadataCount: number;
  importedBinaryCount: number;
  reusedMetadataCount: number;
  reusedBinaryCount: number;
}>;

type PreparedBinary = Readonly<{
  storageKey: string;
  blob: Blob;
  bytes: Uint8Array;
}>;

export async function exportAttachmentPackage(
  dependencies: AttachmentPackageDependencies,
  referenceDate = new Date()
): Promise<AttachmentPackageExport> {
  const attachments = await dependencies.attachments.listAll();
  const uniqueStorageKeys = [...new Set(attachments.map((item) => item.storageKey))];
  const binaries = await Promise.all(
    uniqueStorageKeys.map(async (storageKey): Promise<PreparedBinary> => {
      const blob = await dependencies.binaryStorage.retrieve(storageKey);
      if (!blob) {
        const related = attachments.filter(
          (attachment) => attachment.storageKey === storageKey
        );
        throw new AttachmentPackageConflictError([
          ...related.map((attachment) => ({
            type: "package_missing_binary" as const,
            attachmentId: attachment.id,
            storageKey,
            reason: `No binary content exists for ${attachment.filename}.`,
          })),
        ]);
      }

      return {
        storageKey,
        blob,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      };
    })
  ).catch((error: unknown) => {
    if (error instanceof AttachmentPackageConflictError) {
      throw error;
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new StorageError("Attachment package binaries could not be read.", {
      cause: error,
    });
  });

  const totalBytes = binaries.reduce((total, binary) => total + binary.bytes.byteLength, 0);
  const bundleBytes = new Uint8Array(totalBytes);
  let offset = 0;
  const binaryEntries = binaries.map((binary) => {
    const entry = {
      storageKey: binary.storageKey,
      offset,
      length: binary.bytes.byteLength,
    };
    bundleBytes.set(binary.bytes, offset);
    offset += binary.bytes.byteLength;
    return entry;
  });

  const stamp = referenceDate
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(/:/g, "-");
  const bundleFilename = `alios-attachments-${stamp}.bin`;
  const manifest: AttachmentPackageManifest = {
    app: ATTACHMENT_PACKAGE_APP,
    packageVersion: ATTACHMENT_PACKAGE_VERSION,
    exportedAt: referenceDate.toISOString(),
    bundleFilename,
    attachments,
    binaries: binaryEntries,
  };

  return {
    manifest,
    manifestBlob: new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    }),
    bundleBlob: new Blob([bundleBytes], {
      type: "application/octet-stream",
    }),
    manifestFilename: `alios-attachments-${stamp}.json`,
    bundleFilename,
    attachmentCount: attachments.length,
    binaryCount: binaries.length,
  };
}

export async function importAttachmentPackage(
  input: AttachmentPackageImportInput,
  dependencies: AttachmentPackageDependencies
): Promise<AttachmentPackageImportResult> {
  const manifest = await parseAttachmentPackageManifest(input.manifestFile);
  const bundleBytes = new Uint8Array(await input.bundleFile.arrayBuffer());
  const prepared = preparePackageBinaries(manifest, bundleBytes);
  const existingMetadata = await dependencies.attachments.listAll();
  const existingById = new Map(existingMetadata.map((item) => [item.id, item]));

  const conflicts = collectPackageConflicts(
    manifest.attachments,
    prepared,
    existingById
  );
  const existingBinaries = new Map<string, Blob | undefined>();
  for (const binary of prepared) {
    existingBinaries.set(
      binary.storageKey,
      await dependencies.binaryStorage.retrieve(binary.storageKey)
    );
  }

  for (const binary of prepared) {
    const existing = existingBinaries.get(binary.storageKey);
    if (existing && !(await blobsEqual(existing, binary.blob))) {
      conflicts.push({
        type: "storage_key_conflict",
        storageKey: binary.storageKey,
        reason:
          "An existing binary uses this storageKey but its content differs from the package.",
      });
    }
  }

  if (conflicts.length > 0) {
    throw new AttachmentPackageConflictError(conflicts);
  }

  if (!dependencies.attachments.restore) {
    throw new StorageError(
      "Attachment metadata restore is unavailable in this storage adapter."
    );
  }

  const metadataToCreate = manifest.attachments.filter(
    (attachment) => !existingById.has(attachment.id)
  );
  const binariesToSave = prepared.filter(
    (binary) => !existingBinaries.get(binary.storageKey)
  );
  const savedBinaryKeys: string[] = [];
  const createdMetadataIds: string[] = [];

  try {
    for (const binary of binariesToSave) {
      await dependencies.binaryStorage.save(binary.storageKey, binary.blob);
      savedBinaryKeys.push(binary.storageKey);
    }

    for (const attachment of metadataToCreate) {
      await dependencies.attachments.restore(attachment);
      createdMetadataIds.push(attachment.id);
    }
  } catch (error) {
    await Promise.all(
      createdMetadataIds.map((id) => dependencies.attachments.delete(id))
    );
    await Promise.all(
      savedBinaryKeys.map((storageKey) =>
        dependencies.binaryStorage.delete(storageKey)
      )
    );
    throw error;
  }

  return {
    importedMetadataCount: metadataToCreate.length,
    importedBinaryCount: binariesToSave.length,
    reusedMetadataCount: manifest.attachments.length - metadataToCreate.length,
    reusedBinaryCount: prepared.length - binariesToSave.length,
  };
}

export async function parseAttachmentPackageManifest(
  file: File | Blob
): Promise<AttachmentPackageManifest> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch (error) {
    throw new ValidationError("The attachment package manifest is not valid JSON.", {
      cause: error,
    });
  }

  const result = attachmentPackageManifestSchema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError("The attachment package manifest is invalid.", {
      cause: result.error,
    });
  }

  return result.data;
}

function preparePackageBinaries(
  manifest: AttachmentPackageManifest,
  bundleBytes: Uint8Array
): PreparedBinary[] {
  const conflicts: AttachmentPackageConflict[] = [];
  const seenStorageKeys = new Set<string>();
  const binaries = manifest.binaries.map((entry) => {
    if (seenStorageKeys.has(entry.storageKey)) {
      conflicts.push({
        type: "storage_key_conflict",
        storageKey: entry.storageKey,
        reason: "The package manifest lists the same storageKey more than once.",
      });
    }
    seenStorageKeys.add(entry.storageKey);

    if (entry.offset + entry.length > bundleBytes.byteLength) {
      conflicts.push({
        type: "invalid_binary_range",
        storageKey: entry.storageKey,
        reason: "The binary range exceeds the selected bundle size.",
      });
    }

    const bytes = bundleBytes.slice(entry.offset, entry.offset + entry.length);
    return {
      storageKey: entry.storageKey,
      bytes,
      blob: new Blob([bytes]),
    };
  });

  const binaryKeys = new Set(manifest.binaries.map((entry) => entry.storageKey));
  for (const attachment of manifest.attachments) {
    if (!binaryKeys.has(attachment.storageKey)) {
      conflicts.push({
        type: "package_missing_binary",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: "The package has metadata without a matching binary entry.",
      });
    }
  }

  for (const entry of manifest.binaries) {
    if (!manifest.attachments.some((item) => item.storageKey === entry.storageKey)) {
      conflicts.push({
        type: "package_orphan_binary",
        storageKey: entry.storageKey,
        reason: "The package has a binary entry without attachment metadata.",
      });
    }
  }

  const ids = new Set<string>();
  for (const attachment of manifest.attachments) {
    if (ids.has(attachment.id)) {
      conflicts.push({
        type: "package_duplicate_metadata_id",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: "The package lists the same metadata ID more than once.",
      });
    }
    ids.add(attachment.id);
  }

  if (conflicts.length > 0) {
    throw new AttachmentPackageConflictError(conflicts);
  }

  return binaries;
}

function collectPackageConflicts(
  incoming: Attachment[],
  prepared: PreparedBinary[],
  existingById: Map<string, Attachment>
): AttachmentPackageConflict[] {
  const conflicts: AttachmentPackageConflict[] = [];
  const binariesByStorageKey = new Set(prepared.map((binary) => binary.storageKey));

  for (const attachment of incoming) {
    const existing = existingById.get(attachment.id);
    if (existing && !sameAttachmentMetadata(existing, attachment)) {
      conflicts.push({
        type: "metadata_id_conflict",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: describeMetadataDifference(existing, attachment),
      });
    }

    if (!binariesByStorageKey.has(attachment.storageKey)) {
      conflicts.push({
        type: "package_missing_binary",
        attachmentId: attachment.id,
        storageKey: attachment.storageKey,
        reason: "No binary entry exists for this metadata record.",
      });
    }
  }

  return conflicts;
}

function sameAttachmentMetadata(left: Attachment, right: Attachment): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function describeMetadataDifference(left: Attachment, right: Attachment): string {
  if (left.storageKey !== right.storageKey) {
    return `The existing metadata points to ${left.storageKey}, but the package points to ${right.storageKey}.`;
  }
  if (left.filename !== right.filename) {
    return "The existing metadata has a different filename.";
  }
  if (left.ownerType !== right.ownerType || left.ownerId !== right.ownerId) {
    return "The existing metadata has a different owner.";
  }
  return "The existing metadata differs from the package record.";
}

async function blobsEqual(left: Blob, right: Blob): Promise<boolean> {
  const [leftBytes, rightBytes] = await Promise.all([
    left.arrayBuffer(),
    right.arrayBuffer(),
  ]);
  if (leftBytes.byteLength !== rightBytes.byteLength) {
    return false;
  }

  const leftView = new Uint8Array(leftBytes);
  const rightView = new Uint8Array(rightBytes);
  return leftView.every((value, index) => value === rightView[index]);
}
