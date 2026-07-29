import type { AliosBackupData, BackupStorage } from "@/core/backup";
import type { GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import { googleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import { CALENDAR_DISPLAY_STORAGE_KEY } from "@/shared/date";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";
import {
  financeObligationSchema,
  financeTransactionSchema,
  goalSchema,
  projectSchema,
  taskSchema,
  type FinanceObligation,
  type FinanceTransaction,
  type Goal,
  type Project,
  type RecordSyncMetadata,
  type Task,
} from "@/shared/types";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  getPreferenceStorage,
  notifyPreferenceChanged,
  writeStoredPreference,
  type PreferenceStorage,
} from "@/shared/preferences/storage";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/finance/financeSections";
import { HOME_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/home/homeCollapsedSections";
import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY } from "@/features/home/dashboardLayout";

import { USER_DATA_SYNC_TRIGGER_EVENT } from "./recordChangeEvents";
import {
  SUPABASE_SYNC_DEVICE_ID_STORAGE_KEY,
  SUPABASE_SYNC_METADATA_STORAGE_KEY,
  SUPABASE_SYNC_RECORDS_TABLE,
  getSupabaseSyncConfiguration,
} from "./supabaseSyncConfig";
import {
  createSupabaseBrowserClient,
  type SupabaseRecordRow,
  type SupabaseSession,
} from "./supabaseClient";
import type {
  SyncDiagnosticEntry,
  SyncDeviceIdentity,
  SyncLastOutcome,
} from "./syncMetadata";
import type {
  SyncConflictEntity,
  SyncConflictRecord,
  SyncConflictResolutionInput,
  SyncConflictResolutionResult,
  SyncCategoryStatus,
  SyncIssue,
  ManualPreparationStatus,
  SyncProvider,
  SyncResult,
  SyncScope,
  SyncStateListener,
  SyncStateSubscription,
  SyncStatus,
  SyncTrustedDevice,
} from "./types";

const SYNCED_PREFERENCE_KEYS = [
  LANGUAGE_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  ACCENT_COLOR_STORAGE_KEY,
  VIEW_DENSITY_MODE_STORAGE_KEY,
  CALENDAR_DISPLAY_STORAGE_KEY,
  HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
  HOME_COLLAPSED_SECTIONS_STORAGE_KEY,
  FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY,
] as const;

const USER_DATA_SCOPES = [
  "tasks",
  "projects",
  "goals",
  "financeTransactions",
  "financeObligations",
] as const;
const SUPABASE_SYNC_DIAGNOSTICS_STORAGE_KEY = "alios.sync.diagnostics";
const MAX_SYNC_DIAGNOSTIC_ENTRIES = 20;
const PREFERENCE_ONLY_SCOPES = ["preferences"] as const satisfies ReadonlyArray<SyncScope>;
const FULL_SYNC_SCOPES = [
  "preferences",
  "tasks",
  "projects",
  "goals",
  "finance",
] as const satisfies ReadonlyArray<SyncScope>;

type SyncedPreferenceKey = (typeof SYNCED_PREFERENCE_KEYS)[number];
type SyncedPreferencePayload = Partial<Record<SyncedPreferenceKey, string>>;
type SyncEntity = (typeof USER_DATA_SCOPES)[number];
type SyncableRecord =
  | Task
  | Project
  | Goal
  | FinanceTransaction
  | FinanceObligation;

type SyncMetadataRecord = Readonly<{
  backendUserId?: string;
  lastSyncedAt?: string;
  lastAttemptAt?: string;
  lastOutcome: SyncLastOutcome;
  detail?: string;
  conflictCount?: number;
  categoryStatuses?: ReadonlyArray<SyncCategoryStatus>;
  manualPreparation?: ManualPreparationStatus;
}>;

type SupabaseSyncUserMetadata = Readonly<{
  alios_preferences?: SyncedPreferencePayload;
  alios_sync?: Readonly<{
    scope: "preferences" | "preferences-and-user-data";
    deviceId: string;
    deviceLabel: string;
    lastSyncedAt: string;
  }>;
  alios_manual?: Readonly<{
    entryCount: number;
    lastModifiedAt?: string;
    readiness: "empty" | "ready";
  }>;
}>;

type SupabaseAuthFacade = Readonly<{
  getSession: () => Promise<{
    data: { session: SupabaseSession | null };
    error: Error | null;
  }>;
  signInWithIdToken: (input: {
    provider: "google";
    token: string;
  }) => Promise<{
    data: { session: SupabaseSession | null };
    error: Error | null;
  }>;
  updateUser: (attributes: {
    data: Record<string, unknown>;
  }) => Promise<{
    data: { user: SupabaseSession["user"] | null };
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
}>;

type SupabaseRecordsFacade = Readonly<{
  list: (input: {
    table: string;
    userId: string;
    entities: ReadonlyArray<string>;
  }) => Promise<{
    data: ReadonlyArray<SupabaseRecordRow>;
    error: Error | null;
  }>;
  upsert: (input: {
    table: string;
    rows: ReadonlyArray<SupabaseRecordRow>;
  }) => Promise<{
    data: ReadonlyArray<SupabaseRecordRow>;
    error: Error | null;
  }>;
}>;

type SupabaseClientFacade = Readonly<{
  auth: SupabaseAuthFacade;
  records: SupabaseRecordsFacade;
}>;

type SyncProviderDependencies = Readonly<{
  client?: SupabaseClientFacade;
  createClient?: () => SupabaseClientFacade | null;
  getStorage?: () => PreferenceStorage | null;
  now?: () => Date;
  runtime?: GoogleAuthRuntime;
  backupStorage?: BackupStorage;
}>;

type RecordMap<TRecord extends SyncableRecord> = Map<string, TRecord>;

function createFallbackDeviceId() {
  return `device-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function createDeviceId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return createFallbackDeviceId();
}

function readStoredJson<TValue>(
  storage: PreferenceStorage | null,
  key: string
): TValue | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as TValue) : null;
  } catch {
    return null;
  }
}

function writeStoredJson(
  storage: PreferenceStorage | null,
  key: string,
  value: unknown
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep sync metadata local and best-effort only.
  }
}

function getOrCreateDeviceIdentity(
  storage: PreferenceStorage | null
): SyncDeviceIdentity {
  const existingId = storage?.getItem(SUPABASE_SYNC_DEVICE_ID_STORAGE_KEY)?.trim();
  const deviceId = existingId && existingId.length > 0 ? existingId : createDeviceId();

  if (!existingId && storage) {
    try {
      storage.setItem(SUPABASE_SYNC_DEVICE_ID_STORAGE_KEY, deviceId);
    } catch {
      // Keep the generated device ID in memory if localStorage is unavailable.
    }
  }

  return {
    deviceId,
    label: "This device",
    platform: "web",
    trust: "known-device",
  };
}

function readLocalPreferenceSnapshot(
  storage: PreferenceStorage | null
): SyncedPreferencePayload {
  const snapshot: SyncedPreferencePayload = {};

  SYNCED_PREFERENCE_KEYS.forEach((key) => {
    const value = storage?.getItem(key);
    if (typeof value === "string") {
      snapshot[key] = value;
    }
  });

  return snapshot;
}

function readRemotePreferenceSnapshot(
  metadata: Record<string, unknown> | null | undefined
): SyncedPreferencePayload {
  const payload = metadata?.alios_preferences;
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const snapshot: SyncedPreferencePayload = {};

  SYNCED_PREFERENCE_KEYS.forEach((key) => {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string") {
      snapshot[key] = value;
    }
  });

  return snapshot;
}

function mergePreferenceSnapshots(
  localSnapshot: SyncedPreferencePayload,
  remoteSnapshot: SyncedPreferencePayload
): SyncedPreferencePayload {
  const merged: SyncedPreferencePayload = { ...remoteSnapshot };

  SYNCED_PREFERENCE_KEYS.forEach((key) => {
    const localValue = localSnapshot[key];
    if (typeof localValue === "string") {
      merged[key] = localValue;
    }
  });

  return merged;
}

function countChangedPreferences(
  nextSnapshot: SyncedPreferencePayload,
  previousSnapshot: SyncedPreferencePayload
) {
  return SYNCED_PREFERENCE_KEYS.reduce((count, key) => {
    return nextSnapshot[key] === previousSnapshot[key] ? count : count + 1;
  }, 0);
}

function applyRemotePreferencesToLocal(
  storage: PreferenceStorage | null,
  localSnapshot: SyncedPreferencePayload,
  mergedSnapshot: SyncedPreferencePayload
) {
  let changed = 0;

  SYNCED_PREFERENCE_KEYS.forEach((key) => {
    const localValue = localSnapshot[key];
    const mergedValue = mergedSnapshot[key];

    if (typeof localValue === "string" || typeof mergedValue !== "string") {
      return;
    }

    if (writeStoredPreference(key, mergedValue, storage)) {
      notifyPreferenceChanged(key);
      changed += 1;
    }
  });

  return changed;
}

function createSupabaseClientFromConfiguration(): SupabaseClientFacade | null {
  const configuration = getSupabaseSyncConfiguration();
  if (!configuration) {
    return null;
  }

  return createSupabaseBrowserClient(
    configuration.url,
    configuration.anonKey,
    configuration.authStorageKey
  );
}

function createLocalOnlyStatus(detail: string): SyncStatus {
  return {
    mode: "local-only",
    provider: "local-only",
    scopes: PREFERENCE_ONLY_SCOPES,
    detail,
  };
}

function getScopes(hasUserDataSync: boolean): ReadonlyArray<SyncScope> {
  return hasUserDataSync ? FULL_SYNC_SCOPES : PREFERENCE_ONLY_SCOPES;
}

function createCategoryStatuses(
  syncAt: string | undefined,
  hasUserDataSync: boolean,
  manualPreparation: ManualPreparationStatus
): ReadonlyArray<SyncCategoryStatus> {
  const statuses: SyncCategoryStatus[] = [
    {
      key: "preferences",
      state: syncAt ? "ready" : "local-only",
      detail: syncAt
        ? "Appearance, language, and interface preferences can sync on this device."
        : "Preferences stay local until optional sync is connected.",
      lastSyncedAt: syncAt,
      enabled: Boolean(syncAt),
      privacyLevel: "standard",
      visibility: syncAt ? "synced" : "local-only",
    },
    {
      key: "tasks",
      state: hasUserDataSync && syncAt ? "ready" : "local-only",
      detail: hasUserDataSync
        ? "Tasks remain local-first and sync only after authenticated opt-in."
        : "Tasks stay local until the broader sync boundary is enabled.",
      lastSyncedAt: hasUserDataSync ? syncAt : undefined,
      enabled: hasUserDataSync && Boolean(syncAt),
      privacyLevel: "standard",
      visibility: hasUserDataSync && syncAt ? "synced" : "local-only",
    },
    {
      key: "projects",
      state: hasUserDataSync && syncAt ? "ready" : "local-only",
      detail: hasUserDataSync
        ? "Projects remain editable offline and sync without bypassing local repositories."
        : "Projects stay local until the broader sync boundary is enabled.",
      lastSyncedAt: hasUserDataSync ? syncAt : undefined,
      enabled: hasUserDataSync && Boolean(syncAt),
      privacyLevel: "standard",
      visibility: hasUserDataSync && syncAt ? "synced" : "local-only",
    },
    {
      key: "goals",
      state: hasUserDataSync && syncAt ? "ready" : "local-only",
      detail: hasUserDataSync
        ? "Goals keep local ownership while this device exchanges approved sync records."
        : "Goals stay local until the broader sync boundary is enabled.",
      lastSyncedAt: hasUserDataSync ? syncAt : undefined,
      enabled: hasUserDataSync && Boolean(syncAt),
      privacyLevel: "standard",
      visibility: hasUserDataSync && syncAt ? "synced" : "local-only",
    },
    {
      key: "finance",
      state: hasUserDataSync && syncAt ? "ready" : "local-only",
      detail: hasUserDataSync
        ? "Finance transactions and obligations are sync-eligible in this stage; budgets remain derived from those records."
        : "Finance records stay local until the broader sync boundary is enabled.",
      lastSyncedAt: hasUserDataSync ? syncAt : undefined,
      enabled: hasUserDataSync && Boolean(syncAt),
      privacyLevel: "sensitive",
      visibility: hasUserDataSync && syncAt ? "synced" : "local-only",
    },
  ];

  statuses.push({
    key: "manual",
    state: manualPreparation.readiness === "ready" ? "planned" : "local-only",
    detail: manualPreparation.detail,
    lastSyncedAt: manualPreparation.lastModifiedAt,
    itemCount: manualPreparation.entryCount,
    enabled: false,
    privacyLevel: "private",
    visibility: manualPreparation.entryCount > 0 ? "metadata-only" : "local-only",
  });

  return statuses;
}

function readLastTrustedDevice(
  metadata: Record<string, unknown> | null | undefined
): SyncTrustedDevice | undefined {
  const payload = metadata?.alios_sync;
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const deviceId = (payload as Record<string, unknown>).deviceId;
  const label = (payload as Record<string, unknown>).deviceLabel;
  const lastSyncedAt = (payload as Record<string, unknown>).lastSyncedAt;

  if (typeof deviceId !== "string" || typeof label !== "string") {
    return undefined;
  }

  return {
    deviceId,
    label,
    lastSyncedAt: typeof lastSyncedAt === "string" ? lastSyncedAt : undefined,
  };
}

function buildConnectedDevices(
  currentDevice: SyncTrustedDevice | undefined,
  lastTrustedDevice: SyncTrustedDevice | undefined
): ReadonlyArray<SyncTrustedDevice> | undefined {
  const devices = [currentDevice, lastTrustedDevice].filter(
    (device): device is SyncTrustedDevice => Boolean(device)
  );

  if (devices.length === 0) {
    return undefined;
  }

  const uniqueDevices = new Map<string, SyncTrustedDevice>();
  devices.forEach((device) => {
    const existing = uniqueDevices.get(device.deviceId);
    if (!existing) {
      uniqueDevices.set(device.deviceId, device);
      return;
    }

    uniqueDevices.set(device.deviceId, {
      ...existing,
      lastSyncedAt: device.lastSyncedAt ?? existing.lastSyncedAt,
    });
  });

  return [...uniqueDevices.values()].sort((left, right) =>
    (right.lastSyncedAt ?? "").localeCompare(left.lastSyncedAt ?? "")
  );
}

function cloneRecord<TRecord extends SyncableRecord>(record: TRecord): TRecord {
  return {
    ...record,
    sync: record.sync ? { ...record.sync } : undefined,
  } as TRecord;
}

function normalizeSyncMetadata(
  sync: RecordSyncMetadata | undefined,
  ownerUserId: string
): RecordSyncMetadata {
  return {
    ownerUserId,
    lastSyncedAt: sync?.lastSyncedAt,
    lastSyncedByDeviceId: sync?.lastSyncedByDeviceId,
    conflictAt: sync?.conflictAt,
    conflictReason: sync?.conflictReason,
  };
}

function withSyncedMetadata<TRecord extends SyncableRecord>(
  record: TRecord,
  ownerUserId: string,
  syncAt: string,
  deviceId: string
): TRecord {
  return {
    ...cloneRecord(record),
    sync: {
      ...normalizeSyncMetadata(record.sync, ownerUserId),
      ownerUserId,
      lastSyncedAt: syncAt,
      lastSyncedByDeviceId: deviceId,
      conflictAt: undefined,
      conflictReason: undefined,
    },
  } as TRecord;
}

function withConflictMetadata<TRecord extends SyncableRecord>(
  record: TRecord,
  ownerUserId: string,
  conflictAt: string
): TRecord {
  return {
    ...cloneRecord(record),
    sync: {
      ...normalizeSyncMetadata(record.sync, ownerUserId),
      ownerUserId,
      conflictAt,
      conflictReason: "diverged-updates",
    },
  } as TRecord;
}

function isRecordDirty(record: SyncableRecord) {
  return (
    !record.sync?.lastSyncedAt || record.updatedAt > record.sync.lastSyncedAt
  );
}

function stripEphemeralSyncFields(record: SyncableRecord) {
  const next = cloneRecord(record);

  if (!next.sync) {
    return next;
  }

  next.sync = {
    ownerUserId: next.sync.ownerUserId,
    lastSyncedAt: next.sync.lastSyncedAt,
    lastSyncedByDeviceId: next.sync.lastSyncedByDeviceId,
  };

  return next;
}

function recordsMatch(left: SyncableRecord, right: SyncableRecord) {
  return (
    JSON.stringify(stripEphemeralSyncFields(left)) ===
    JSON.stringify(stripEphemeralSyncFields(right))
  );
}

function getTaskMap(data: AliosBackupData): RecordMap<Task> {
  return new Map(data.tasks.map((record) => [record.id, cloneRecord(record)]));
}

function getProjectMap(data: AliosBackupData): RecordMap<Project> {
  return new Map(data.projects.map((record) => [record.id, cloneRecord(record)]));
}

function getGoalMap(data: AliosBackupData): RecordMap<Goal> {
  return new Map(data.goals.map((record) => [record.id, cloneRecord(record)]));
}

function getFinanceTransactionMap(
  data: AliosBackupData
): RecordMap<FinanceTransaction> {
  return new Map(
    data.financeTransactions.map((record) => [record.id, cloneRecord(record)])
  );
}

function getFinanceObligationMap(
  data: AliosBackupData
): RecordMap<FinanceObligation> {
  return new Map(
    data.financeObligations.map((record) => [record.id, cloneRecord(record)])
  );
}

function toSortedValues<TRecord extends SyncableRecord>(records: RecordMap<TRecord>) {
  return [...records.values()].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
}

function getEntityRecordMap(
  data: AliosBackupData,
  entity: SyncEntity
): RecordMap<SyncableRecord> {
  switch (entity) {
    case "tasks":
      return getTaskMap(data);
    case "projects":
      return getProjectMap(data);
    case "goals":
      return getGoalMap(data);
    case "financeTransactions":
      return getFinanceTransactionMap(data);
    case "financeObligations":
      return getFinanceObligationMap(data);
  }
}

function applyEntityRecordMap(
  data: AliosBackupData,
  entity: SyncEntity,
  records: RecordMap<SyncableRecord>
) {
  switch (entity) {
    case "tasks":
      data.tasks = toSortedValues(records as RecordMap<Task>);
      break;
    case "projects":
      data.projects = toSortedValues(records as RecordMap<Project>);
      break;
    case "goals":
      data.goals = toSortedValues(records as RecordMap<Goal>);
      break;
    case "financeTransactions":
      data.financeTransactions = toSortedValues(
        records as RecordMap<FinanceTransaction>
      );
      break;
    case "financeObligations":
      data.financeObligations = toSortedValues(
        records as RecordMap<FinanceObligation>
      );
      break;
  }
}

function parseRemoteRecord(entity: SyncEntity, payload: Record<string, unknown>) {
  switch (entity) {
    case "tasks":
      return taskSchema.parse(payload);
    case "projects":
      return projectSchema.parse(payload);
    case "goals":
      return goalSchema.parse(payload);
    case "financeTransactions":
      return financeTransactionSchema.parse(payload);
    case "financeObligations":
      return financeObligationSchema.parse(payload);
  }
}

function toRemoteRow(
  entity: SyncEntity,
  record: SyncableRecord,
  ownerUserId: string
): SupabaseRecordRow {
  return {
    user_id: ownerUserId,
    entity,
    record_id: record.id,
    payload: record as unknown as Record<string, unknown>,
    updated_at: record.updatedAt,
    created_at: record.createdAt,
    last_synced_at: record.sync?.lastSyncedAt,
    last_synced_by_device_id: record.sync?.lastSyncedByDeviceId,
    has_conflict: Boolean(record.sync?.conflictAt),
    conflict_reason: record.sync?.conflictReason,
  };
}

function getConflictRecordTitle(record: SyncableRecord): string {
  return record.title;
}

function getRemoteDeviceLabel(
  remoteRecord: SyncableRecord,
  localDeviceId: string
): string {
  const remoteDeviceId = remoteRecord.sync?.lastSyncedByDeviceId;

  if (!remoteDeviceId) {
    return "Synced version";
  }

  return remoteDeviceId === localDeviceId ? "This device" : "Other device";
}

function createConflictRecord(
  entity: SyncConflictEntity,
  localRecord: SyncableRecord,
  remoteRecord: SyncableRecord,
  localDeviceLabel: string,
  localDeviceId: string
): SyncConflictRecord {
  return {
    entity,
    recordId: localRecord.id,
    title: getConflictRecordTitle(localRecord),
    conflictAt: localRecord.sync?.conflictAt ?? remoteRecord.updatedAt,
    conflictReason: localRecord.sync?.conflictReason,
    localUpdatedAt: localRecord.updatedAt,
    localLastSyncedAt: localRecord.sync?.lastSyncedAt,
    localDeviceId,
    localDeviceLabel,
    remoteUpdatedAt: remoteRecord.updatedAt,
    remoteLastSyncedAt: remoteRecord.sync?.lastSyncedAt,
    remoteDeviceId: remoteRecord.sync?.lastSyncedByDeviceId,
    remoteDeviceLabel: getRemoteDeviceLabel(remoteRecord, localDeviceId),
  };
}

function buildManualPreparationStatus(
  data: AliosBackupData
): ManualPreparationStatus {
  const entryCount = data.manualEntries.length;
  const lastModifiedAt = data.manualEntries.reduce<string | undefined>(
    (latest, entry) =>
      !latest || entry.updatedAt > latest ? entry.updatedAt : latest,
    undefined
  );

  return {
    entryCount,
    lastModifiedAt,
    readiness: entryCount > 0 ? "ready" : "empty",
    detail:
      entryCount > 0
        ? "Personal Manual remains local-only for content, but this device is now prepared to sync readiness metadata."
        : "Personal Manual has no entries yet, so sync preparation metadata stays empty on this device.",
  };
}

function createEmptyManualPreparationStatus(): ManualPreparationStatus {
  return {
    entryCount: 0,
    readiness: "empty",
    detail:
      "Personal Manual content still stays local while sync preparation metadata is being checked.",
  };
}

type EntitySyncOutcome = Readonly<{
  changedLocalRecords: number;
  uploadedRows: ReadonlyArray<SupabaseRecordRow>;
  conflictCount: number;
  staleLocalCount: number;
  staleRemoteCount: number;
}>;

type ConflictRecordBundle = Readonly<{
  conflict: SyncConflictRecord;
  localRecord: SyncableRecord;
  remoteRecord: SyncableRecord;
  ownerUserId: string;
}>;

function toIssueFromError(error: unknown): SyncIssue {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "connectivity";
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("fetch") ||
    message.includes("timeout")
  ) {
    return "connectivity";
  }

  return "provider";
}

function mergeEntityRecords(
  entity: SyncEntity,
  localData: AliosBackupData,
  remoteRows: ReadonlyArray<SupabaseRecordRow>,
  ownerUserId: string,
  syncAt: string,
  deviceId: string
): EntitySyncOutcome {
  const localRecords = getEntityRecordMap(localData, entity);
  const nextRecords = new Map(localRecords);
  const remoteRecords = new Map(
    remoteRows.map((row) => [
      row.record_id,
      parseRemoteRecord(entity, row.payload),
    ])
  );
  const uploadedRows: SupabaseRecordRow[] = [];
  let changedLocalRecords = 0;
  let conflictCount = 0;
  let staleLocalCount = 0;
  let staleRemoteCount = 0;
  const allRecordIds = new Set([
    ...localRecords.keys(),
    ...remoteRecords.keys(),
  ]);

  allRecordIds.forEach((recordId) => {
    const localRecord = localRecords.get(recordId);
    const remoteRecord = remoteRecords.get(recordId);

    if (localRecord && !remoteRecord) {
      const syncedLocalRecord = withSyncedMetadata(
        localRecord,
        ownerUserId,
        syncAt,
        deviceId
      );
      nextRecords.set(recordId, syncedLocalRecord);
      uploadedRows.push(toRemoteRow(entity, syncedLocalRecord, ownerUserId));
      if (!recordsMatch(localRecord, syncedLocalRecord)) {
        changedLocalRecords += 1;
      }
      return;
    }

    if (!localRecord || !remoteRecord) {
      if (!remoteRecord) {
        return;
      }

      const syncedRemoteRecord = withSyncedMetadata(
        remoteRecord,
        ownerUserId,
        syncAt,
        remoteRecord.sync?.lastSyncedByDeviceId ?? deviceId
      );
      nextRecords.set(recordId, syncedRemoteRecord);
      changedLocalRecords += 1;
      return;
    }

    if (recordsMatch(localRecord, remoteRecord)) {
      const alignedRecord = withSyncedMetadata(
        localRecord,
        ownerUserId,
        syncAt,
        deviceId
      );
      nextRecords.set(recordId, alignedRecord);
      uploadedRows.push(toRemoteRow(entity, alignedRecord, ownerUserId));
      if (!recordsMatch(localRecord, alignedRecord)) {
        changedLocalRecords += 1;
      }
      return;
    }

    const localDirty = isRecordDirty(localRecord);
    const remoteDirty = isRecordDirty(remoteRecord);

    if (localDirty && remoteDirty) {
      const conflictedRecord = withConflictMetadata(
        localRecord,
        ownerUserId,
        syncAt
      );
      nextRecords.set(recordId, conflictedRecord);
      if (!recordsMatch(localRecord, conflictedRecord)) {
        changedLocalRecords += 1;
      }
      conflictCount += 1;
      return;
    }

    if (localDirty || localRecord.updatedAt >= remoteRecord.updatedAt) {
      const syncedLocalRecord = withSyncedMetadata(
        localRecord,
        ownerUserId,
        syncAt,
        deviceId
      );
      nextRecords.set(recordId, syncedLocalRecord);
      uploadedRows.push(toRemoteRow(entity, syncedLocalRecord, ownerUserId));
      if (!recordsMatch(localRecord, syncedLocalRecord)) {
        changedLocalRecords += 1;
      }
      staleRemoteCount += 1;
      return;
    }

    const syncedRemoteRecord = withSyncedMetadata(
      remoteRecord,
      ownerUserId,
      syncAt,
      remoteRecord.sync?.lastSyncedByDeviceId ?? deviceId
    );
    nextRecords.set(recordId, syncedRemoteRecord);
    changedLocalRecords += 1;
    staleLocalCount += 1;
  });

  applyEntityRecordMap(localData, entity, nextRecords);

  return {
    changedLocalRecords,
    uploadedRows,
    conflictCount,
    staleLocalCount,
    staleRemoteCount,
  };
}

export class SupabasePreferenceSyncProvider implements SyncProvider {
  readonly name = "supabase";

  private readonly now: () => Date;
  private readonly getStorage: () => PreferenceStorage | null;
  private readonly runtime: GoogleAuthRuntime;
  private readonly client: SupabaseClientFacade | null;
  private readonly backupStorage: BackupStorage | null;
  private readonly listeners = new Set<SyncStateListener>();
  private syncInFlight: Promise<SyncResult> | null = null;
  private conflictSnapshot: ReadonlyArray<SyncConflictRecord> = [];
  private lastKnownStatus: SyncStatus = createLocalOnlyStatus(
    "AliOS is currently running only on this device."
  );

  constructor(dependencies: SyncProviderDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.getStorage = dependencies.getStorage ?? getPreferenceStorage;
    this.runtime = dependencies.runtime ?? googleAuthRuntime;
    this.client =
      dependencies.client ??
      dependencies.createClient?.() ??
      createSupabaseClientFromConfiguration();
    this.backupStorage = dependencies.backupStorage ?? null;

    this.runtime.subscribe((session) => {
      if (session.status === "authenticated") {
        void this.syncNow();
        return;
      }

      if (session.status === "unauthenticated" || session.status === "error") {
        void this.disconnectRemoteSession().finally(() => {
          this.emitStatus(
            createLocalOnlyStatus(
              "Sign in with Google on this device to connect sync."
            )
          );
        });
      }
    });

    if (typeof window !== "undefined") {
      const handlePreferenceChange = () => {
        if (this.runtime.getSession().status === "authenticated") {
          void this.syncNow();
        }
      };

      window.addEventListener("storage", handlePreferenceChange);
      window.addEventListener(
        LOCAL_PREFERENCE_CHANGE_EVENT,
        handlePreferenceChange
      );
      window.addEventListener(USER_DATA_SYNC_TRIGGER_EVENT, handlePreferenceChange);
    }
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.client) {
      const status = createLocalOnlyStatus(
        "Sync stays disabled until Supabase environment variables are configured."
      );
      this.emitStatus(status);
      return status;
    }

    const authSession = this.runtime.getSession();
    if (authSession.status !== "authenticated" || !authSession.user) {
      const status = createLocalOnlyStatus(
        "Sign in with Google on this device to connect sync."
      );
      this.emitStatus(status);
      return status;
    }

    const connectedSession = await this.ensureRemoteSession(false);
    const metadata = this.readMetadata();
    const scopes = getScopes(this.backupStorage !== null);
    const lastTrustedDevice =
      connectedSession?.user
        ? readLastTrustedDevice(
            connectedSession.user.user_metadata as
              | Record<string, unknown>
              | undefined
          )
        : undefined;
    const manualPreparation =
      metadata.manualPreparation ??
      (this.backupStorage
        ? buildManualPreparationStatus(await this.backupStorage.readAll())
        : createEmptyManualPreparationStatus());
    const categoryStatuses =
      metadata.categoryStatuses ??
      createCategoryStatuses(
        metadata.lastSyncedAt,
        this.backupStorage !== null,
        manualPreparation
      );

    if (!connectedSession?.user) {
      const status: SyncStatus = {
        mode: "local-only",
        provider: "supabase",
        scopes,
        lastSyncedAt: metadata.lastSyncedAt,
        lastAttemptAt: metadata.lastAttemptAt,
        conflictCount: metadata.conflictCount,
        categoryStatuses,
        manualPreparation,
        lastTrustedDevice,
        connectedDevices: buildConnectedDevices(undefined, lastTrustedDevice),
        detail:
          metadata.detail ??
          "AliOS has not connected this device to sync yet.",
      };
      this.emitStatus(status);
      return status;
    }

    const device = getOrCreateDeviceIdentity(this.getStorage());
    const status: SyncStatus = {
      mode: metadata.lastOutcome === "error" ? "error" : "ready",
      provider: "supabase",
      scopes,
      connectedUserId: connectedSession.user.id,
      deviceId: device.deviceId,
      deviceLabel: device.label,
      lastSyncedAt: metadata.lastSyncedAt,
      lastAttemptAt: metadata.lastAttemptAt,
      conflictCount: metadata.conflictCount,
      categoryStatuses,
      manualPreparation,
      lastTrustedDevice,
      connectedDevices: buildConnectedDevices(
        {
          deviceId: device.deviceId,
          label: device.label,
          lastSyncedAt: metadata.lastSyncedAt,
        },
        lastTrustedDevice
      ),
      issue:
        metadata.lastOutcome === "error"
          ? metadata.conflictCount && metadata.conflictCount > 0
            ? "conflict"
            : "provider"
          : undefined,
      detail:
        metadata.detail ??
        (this.backupStorage
          ? "AliOS sync is connected for preferences, tasks, projects, goals, and finance records on this device."
          : "AliOS sync is connected for low-risk preferences on this device."),
    };
    this.emitStatus(status);
    return status;
  }

  async syncNow(): Promise<SyncResult> {
    if (this.syncInFlight) {
      return this.syncInFlight;
    }

    this.syncInFlight = this.runSync().finally(() => {
      this.syncInFlight = null;
    });

    return this.syncInFlight;
  }

  getConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    return this.conflictSnapshot;
  }

  async listConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    const bundles = await this.loadConflictBundles();
    const conflicts = bundles.map((bundle) => bundle.conflict);
    this.conflictSnapshot = conflicts;
    return conflicts;
  }

  async resolveConflict(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult> {
    const context = await this.loadConflictContext();
    if (!context) {
      throw new Error(
        "AliOS cannot resolve sync conflicts until this device has an authenticated sync session."
      );
    }

    const syncAt = this.now().toISOString();
    const entityRecords = getEntityRecordMap(context.localData, input.entity);
    const localRecord = entityRecords.get(input.recordId);
    const remoteRow = context.remoteRows.find(
      (row) => row.entity === input.entity && row.record_id === input.recordId
    );

    if (!localRecord || !remoteRow) {
      throw new Error(
        "AliOS could not load both record versions for this conflict."
      );
    }

    const remoteRecord = parseRemoteRecord(input.entity, remoteRow.payload);
    const resolvedRecord =
      input.resolution === "keep-local"
        ? withSyncedMetadata(
            localRecord,
            context.ownerUserId,
            syncAt,
            context.device.deviceId
          )
        : withSyncedMetadata(
            remoteRecord,
            context.ownerUserId,
            syncAt,
            remoteRecord.sync?.lastSyncedByDeviceId ?? context.device.deviceId
          );

    entityRecords.set(input.recordId, resolvedRecord);
    applyEntityRecordMap(context.localData, input.entity, entityRecords);

    const client = this.client;
    if (!client) {
      throw new Error("AliOS sync is unavailable on this device.");
    }

    const upsertResult = await client.records.upsert({
      table: SUPABASE_SYNC_RECORDS_TABLE,
      rows: [toRemoteRow(input.entity, resolvedRecord, context.ownerUserId)],
    });

    if (upsertResult.error) {
      throw upsertResult.error;
    }

    await this.backupStorage?.replaceAll(context.localData);

    const remainingConflicts = await this.loadConflictBundles();
    this.conflictSnapshot = remainingConflicts.map((bundle) => bundle.conflict);
    const detail =
      remainingConflicts.length > 0
        ? "AliOS resolved one conflict, but some records still need review."
        : "AliOS resolved the selected conflict and kept your chosen record version.";

    this.writeMetadata({
      ...this.readMetadata(),
      backendUserId: context.ownerUserId,
      lastSyncedAt: syncAt,
      lastAttemptAt: syncAt,
      lastOutcome: remainingConflicts.length > 0 ? "error" : "success",
      conflictCount: remainingConflicts.length,
      detail,
    });

    const status = await this.getStatus();
    const conflict = createConflictRecord(
      input.entity,
      localRecord,
      remoteRecord,
      context.device.label,
      context.device.deviceId
    );

    return {
      status,
      conflict,
      resolution: input.resolution,
    };
  }

  subscribe(listener: SyncStateListener): SyncStateSubscription {
    this.listeners.add(listener);
    listener(this.lastKnownStatus);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private emitStatus(status: SyncStatus) {
    this.lastKnownStatus = status;
    this.listeners.forEach((listener) => {
      listener(status);
    });
  }

  private async loadConflictContext(): Promise<{
    ownerUserId: string;
    device: SyncDeviceIdentity;
    localData: AliosBackupData;
    remoteRows: ReadonlyArray<SupabaseRecordRow>;
  } | null> {
    if (!this.client || !this.backupStorage) {
      return null;
    }

    const connectedSession = await this.ensureRemoteSession(false);
    if (!connectedSession?.user) {
      return null;
    }

    const device = getOrCreateDeviceIdentity(this.getStorage());
    const localData = await this.backupStorage.readAll();
    const recordsResult = await this.client.records.list({
      table: SUPABASE_SYNC_RECORDS_TABLE,
      userId: connectedSession.user.id,
      entities: [...USER_DATA_SCOPES],
    });

    if (recordsResult.error) {
      throw recordsResult.error;
    }

    return {
      ownerUserId: connectedSession.user.id,
      device,
      localData,
      remoteRows: recordsResult.data,
    };
  }

  private async loadConflictBundles(): Promise<ReadonlyArray<ConflictRecordBundle>> {
    const context = await this.loadConflictContext();
    if (!context) {
      return [];
    }

    const conflicts: ConflictRecordBundle[] = [];

    USER_DATA_SCOPES.forEach((entity) => {
      const localRecords = getEntityRecordMap(context.localData, entity);
      const remoteRows = context.remoteRows.filter((row) => row.entity === entity);
      const remoteRecords = new Map(
        remoteRows.map((row) => [
          row.record_id,
          parseRemoteRecord(entity, row.payload),
        ])
      );

      localRecords.forEach((localRecord, recordId) => {
        if (!localRecord.sync?.conflictAt) {
          return;
        }

        const remoteRecord = remoteRecords.get(recordId);
        if (!remoteRecord) {
          return;
        }

        conflicts.push({
          ownerUserId: context.ownerUserId,
          localRecord,
          remoteRecord,
          conflict: createConflictRecord(
            entity,
            localRecord,
            remoteRecord,
            context.device.label,
            context.device.deviceId
          ),
        });
      });
    });

    return conflicts.sort((left, right) =>
      right.conflict.conflictAt.localeCompare(left.conflict.conflictAt)
    );
  }

  private readDiagnostics(): ReadonlyArray<SyncDiagnosticEntry> {
    return (
      readStoredJson<ReadonlyArray<SyncDiagnosticEntry>>(
        this.getStorage(),
        SUPABASE_SYNC_DIAGNOSTICS_STORAGE_KEY
      ) ?? []
    );
  }

  private appendDiagnostic(entry: SyncDiagnosticEntry) {
    const nextEntries = [entry, ...this.readDiagnostics()].slice(
      0,
      MAX_SYNC_DIAGNOSTIC_ENTRIES
    );
    writeStoredJson(
      this.getStorage(),
      SUPABASE_SYNC_DIAGNOSTICS_STORAGE_KEY,
      nextEntries
    );
  }

  private async runSync(): Promise<SyncResult> {
    if (!this.client) {
      const status = createLocalOnlyStatus(
        "Sync stays disabled until Supabase environment variables are configured."
      );
      this.emitStatus(status);
      return {
        changedRecords: 0,
        status,
      };
    }

    const authSession = this.runtime.getSession();
    if (authSession.status !== "authenticated" || !authSession.user) {
      const status = createLocalOnlyStatus(
        "Sign in with Google on this device to connect sync."
      );
      this.emitStatus(status);
      return {
        changedRecords: 0,
        status,
      };
    }

    const attemptAt = this.now().toISOString();
    const scopes = getScopes(this.backupStorage !== null);
    const syncingStatus: SyncStatus = {
      mode: "syncing",
      provider: "supabase",
      scopes,
      lastAttemptAt: attemptAt,
      categoryStatuses: createCategoryStatuses(
        undefined,
        this.backupStorage !== null,
        createEmptyManualPreparationStatus()
      ),
      lastTrustedDevice: undefined,
      connectedDevices: [
        {
          deviceId: getOrCreateDeviceIdentity(this.getStorage()).deviceId,
          label: getOrCreateDeviceIdentity(this.getStorage()).label,
        },
      ],
      detail: this.backupStorage
        ? "AliOS is syncing preferences, tasks, projects, goals, and finance records for this device."
        : "AliOS is syncing low-risk preferences for this device.",
    };
    this.writeMetadata({
      ...this.readMetadata(),
      lastAttemptAt: attemptAt,
      detail: syncingStatus.detail,
    });
    this.appendDiagnostic({
      startedAt: attemptAt,
      outcome: "started",
      provider: "supabase",
    });
    this.emitStatus(syncingStatus);

    try {
      const connectedSession = await this.ensureRemoteSession(true);

      if (!connectedSession?.user) {
        const status = createLocalOnlyStatus(
          "AliOS could not connect this Google session to Supabase sync."
        );
        this.writeMetadata({
          ...this.readMetadata(),
          lastAttemptAt: attemptAt,
          lastOutcome: "error",
          detail: status.detail,
        });
        this.emitStatus(status);
        return {
          changedRecords: 0,
          status,
        };
      }

      const storage = this.getStorage();
      const device = getOrCreateDeviceIdentity(storage);
      const localSnapshot = readLocalPreferenceSnapshot(storage);
      const remoteSnapshot = readRemotePreferenceSnapshot(
        connectedSession.user.user_metadata as Record<string, unknown> | undefined
      );
      const mergedSnapshot = mergePreferenceSnapshots(localSnapshot, remoteSnapshot);
      const localPreferenceChanges = applyRemotePreferencesToLocal(
        storage,
        localSnapshot,
        mergedSnapshot
      );
      const remotePreferenceChanges = countChangedPreferences(
        mergedSnapshot,
        remoteSnapshot
      );
      const syncAt = this.now().toISOString();

      let localUserDataChanges = 0;
      let remoteUserDataChanges = 0;
      let conflictCount = 0;
      let staleLocalCount = 0;
      let staleRemoteCount = 0;
      let manualPreparation = createEmptyManualPreparationStatus();

      if (this.backupStorage) {
        const localData = await this.backupStorage.readAll();
        manualPreparation = buildManualPreparationStatus(localData);
        const remoteRecordsResult = await this.client.records.list({
          table: SUPABASE_SYNC_RECORDS_TABLE,
          userId: connectedSession.user.id,
          entities: USER_DATA_SCOPES,
        });

        if (remoteRecordsResult.error) {
          throw remoteRecordsResult.error;
        }

        const uploadedRows: SupabaseRecordRow[] = [];

        USER_DATA_SCOPES.forEach((entity) => {
          const entityRows = remoteRecordsResult.data.filter(
            (row) => row.entity === entity
          );
          const outcome = mergeEntityRecords(
            entity,
            localData,
            entityRows,
            connectedSession.user.id,
            syncAt,
            device.deviceId
          );
          localUserDataChanges += outcome.changedLocalRecords;
          remoteUserDataChanges += outcome.uploadedRows.length;
          conflictCount += outcome.conflictCount;
          staleLocalCount += outcome.staleLocalCount;
          staleRemoteCount += outcome.staleRemoteCount;
          uploadedRows.push(...outcome.uploadedRows);
        });

        if (localUserDataChanges > 0 || conflictCount > 0) {
          await this.backupStorage.replaceAll(localData);
        }

        const upsertResult = await this.client.records.upsert({
          table: SUPABASE_SYNC_RECORDS_TABLE,
          rows: uploadedRows,
        });

        if (upsertResult.error) {
          throw upsertResult.error;
        }

      }

      const existingMetadata =
        (connectedSession.user.user_metadata as Record<string, unknown> | undefined) ??
        {};
      const remoteMetadata: SupabaseSyncUserMetadata = {
        ...existingMetadata,
        alios_preferences: mergedSnapshot,
        alios_sync: {
          scope: this.backupStorage
            ? "preferences-and-user-data"
            : "preferences",
          deviceId: device.deviceId,
          deviceLabel: device.label,
          lastSyncedAt: syncAt,
        },
        alios_manual: {
          entryCount: manualPreparation.entryCount,
          lastModifiedAt: manualPreparation.lastModifiedAt,
          readiness: manualPreparation.readiness,
        },
      };
      const updateUserResult = await this.client.auth.updateUser({
        data: remoteMetadata as Record<string, unknown>,
      });

      if (updateUserResult.error) {
        throw updateUserResult.error;
      }

      const categoryStatuses = createCategoryStatuses(
        syncAt,
        this.backupStorage !== null,
        manualPreparation
      );
      const detail =
        conflictCount > 0
          ? "AliOS synced preferences and safe records, but some task, project, goal, or finance changes now need conflict review."
          : this.backupStorage
            ? "AliOS synced preferences, tasks, projects, goals, and finance records for this device."
            : "AliOS synced appearance, language, and interface preferences for this device.";

      const status: SyncStatus = {
        mode: conflictCount > 0 ? "error" : "ready",
        provider: "supabase",
        scopes,
        connectedUserId: connectedSession.user.id,
        deviceId: device.deviceId,
        deviceLabel: device.label,
        lastSyncedAt: syncAt,
        lastAttemptAt: attemptAt,
        conflictCount,
        issue: conflictCount > 0 ? "conflict" : undefined,
        categoryStatuses,
        manualPreparation,
        lastTrustedDevice: {
          deviceId: device.deviceId,
          label: device.label,
          lastSyncedAt: syncAt,
        },
        connectedDevices: buildConnectedDevices(
          {
            deviceId: device.deviceId,
            label: device.label,
            lastSyncedAt: syncAt,
          },
          readLastTrustedDevice(updateUserResult.data.user?.user_metadata)
        ),
        detail,
      };

      const changedRecords =
        localPreferenceChanges +
        remotePreferenceChanges +
        localUserDataChanges +
        remoteUserDataChanges;

      this.writeMetadata({
        backendUserId: connectedSession.user.id,
        lastAttemptAt: attemptAt,
        lastSyncedAt: syncAt,
        lastOutcome: conflictCount > 0 ? "error" : "success",
        detail,
        conflictCount,
        categoryStatuses,
        manualPreparation,
      });
      this.emitStatus(status);
      this.appendDiagnostic({
        startedAt: attemptAt,
        finishedAt: syncAt,
        outcome: conflictCount > 0 ? "error" : "success",
        provider: "supabase",
        changedRecords,
        conflictCount,
        staleLocalCount,
        staleRemoteCount,
        failureReason: conflictCount > 0 ? detail : undefined,
      });

      return {
        changedRecords,
        status,
      };
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : "AliOS could not complete sync.";
      const previousMetadata = this.readMetadata();
      const status: SyncStatus = {
        mode: "error",
        provider: "supabase",
        scopes,
        connectedUserId: previousMetadata.backendUserId,
        lastSyncedAt: previousMetadata.lastSyncedAt,
        lastAttemptAt: attemptAt,
        conflictCount: previousMetadata.conflictCount,
        issue: toIssueFromError(error),
        categoryStatuses: previousMetadata.categoryStatuses,
        manualPreparation: previousMetadata.manualPreparation,
        lastTrustedDevice: undefined,
        connectedDevices: previousMetadata.backendUserId
          ? buildConnectedDevices(
              undefined,
              previousMetadata.lastSyncedAt
                ? {
                    deviceId:
                      this.lastKnownStatus.deviceId ??
                      this.lastKnownStatus.lastTrustedDevice?.deviceId ??
                      "current-device",
                    label:
                      this.lastKnownStatus.deviceLabel ??
                      this.lastKnownStatus.lastTrustedDevice?.label ??
                      "This device",
                    lastSyncedAt: previousMetadata.lastSyncedAt,
                  }
                : undefined
            )
          : undefined,
        detail,
      };
      this.writeMetadata({
        ...previousMetadata,
        lastAttemptAt: attemptAt,
        lastOutcome: "error",
        detail,
      });
      this.emitStatus(status);
      this.appendDiagnostic({
        startedAt: attemptAt,
        finishedAt: this.now().toISOString(),
        outcome: "error",
        provider: "supabase",
        conflictCount: previousMetadata.conflictCount,
        failureReason: detail,
      });

      return {
        changedRecords: 0,
        status,
      };
    }
  }

  private async ensureRemoteSession(
    allowTokenExchange: boolean
  ): Promise<SupabaseSession | null> {
    if (!this.client) {
      return null;
    }

    const currentSessionResult = await this.client.auth.getSession();
    if (currentSessionResult.error) {
      throw currentSessionResult.error;
    }

    if (currentSessionResult.data.session?.user) {
      return currentSessionResult.data.session;
    }

    if (!allowTokenExchange) {
      return null;
    }

    const idToken = this.runtime.getIdToken();
    if (!idToken) {
      return null;
    }

    const signInResult = await this.client.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (signInResult.error) {
      throw signInResult.error;
    }

    return signInResult.data.session;
  }

  private async disconnectRemoteSession() {
    if (!this.client) {
      return;
    }

    await this.client.auth.signOut().catch(() => {
      return { error: null };
    });
  }

  private readMetadata(): SyncMetadataRecord {
    return (
      readStoredJson<SyncMetadataRecord>(
        this.getStorage(),
        SUPABASE_SYNC_METADATA_STORAGE_KEY
      ) ?? {
        lastOutcome: "never",
      }
    );
  }

  private writeMetadata(metadata: SyncMetadataRecord) {
    writeStoredJson(
      this.getStorage(),
      SUPABASE_SYNC_METADATA_STORAGE_KEY,
      metadata
    );
  }
}

export const supabasePreferenceSyncProvider =
  new SupabasePreferenceSyncProvider();
