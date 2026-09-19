import type { AttachmentRepository } from "@/core/repositories";
import type { BinaryStorage } from "@/core/storage";
import type { Attachment } from "@/shared/types";

export type AttachmentIntegrityIssue =
  | Readonly<{
      type: "metadata_without_binary";
      attachment: Attachment;
    }>
  | Readonly<{
      type: "binary_without_metadata";
      storageKey: string;
    }>
  | Readonly<{
      type: "unavailable_storage_record";
      attachment: Attachment;
    }>;

export type AttachmentIntegritySnapshot = Readonly<{
  checkedAt: string;
  complete: boolean;
  issues: ReadonlyArray<AttachmentIntegrityIssue>;
}>;

export type AttachmentIntegrityDependencies = {
  attachments: AttachmentRepository;
  binaryStorage: BinaryStorage;
};

/**
 * Reports attachment metadata/binary inconsistencies without repairing or deleting
 * anything. Multiple metadata records may intentionally share one storageKey.
 */
export async function buildAttachmentIntegritySnapshot(
  dependencies: AttachmentIntegrityDependencies
): Promise<AttachmentIntegritySnapshot> {
  const metadata = await dependencies.attachments.listAll();
  const metadataByStorageKey = new Map<string, Attachment[]>();

  for (const attachment of metadata) {
    const references = metadataByStorageKey.get(attachment.storageKey) ?? [];
    references.push(attachment);
    metadataByStorageKey.set(attachment.storageKey, references);
  }

  const metadataIssues = await Promise.all(
    metadata.map(async (attachment): Promise<AttachmentIntegrityIssue | null> => {
      try {
        const exists = await dependencies.binaryStorage.has(
          attachment.storageKey
        );
        return exists
          ? null
          : { type: "metadata_without_binary", attachment };
      } catch {
        return { type: "unavailable_storage_record", attachment };
      }
    })
  );

  let binaryKeys: string[];
  try {
    binaryKeys = await dependencies.binaryStorage.listKeys();
  } catch {
    return {
      checkedAt: new Date().toISOString(),
      complete: false,
      issues: metadataIssues.filter(
        (issue): issue is AttachmentIntegrityIssue => issue !== null
      ),
    };
  }

  const orphanIssues: AttachmentIntegrityIssue[] = binaryKeys
    .filter((storageKey) => !metadataByStorageKey.has(storageKey))
    .map((storageKey) => ({
      type: "binary_without_metadata",
      storageKey,
    }));

  return {
    checkedAt: new Date().toISOString(),
    complete: true,
    issues: [
      ...metadataIssues.filter(
        (issue): issue is AttachmentIntegrityIssue => issue !== null
      ),
      ...orphanIssues,
    ],
  };
}
