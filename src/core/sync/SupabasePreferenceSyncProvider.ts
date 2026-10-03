import type { AliosBackupData, BackupStorage } from "@/core/backup";
import type { AuthProvider, AuthSession } from "@/core/auth";
import { googleAuthProvider } from "@/core/auth";
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
  inboxItemSchema,
  manualEntrySchema,
  projectSchema,
  routineSchema,
  taskSchema,
  type FinanceObligation,
  type FinanceTransaction,
  type Goal,
  type InboxItem,
  type ManualEntry,
  type Project,
  type RecordSyncMetadata,
  type Routine,
  type Task,
} from "@/shared/types";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  getPreferenceStorage,
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
  createSupabaseRecordTombstonePayload,
  isSupabaseRecordTombstone,
  type SupabaseRecordRow,
  type SupabaseSession,
} from "./supabaseClient";
import {
  MutationOutboxConflictError,
  type MutationOutboxEntry,
  type MutationOutboxProcessResult,
  type MutationOutboxRepository,
} from "./mutationOutbox";
import { MutationOutboxProcessor } from "./mutationOutboxProcessor";
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
  "inboxItems",
  "tasks",
  "routines",
  "projects",
  "goals",
  "financeTransactions",
  "financeObligations",
  "manualEntries",
] as const satisfies ReadonlyArray<SyncConflictEntity>;
const SUPABASE_SYNC_DIAGNOSTICS_STORAGE_KEY = "alios.sync.diagnostics";
const SUPABASE_SYNC_ENABLED_STORAGE_KEY = "alios.sync.enabled";
const MAX_SYNC_DIAGNOSTIC_ENTRIES = 20;
const PREFERENCE_ONLY_SCOPES = ["preferences"] as const satisfies ReadonlyArray<SyncScope>;
const FULL_SYNC_SCOPES = [
  "preferences",
  "tasks",
  "routines",
  "projects",
  "goals",
  "finance",
  "manual",
] as const satisfies ReadonlyArray<SyncScope>;

type SyncedPreferenceKey = (typeof SYNCED_PREFERENCE_KEYS)[number];
type SyncedPreferencePayload = Partial<Record<SyncedPreferenceKey, string>>;
type SyncEntity = SyncConflictEntity;
type SyncableRecord =
  | InboxItem
  | Task
  | Routine
  | Project
  | Goal
  | ManualEntry
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

type SyncableRecordWithMetadata = SyncableRecord & {
  sync?: RecordSyncMetadata;
};

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
  tombstone?: (input: {
    table: string;
    userId: string;
    entity: string;
    recordId: string;
    deletedAt: string;
    previousRecord?: Readonly<Record<string, unknown>>;
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
  authProvider?: Pick<AuthProvider, "getCurrentSession" | "subscribe">;
  runtime?: GoogleAuthRuntime;
  idTokenProvider?: Pick<GoogleAuthRuntime, "getIdToken">;
  backupStorage?: BackupStorage;
  mutationOutboxRepository?: MutationOutboxRepository;
}>;

type SyncAuthSessionSource = Readonly<{
  getCurrentSession: () => Promise<AuthSession>;
  subscribe: (listener: (session: AuthSession) => void) => { unsubscribe: () => void };
}>;

type AuthSessionSubscription = ReturnType<SyncAuthSessionSource["subscribe"]>;

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
    enabled: false,
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
      key: "routines",
      state: hasUserDataSync && syncAt ? "ready" : "local-only",
      detail: hasUserDataSync
        ? "Routines stay editable offline and sync through the same local-first repository boundary."
        : "Routines stay local until the broader sync boundary is enabled.",
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
    state: hasUserDataSync && syncAt ? "ready" : "local-only",
    detail: manualPreparation.detail,
    lastSyncedAt: hasUserDataSync ? syncAt : undefined,
    itemCount: manualPreparation.entryCount,
    enabled: hasUserDataSync && Boolean(syncAt),
    privacyLevel: "private",
    visibility:
      hasUserDataSync && syncAt
        ? "synced"
        : manualPreparation.entryCount > 0
          ? "metadata-only"
          : "local-only",
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
  const sync = (record as SyncableRecordWithMetadata).sync;

  return {
    ...record,
    sync: sync ? { ...sync } : undefined,
  } as TRecord;
}

function getRecordSync(record: SyncableRecord): RecordSyncMetadata | undefined {
  return (record as SyncableRecordWithMetadata).sync;
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
      ...normalizeSyncMetadata(getRecordSync(record), ownerUserId),
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
      ...normalizeSyncMetadata(getRecordSync(record), ownerUserId),
      ownerUserId,
      conflictAt,
      conflictReason: "diverged-updates",
    },
  } as TRecord;
}

function isRecordDirty(record: SyncableRecord) {
  const sync = getRecordSync(record);

  return (
    !sync?.lastSyncedAt || record.updatedAt > sync.lastSyncedAt
  );
}

function stripEphemeralSyncFields(record: SyncableRecord) {
  const next = cloneRecord(record);
  const nextWithMetadata = next as SyncableRecordWithMetadata;

  if (!nextWithMetadata.sync) {
    return next;
  }

  nextWithMetadata.sync = {
    ownerUserId: nextWithMetadata.sync.ownerUserId,
    lastSyncedAt: nextWithMetadata.sync.lastSyncedAt,
    lastSyncedByDeviceId: nextWithMetadata.sync.lastSyncedByDeviceId,
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

function getInboxItemMap(data: AliosBackupData): RecordMap<InboxItem> {
  return new Map(
    data.inboxItems.map((record) => [record.id, cloneRecord(record)])
  );
}

function getRoutineMap(data: AliosBackupData): RecordMap<Routine> {
  return new Map(
    data.routines.map((record) => [record.id, cloneRecord(record)])
  );
}

function getProjectMap(data: AliosBackupData): RecordMap<Project> {
  return new Map(data.projects.map((record) => [record.id, cloneRecord(record)]));
}

function getGoalMap(data: AliosBackupData): RecordMap<Goal> {
  return new Map(data.goals.map((record) => [record.id, cloneRecord(record)]));
}

function getManualEntryMap(data: AliosBackupData): RecordMap<ManualEntry> {
  return new Map(
    data.manualEntries.map((record) => [record.id, cloneRecord(record)])
  );
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
    case "inboxItems":
      return getInboxItemMap(data);
    case "tasks":
      return getTaskMap(data);
    case "routines":
      return getRoutineMap(data);
    case "projects":
      return getProjectMap(data);
    case "goals":
      return getGoalMap(data);
    case "manualEntries":
      return getManualEntryMap(data);
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
    case "inboxItems":
      data.inboxItems = toSortedValues(records as RecordMap<InboxItem>);
      break;
    case "tasks":
      data.tasks = toSortedValues(records as RecordMap<Task>);
      break;
    case "routines":
      data.routines = toSortedValues(records as RecordMap<Routine>);
      break;
    case "projects":
      data.projects = toSortedValues(records as RecordMap<Project>);
      break;
    case "goals":
      data.goals = toSortedValues(records as RecordMap<Goal>);
      break;
    case "manualEntries":
      data.manualEntries = toSortedValues(records as RecordMap<ManualEntry>);
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

function parseRemoteRecord(
  entity: SyncEntity,
  payload: Readonly<Record<string, unknown>>
) {
  switch (entity) {
    case "inboxItems":
      return inboxItemSchema.parse(payload);
    case "tasks":
      return taskSchema.parse(payload);
    case "routines":
      return routineSchema.parse(payload);
    case "projects":
      return projectSchema.parse(payload);
    case "goals":
      return goalSchema.parse(payload);
    case "manualEntries":
      return manualEntrySchema.parse(payload);
    case "financeTransactions":
      return financeTransactionSchema.parse(payload);
    case "financeObligations":
      return financeObligationSchema.parse(payload);
  }
}

function parseTombstonePreviousRecord(
  entity: SyncEntity,
  payload: Readonly<Record<string, unknown>>
): SyncableRecord | undefined {
  if (!isSupabaseRecordTombstone(payload)) {
    return undefined;
  }

  const previousRecord = payload.previousRecord;
  if (!previousRecord) {
    return undefined;
  }

  try {
    return parseRemoteRecord(entity, previousRecord);
  } catch {
    return undefined;
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
    last_synced_at: getRecordSync(record)?.lastSyncedAt,
    last_synced_by_device_id: getRecordSync(record)?.lastSyncedByDeviceId,
    has_conflict: Boolean(getRecordSync(record)?.conflictAt),
    conflict_reason: getRecordSync(record)?.conflictReason,
  };
}

function toRemoteTombstoneRow(
  entity: SyncEntity,
  recordId: string,
  deletedAt: string,
  ownerUserId: string,
  previousRecord?: Readonly<Record<string, unknown>>
): SupabaseRecordRow {
  return {
    user_id: ownerUserId,
    entity,
    record_id: recordId,
    payload: createSupabaseRecordTombstonePayload(
      deletedAt,
      previousRecord
    ) as Record<string, unknown>,
    updated_at: deletedAt,
    created_at:
      typeof previousRecord?.createdAt === "string"
        ? previousRecord.createdAt
        : deletedAt,
    last_synced_at: deletedAt,
    has_conflict: false,
  };
}

function replaceRemoteRows(
  remoteRows: SupabaseRecordRow[],
  replacements: ReadonlyArray<SupabaseRecordRow>
) {
  replacements.forEach((replacement) => {
    for (let index = remoteRows.length - 1; index >= 0; index -= 1) {
      const existing = remoteRows[index];
      if (
        existing.entity === replacement.entity &&
        existing.record_id === replacement.record_id
      ) {
        remoteRows.splice(index, 1);
      }
    }
    remoteRows.push(replacement);
  });
}

function getConflictRecordTitle(record: SyncableRecord): string {
  if ("content" in record) {
    return record.content;
  }

  return record.title;
}

function getRemoteDeviceLabel(
  remoteRecord: SyncableRecord,
  localDeviceId: string
): string {
  const remoteDeviceId = getRecordSync(remoteRecord)?.lastSyncedByDeviceId;

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
    conflictAt: getRecordSync(localRecord)?.conflictAt ?? remoteRecord.updatedAt,
    conflictReason: getRecordSync(localRecord)?.conflictReason,
    localUpdatedAt: localRecord.updatedAt,
    localLastSyncedAt: getRecordSync(localRecord)?.lastSyncedAt,
    localDeviceId,
    localDeviceLabel,
    remoteUpdatedAt: remoteRecord.updatedAt,
    remoteLastSyncedAt: getRecordSync(remoteRecord)?.lastSyncedAt,
    remoteDeviceId: getRecordSync(remoteRecord)?.lastSyncedByDeviceId,
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
        ? "Personal Manual entries can sync on approved devices while keeping local-first editing and explicit conflict review."
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
    remoteRows
      .filter((row) => !isSupabaseRecordTombstone(row.payload))
      .map((row) => [
        row.record_id,
        parseRemoteRecord(entity, row.payload),
      ])
  );
  const remoteTombstones = new Map(
    remoteRows
      .filter((row) => isSupabaseRecordTombstone(row.payload))
      .map((row) => [
        row.record_id,
        row,
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
    ...remoteTombstones.keys(),
  ]);

  allRecordIds.forEach((recordId) => {
    const localRecord = localRecords.get(recordId);
    const remoteRecord = remoteRecords.get(recordId);
    const remoteTombstone = remoteTombstones.get(recordId);

    if (remoteTombstone) {
      if (!localRecord) {
        return;
      }

      if (isRecordDirty(localRecord)) {
        const previousRecord = parseTombstonePreviousRecord(
          entity,
          remoteTombstone.payload
        );
        if (previousRecord) {
          const conflictedRecord = withConflictMetadata(
            localRecord,
            ownerUserId,
            syncAt
          );
          nextRecords.set(recordId, conflictedRecord);
          if (!recordsMatch(localRecord, conflictedRecord)) {
            changedLocalRecords += 1;
          }
        }
        conflictCount += 1;
        return;
      }

      nextRecords.delete(recordId);
      changedLocalRecords += 1;
      return;
    }

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
        getRecordSync(remoteRecord)?.lastSyncedByDeviceId ?? deviceId
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
      getRecordSync(remoteRecord)?.lastSyncedByDeviceId ?? deviceId
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
  private readonly authSessionSource: SyncAuthSessionSource;
  private readonly idTokenProvider: Pick<GoogleAuthRuntime, "getIdToken"> | null;
  private readonly client: SupabaseClientFacade | null;
  private readonly backupStorage: BackupStorage | null;
  private readonly mutationOutboxRepository: MutationOutboxRepository | null;
  private readonly listeners = new Set<SyncStateListener>();
  private authSessionSubscription: AuthSessionSubscription | null = null;
  private preferenceChangeListener: (() => void) | null = null;
  private isActivated = false;
  private internalPreferenceEventSuppressionDepth = 0;
  private syncInFlight: Promise<SyncResult> | null = null;
  private conflictSnapshot: ReadonlyArray<SyncConflictRecord> = [];
  private lastKnownStatus: SyncStatus = createLocalOnlyStatus(
    "AliOS is currently running only on this device."
  );

  constructor(dependencies: SyncProviderDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.getStorage = dependencies.getStorage ?? getPreferenceStorage;
    const runtime = dependencies.runtime ?? googleAuthRuntime;
    this.authSessionSource = dependencies.authProvider ?? {
      getCurrentSession: async () => runtime.getSession(),
      subscribe: (listener) => runtime.subscribe(listener),
    };
    this.idTokenProvider = dependencies.idTokenProvider ?? runtime ?? null;
    this.client =
      dependencies.client ??
      dependencies.createClient?.() ??
      createSupabaseClientFromConfiguration();
    this.backupStorage = dependencies.backupStorage ?? null;
    this.mutationOutboxRepository =
      dependencies.mutationOutboxRepository ?? null;
  }

  activate() {
    if (this.isActivated) {
      return;
    }

    this.isActivated = true;
    this.authSessionSubscription = this.authSessionSource.subscribe(() => {
      void this.handleAuthSessionChange();
    });

    if (typeof window !== "undefined") {
      this.preferenceChangeListener = () => {
        void this.handlePreferenceChange();
      };
      window.addEventListener("storage", this.preferenceChangeListener);
      window.addEventListener(
        LOCAL_PREFERENCE_CHANGE_EVENT,
        this.preferenceChangeListener
      );
      window.addEventListener(
        USER_DATA_SYNC_TRIGGER_EVENT,
        this.preferenceChangeListener
      );
    }
  }

  deactivate() {
    if (!this.isActivated) {
      return;
    }

    this.isActivated = false;
    this.authSessionSubscription?.unsubscribe();
    this.authSessionSubscription = null;

    if (typeof window !== "undefined" && this.preferenceChangeListener) {
      window.removeEventListener("storage", this.preferenceChangeListener);
      window.removeEventListener(
        LOCAL_PREFERENCE_CHANGE_EVENT,
        this.preferenceChangeListener
      );
      window.removeEventListener(
        USER_DATA_SYNC_TRIGGER_EVENT,
        this.preferenceChangeListener
      );
    }
    this.preferenceChangeListener = null;
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.client) {
      return createLocalOnlyStatus(
        "Sync stays disabled until Supabase environment variables are configured."
      );
    }

    const runtimeSession = await this.authSessionSource.getCurrentSession();
    const connectedSession = await this.ensureRemoteSession(false);

    if (!this.isSyncEnabled()) {
      const manualPreparation =
        this.backupStorage
          ? buildManualPreparationStatus(await this.backupStorage.readAll())
          : createEmptyManualPreparationStatus();
      const connectedUserId =
        connectedSession?.user?.id ??
        (runtimeSession.status === "authenticated" ? runtimeSession.user?.userId : undefined);
      const status: SyncStatus = {
        mode: "local-only",
        provider: "supabase",
        enabled: false,
        connectedUserId,
        scopes: [],
        categoryStatuses: createCategoryStatuses(undefined, false, manualPreparation),
        manualPreparation,
        connectedDevices: [],
        detail:
          connectedUserId
            ? "An account is connected on this device, but sync stays off until you explicitly enable it."
            : "Sign in on this device before you enable sync.",
      };
      return status;
    }
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
      if (runtimeSession.status !== "authenticated") {
        this.setSyncEnabled(false);
      }

      return createLocalOnlyStatus("Sign in on this device to connect sync.");
    }

    const device = getOrCreateDeviceIdentity(this.getStorage());
    const status: SyncStatus = {
      mode: metadata.lastOutcome === "error" ? "error" : "ready",
      provider: "supabase",
      enabled: true,
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
          ? "AliOS sync is connected for preferences, tasks, routines, projects, goals, finance, and Personal Manual records on this device."
          : "AliOS sync is connected for low-risk preferences on this device."),
    };
    return status;
  }

  async syncNow(): Promise<SyncResult> {
    if (this.syncInFlight) {
      return this.syncInFlight;
    }

    this.setSyncEnabled(true);

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

    const remoteTombstone = isSupabaseRecordTombstone(remoteRow.payload)
      ? remoteRow.payload
      : undefined;
    const remoteRecord = remoteTombstone
      ? parseTombstonePreviousRecord(input.entity, remoteRow.payload)
      : parseRemoteRecord(input.entity, remoteRow.payload);
    if (!remoteRecord) {
      throw new Error(
        "AliOS could not load the previous record version for this tombstone conflict."
      );
    }
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
            getRecordSync(remoteRecord)?.lastSyncedByDeviceId ??
              context.device.deviceId
          );

    if (input.resolution === "keep-remote" && remoteTombstone) {
      entityRecords.delete(input.recordId);
    } else {
      entityRecords.set(input.recordId, resolvedRecord);
    }
    applyEntityRecordMap(context.localData, input.entity, entityRecords);

    const client = this.client;
    if (!client) {
      throw new Error("AliOS sync is unavailable on this device.");
    }

    const upsertResult =
      input.resolution === "keep-remote" && remoteTombstone
        ? client.records.tombstone
          ? await client.records.tombstone({
              table: SUPABASE_SYNC_RECORDS_TABLE,
              userId: context.ownerUserId,
              entity: input.entity,
              recordId: input.recordId,
              deletedAt: remoteTombstone.deletedAt,
              previousRecord: remoteTombstone.previousRecord,
            })
          : await client.records.upsert({
              table: SUPABASE_SYNC_RECORDS_TABLE,
              rows: [remoteRow],
            })
        : await client.records.upsert({
            table: SUPABASE_SYNC_RECORDS_TABLE,
            rows: [toRemoteRow(input.entity, resolvedRecord, context.ownerUserId)],
          });

    if (upsertResult.error) {
      throw upsertResult.error;
    }

    await this.backupStorage?.replaceAll(context.localData, {
      preserveMutationOutbox: true,
    });

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

  private async handleAuthSessionChange() {
    const session = await this.authSessionSource.getCurrentSession();
    if (session.status === "authenticated" && this.isSyncEnabled()) {
      void this.syncNow();
      return;
    }

    if (session.status === "unauthenticated" || session.status === "error") {
      this.setSyncEnabled(false);
      void this.disconnectRemoteSession().finally(() => {
        this.emitStatus(
          createLocalOnlyStatus("Sign in on this device to connect sync.")
        );
      });
    }
  }

  private async handlePreferenceChange() {
    if (!this.isSyncEnabled()) {
      return;
    }

    if (this.internalPreferenceEventSuppressionDepth > 0) {
      return;
    }

    try {
      const connectedSession = await this.ensureRemoteSession(false);
      if (connectedSession?.user) {
        void this.syncNow();
        return;
      }

      const session = await this.authSessionSource.getCurrentSession();
      if (session.status === "authenticated") {
        void this.syncNow();
      }
    } catch {
      // Leave the current local data in place when a background sync check fails.
    }
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
        remoteRows
          .filter((row) => !isSupabaseRecordTombstone(row.payload))
          .map((row) => [
            row.record_id,
            parseRemoteRecord(entity, row.payload),
          ])
      );
      const remoteTombstones = new Map(
        remoteRows
          .filter((row) => isSupabaseRecordTombstone(row.payload))
          .map((row) => [row.record_id, row])
      );

      localRecords.forEach((localRecord, recordId) => {
        if (!getRecordSync(localRecord)?.conflictAt) {
          return;
        }

        const remoteRecord =
          remoteRecords.get(recordId) ??
          (remoteTombstones.has(recordId)
            ? parseTombstonePreviousRecord(
                entity,
                remoteTombstones.get(recordId)?.payload ?? {}
              )
            : undefined);
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

  private async processMutationOutboxEntry(
    entry: MutationOutboxEntry,
    localData: AliosBackupData,
    remoteRows: SupabaseRecordRow[],
    ownerUserId: string,
    syncAt: string,
    deviceId: string
  ) {
    const client = this.client;
    if (!client) {
      throw new Error("AliOS sync is unavailable on this device.");
    }

    const currentEntityRows = remoteRows.filter(
      (row) => row.entity === entry.entity
    );

    if (entry.operation === "delete") {
      const deletedAt = entry.deletedAt ?? syncAt;
      const previousRecord = entry.payload;
      const currentRemoteRow = currentEntityRows.find(
        (row) => row.record_id === entry.recordId
      );
      if (
        currentRemoteRow &&
        !isSupabaseRecordTombstone(currentRemoteRow.payload) &&
        previousRecord
      ) {
        const currentRemoteRecord = parseRemoteRecord(
          entry.entity,
          currentRemoteRow.payload
        );
        const deletedRecord = parseRemoteRecord(entry.entity, previousRecord);
        if (!recordsMatch(currentRemoteRecord, deletedRecord)) {
          throw new MutationOutboxConflictError(
            `The deleted ${entry.entity} record changed remotely and needs conflict review.`
          );
        }
      }

      const tombstoneRow = toRemoteTombstoneRow(
        entry.entity,
        entry.recordId,
        deletedAt,
        ownerUserId,
        previousRecord
      );
      const mergeRows = [
        ...currentEntityRows.filter((row) => row.record_id !== entry.recordId),
        tombstoneRow,
      ];
      const outcome = mergeEntityRecords(
        entry.entity,
        localData,
        mergeRows,
        ownerUserId,
        syncAt,
        deviceId
      );
      if (outcome.conflictCount > 0) {
        throw new MutationOutboxConflictError(
          `The deleted ${entry.entity} record needs conflict review.`
        );
      }

      const tombstoneResult = client.records.tombstone
        ? await client.records.tombstone({
            table: SUPABASE_SYNC_RECORDS_TABLE,
            userId: ownerUserId,
            entity: entry.entity,
            recordId: entry.recordId,
            deletedAt,
            previousRecord,
          })
        : await client.records.upsert({
            table: SUPABASE_SYNC_RECORDS_TABLE,
            rows: [tombstoneRow],
          });
      if (tombstoneResult.error) {
        throw tombstoneResult.error;
      }

      replaceRemoteRows(remoteRows, [tombstoneRow]);
      return;
    }

    const outcome = mergeEntityRecords(
      entry.entity,
      localData,
      currentEntityRows,
      ownerUserId,
      syncAt,
      deviceId
    );
    if (outcome.conflictCount > 0) {
      throw new MutationOutboxConflictError(
        `The ${entry.entity} record needs conflict review.`
      );
    }

    const upsertResult = await client.records.upsert({
      table: SUPABASE_SYNC_RECORDS_TABLE,
      rows: outcome.uploadedRows,
    });
    if (upsertResult.error) {
      throw upsertResult.error;
    }

    replaceRemoteRows(remoteRows, outcome.uploadedRows);
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

    const connectedSession = await this.ensureRemoteSession(true);
    if (!connectedSession?.user) {
      const status = createLocalOnlyStatus(
        "Sign in on this device to connect sync."
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
        ? "AliOS is syncing preferences, tasks, routines, projects, goals, finance, and Personal Manual records for this device."
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
      const storage = this.getStorage();
      const device = getOrCreateDeviceIdentity(storage);
      const localSnapshot = readLocalPreferenceSnapshot(storage);
      const remoteSnapshot = readRemotePreferenceSnapshot(
        connectedSession.user.user_metadata as Record<string, unknown> | undefined
      );
      const mergedSnapshot = mergePreferenceSnapshots(localSnapshot, remoteSnapshot);
      this.internalPreferenceEventSuppressionDepth += 1;
      let localPreferenceChanges = 0;
      try {
        localPreferenceChanges = applyRemotePreferencesToLocal(
          storage,
          localSnapshot,
          mergedSnapshot
        );
      } finally {
        this.internalPreferenceEventSuppressionDepth = Math.max(
          0,
          this.internalPreferenceEventSuppressionDepth - 1
        );
      }
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
      let mutationOutboxResult: MutationOutboxProcessResult = {
        acknowledged: 0,
        retryWaiting: 0,
        blockedConflicts: 0,
      };

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

        const remoteRows = [...remoteRecordsResult.data];
        if (this.mutationOutboxRepository) {
          const mutationOutboxProcessor = new MutationOutboxProcessor({
            repository: this.mutationOutboxRepository,
            now: this.now,
            processEntry: (entry) =>
              this.processMutationOutboxEntry(
                entry,
                localData,
                remoteRows,
                connectedSession.user.id,
                syncAt,
                device.deviceId
              ),
          });
          mutationOutboxResult =
            await mutationOutboxProcessor.processPending();
          conflictCount += mutationOutboxResult.blockedConflicts;
        }

        const uploadedRows: SupabaseRecordRow[] = [];

        USER_DATA_SCOPES.forEach((entity) => {
          const entityRows = remoteRows.filter((row) => row.entity === entity);
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

        if (
          localUserDataChanges > 0 ||
          conflictCount > 0 ||
          mutationOutboxResult.acknowledged > 0
        ) {
          await this.backupStorage.replaceAll(localData, {
            preserveMutationOutbox: true,
          });
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
          ? "AliOS synced preferences and safe records, but some task, routine, project, goal, finance, or Personal Manual changes now need conflict review."
          : this.backupStorage
            ? "AliOS synced preferences, tasks, routines, projects, goals, finance, and Personal Manual records for this device."
            : "AliOS synced appearance, language, and interface preferences for this device.";

      const status: SyncStatus = {
        mode: conflictCount > 0 ? "error" : "ready",
        provider: "supabase",
        enabled: true,
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
        failureReason:
          conflictCount > 0 ||
          mutationOutboxResult.retryWaiting > 0
            ? detail
            : undefined,
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
        enabled: this.isSyncEnabled(),
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

    if (!this.idTokenProvider) {
      return null;
    }

    const idToken = this.idTokenProvider.getIdToken();
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

  private isSyncEnabled() {
    return this.getStorage()?.getItem(SUPABASE_SYNC_ENABLED_STORAGE_KEY) === "true";
  }

  private setSyncEnabled(enabled: boolean) {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    try {
      if (enabled) {
        storage.setItem(SUPABASE_SYNC_ENABLED_STORAGE_KEY, "true");
      } else {
        storage.removeItem(SUPABASE_SYNC_ENABLED_STORAGE_KEY);
      }
    } catch {
      // Keep sync opt-in local and best-effort only.
    }
  }
}

export const supabasePreferenceSyncProvider =
  new SupabasePreferenceSyncProvider();
