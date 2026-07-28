import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const syncConflictReasonSchema = z.enum([
  "diverged-updates",
  "remote-write-blocked",
]);

export const recordSyncMetadataSchema = z.object({
  ownerUserId: z.string().min(1),
  lastSyncedAt: isoDateTimeSchema.optional(),
  lastSyncedByDeviceId: z.string().min(1).optional(),
  conflictAt: isoDateTimeSchema.optional(),
  conflictReason: syncConflictReasonSchema.optional(),
});

export type SyncConflictReason = z.infer<typeof syncConflictReasonSchema>;
export type RecordSyncMetadata = z.infer<typeof recordSyncMetadataSchema>;
