import { googleAuthRuntime, type GoogleAuthRuntime } from "@/core/auth/googleAuthRuntime";
import { CALENDAR_DISPLAY_STORAGE_KEY } from "@/shared/date";
import { LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import {
  ACCENT_COLOR_STORAGE_KEY,
  APPEARANCE_STORAGE_KEY,
  LOCAL_PREFERENCE_CHANGE_EVENT,
} from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  notifyPreferenceChanged,
  writeStoredPreference,
  type PreferenceStorage,
} from "@/shared/preferences/storage";
import { VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY } from "@/features/home/dashboardLayout";
import { HOME_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/home/homeCollapsedSections";
import { FINANCE_COLLAPSED_SECTIONS_STORAGE_KEY } from "@/features/finance/financeSections";

import type { SyncDeviceIdentity, SyncLastOutcome } from "./syncMetadata";
import type { SyncProvider, SyncResult, SyncStatus } from "./types";
import {
  SUPABASE_SYNC_DEVICE_ID_STORAGE_KEY,
  SUPABASE_SYNC_METADATA_STORAGE_KEY,
  getSupabaseSyncConfiguration,
} from "./supabaseSyncConfig";
import {
  createSupabaseBrowserClient,
  type SupabaseBrowserClient,
  type SupabaseSession,
} from "./supabaseClient";

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

type SyncedPreferenceKey = (typeof SYNCED_PREFERENCE_KEYS)[number];
type SyncedPreferencePayload = Partial<Record<SyncedPreferenceKey, string>>;

type SyncMetadataRecord = Readonly<{
  backendUserId?: string;
  lastSyncedAt?: string;
  lastAttemptAt?: string;
  lastOutcome: SyncLastOutcome;
  detail?: string;
}>;

type SupabaseSyncUserMetadata = Readonly<{
  alios_preferences?: SyncedPreferencePayload;
  alios_sync?: Readonly<{
    scope: "preferences";
    deviceId: string;
    deviceLabel: string;
    lastSyncedAt: string;
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

type SupabaseClientFacade = Readonly<{
  auth: SupabaseAuthFacade;
}>;

type SyncProviderDependencies = Readonly<{
  client?: SupabaseClientFacade;
  createClient?: () => SupabaseClientFacade | null;
  getStorage?: () => PreferenceStorage | null;
  now?: () => Date;
  runtime?: GoogleAuthRuntime;
}>;

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
    detail,
  };
}

export class SupabasePreferenceSyncProvider implements SyncProvider {
  readonly name = "supabase";

  private readonly now: () => Date;
  private readonly getStorage: () => PreferenceStorage | null;
  private readonly runtime: GoogleAuthRuntime;
  private readonly client: SupabaseClientFacade | null;
  private syncInFlight: Promise<SyncResult> | null = null;

  constructor(dependencies: SyncProviderDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.getStorage = dependencies.getStorage ?? getPreferenceStorage;
    this.runtime = dependencies.runtime ?? googleAuthRuntime;
    this.client =
      dependencies.client ??
      dependencies.createClient?.() ??
      createSupabaseClientFromConfiguration();

    this.runtime.subscribe((session) => {
      if (session.status === "authenticated") {
        void this.syncNow();
        return;
      }

      if (session.status === "unauthenticated" || session.status === "error") {
        void this.disconnectRemoteSession();
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
    }
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.client) {
      return createLocalOnlyStatus(
        "Preference sync stays disabled until Supabase environment variables are configured."
      );
    }

    const authSession = this.runtime.getSession();
    if (authSession.status !== "authenticated" || !authSession.user) {
      return createLocalOnlyStatus(
        "Sign in with Google on this device to connect low-risk preference sync."
      );
    }

    const connectedSession = await this.ensureRemoteSession(false);
    if (!connectedSession?.user) {
      const metadata = this.readMetadata();
      return {
        mode: "local-only",
        provider: "supabase",
        lastSyncedAt: metadata.lastSyncedAt,
        lastAttemptAt: metadata.lastAttemptAt,
        detail:
          metadata.detail ??
          "AliOS has not connected this device to preference sync yet.",
      };
    }

    const metadata = this.readMetadata();
    const device = getOrCreateDeviceIdentity(this.getStorage());

    return {
      mode: "ready",
      provider: "supabase",
      connectedUserId: connectedSession.user.id,
      deviceId: device.deviceId,
      deviceLabel: device.label,
      lastSyncedAt: metadata.lastSyncedAt,
      lastAttemptAt: metadata.lastAttemptAt,
      detail: metadata.lastSyncedAt
        ? "Low-risk preferences are connected through Supabase for this device."
        : "Supabase preference sync is connected and ready for this device.",
    };
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

  private async runSync(): Promise<SyncResult> {
    if (!this.client) {
      return {
        changedRecords: 0,
        status: createLocalOnlyStatus(
          "Preference sync stays disabled until Supabase environment variables are configured."
        ),
      };
    }

    const authSession = this.runtime.getSession();
    if (authSession.status !== "authenticated" || !authSession.user) {
      return {
        changedRecords: 0,
        status: createLocalOnlyStatus(
          "Sign in with Google on this device to connect low-risk preference sync."
        ),
      };
    }

    const attemptAt = this.now().toISOString();
    this.writeMetadata({
      ...this.readMetadata(),
      lastAttemptAt: attemptAt,
      detail: "AliOS is syncing low-risk preferences for this device.",
    });

    try {
      const connectedSession = await this.ensureRemoteSession(true);

      if (!connectedSession?.user) {
        const status = createLocalOnlyStatus(
          "AliOS could not connect this Google session to Supabase preference sync."
        );
        this.writeMetadata({
          ...this.readMetadata(),
          lastAttemptAt: attemptAt,
          lastOutcome: "error",
          detail: status.detail,
        });
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
      const localChanges = applyRemotePreferencesToLocal(
        storage,
        localSnapshot,
        mergedSnapshot
      );
      const remoteChanges = countChangedPreferences(
        mergedSnapshot,
        remoteSnapshot
      );
      const syncAt = this.now().toISOString();

      if (remoteChanges > 0) {
        const existingMetadata =
          (connectedSession.user.user_metadata as Record<string, unknown> | undefined) ??
          {};
        const remoteMetadata: SupabaseSyncUserMetadata = {
          ...existingMetadata,
          alios_preferences: mergedSnapshot,
          alios_sync: {
            scope: "preferences",
            deviceId: device.deviceId,
            deviceLabel: device.label,
            lastSyncedAt: syncAt,
          },
        };
        const { data, error } = await this.client.auth.updateUser({
          data: remoteMetadata as Record<string, unknown>,
        });

        if (error) {
          throw error;
        }

        const syncedUser = data.user ?? connectedSession.user;
        this.writeMetadata({
          backendUserId: syncedUser.id,
          lastAttemptAt: attemptAt,
          lastSyncedAt: syncAt,
          lastOutcome: "success",
          detail:
            "AliOS synced appearance, language, and interface preferences for this device.",
        });

        return {
          changedRecords: localChanges + remoteChanges,
          status: {
            mode: "ready",
            provider: "supabase",
            connectedUserId: syncedUser.id,
            deviceId: device.deviceId,
            deviceLabel: device.label,
            lastSyncedAt: syncAt,
            lastAttemptAt: attemptAt,
            detail:
              "AliOS synced appearance, language, and interface preferences for this device.",
          },
        };
      }

      const status: SyncStatus = {
        mode: "ready",
        provider: "supabase",
        connectedUserId: connectedSession.user.id,
        deviceId: device.deviceId,
        deviceLabel: device.label,
        lastSyncedAt: syncAt,
        lastAttemptAt: attemptAt,
        detail:
          "AliOS synced appearance, language, and interface preferences for this device.",
      };

      this.writeMetadata({
        backendUserId: connectedSession.user.id,
        lastAttemptAt: attemptAt,
        lastSyncedAt: syncAt,
        lastOutcome: "success",
        detail: status.detail,
      });

      return {
        changedRecords: localChanges + remoteChanges,
        status,
      };
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : "AliOS could not complete preference sync.";
      this.writeMetadata({
        ...this.readMetadata(),
        lastAttemptAt: attemptAt,
        lastOutcome: "error",
        detail,
      });

      return {
        changedRecords: 0,
        status: {
          mode: "error",
          provider: "supabase",
          lastAttemptAt: attemptAt,
          detail,
        },
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
