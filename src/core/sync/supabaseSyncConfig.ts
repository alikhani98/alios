import { SUPABASE_AUTH_STORAGE_KEY } from "@/core/auth/supabaseAuthConfig";

export const SUPABASE_SYNC_AUTH_STORAGE_KEY = SUPABASE_AUTH_STORAGE_KEY;
export const SUPABASE_SYNC_METADATA_STORAGE_KEY =
  "alios.sync.supabase.metadata";
export const SUPABASE_SYNC_DEVICE_ID_STORAGE_KEY = "alios.sync.deviceId";
export const SUPABASE_SYNC_RECORDS_TABLE = "alios_sync_records";
export type SupabaseSyncConfiguration = Readonly<{
  url: string;
  anonKey: string;
  authStorageKey: string;
}>;

export function getSupabaseSyncConfiguration():
  | SupabaseSyncConfiguration
  | null {
  const url =
    typeof import.meta !== "undefined"
      ? import.meta.env.VITE_SUPABASE_URL
      : undefined;
  const anonKey =
    typeof import.meta !== "undefined"
      ? import.meta.env.VITE_SUPABASE_ANON_KEY
      : undefined;

  if (
    typeof url !== "string" ||
    url.trim().length === 0 ||
    typeof anonKey !== "string" ||
    anonKey.trim().length === 0
  ) {
    return null;
  }

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    authStorageKey: SUPABASE_SYNC_AUTH_STORAGE_KEY,
  };
}
