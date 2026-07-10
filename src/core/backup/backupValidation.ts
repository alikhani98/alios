import { ValidationError } from "@/core/errors";
import { isoDateTimeSchema } from "@/shared/utils";

import { backupDataInputSchema, migrateBackupPayload } from "./backupMigration";
import { ALIOS_BACKUP_APP, ALIOS_BACKUP_VERSION, type AliosBackup } from "./types";

export const BACKUP_ERROR_CODES = {
  invalidJson: "BACKUP_INVALID_JSON",
  notAlios: "BACKUP_NOT_ALIOS",
  unsupportedVersion: "BACKUP_UNSUPPORTED_VERSION",
  invalidData: "BACKUP_INVALID_DATA",
} as const;

type BackupErrorCode = (typeof BACKUP_ERROR_CODES)[keyof typeof BACKUP_ERROR_CODES];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message: string, code: BackupErrorCode, cause?: unknown): never {
  throw new ValidationError(message, { code, cause });
}

function parseBackupEnvelope(payload: unknown): {
  app: string;
  backupVersion: number;
  exportedAt: string;
  data: unknown;
} {
  if (!isRecord(payload)) {
    fail("The backup data is not valid.", BACKUP_ERROR_CODES.invalidData);
  }

  const app = payload.app;
  if (typeof app !== "string") {
    fail("The backup data is not valid.", BACKUP_ERROR_CODES.invalidData);
  }

  if (app !== ALIOS_BACKUP_APP) {
    fail(
      "This file is not an AliOS backup.",
      BACKUP_ERROR_CODES.notAlios
    );
  }

  const backupVersion = payload.backupVersion;
  if (typeof backupVersion !== "number" || !Number.isInteger(backupVersion)) {
    fail("The backup data is not valid.", BACKUP_ERROR_CODES.invalidData);
  }

  if (backupVersion !== ALIOS_BACKUP_VERSION) {
    fail(
      "This AliOS backup version is not supported.",
      BACKUP_ERROR_CODES.unsupportedVersion
    );
  }

  const exportedAt = payload.exportedAt;
  if (
    typeof exportedAt !== "string" ||
    !isoDateTimeSchema.safeParse(exportedAt).success
  ) {
    fail("The backup data is not valid.", BACKUP_ERROR_CODES.invalidData);
  }

  return {
    app,
    backupVersion,
    exportedAt,
    data: payload.data,
  };
}

function parseBackupData(data: unknown) {
  if (!isRecord(data)) {
    fail("The backup data is not valid.", BACKUP_ERROR_CODES.invalidData);
  }

  const result = backupDataInputSchema.safeParse(data);
  if (!result.success) {
    fail(
      "The backup data is not valid.",
      BACKUP_ERROR_CODES.invalidData,
      result.error
    );
  }

  return result.data;
}

export function validateAndMigrateBackupPayload(payload: unknown): AliosBackup {
  const envelope = parseBackupEnvelope(payload);
  const data = parseBackupData(envelope.data);

  return migrateBackupPayload({
    app: ALIOS_BACKUP_APP,
    backupVersion: ALIOS_BACKUP_VERSION,
    exportedAt: envelope.exportedAt,
    data,
  });
}

export function validateAndMigrateBackup(content: string): AliosBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    fail(
      "The selected file is not valid JSON.",
      BACKUP_ERROR_CODES.invalidJson,
      error
    );
  }

  return validateAndMigrateBackupPayload(parsed);
}
