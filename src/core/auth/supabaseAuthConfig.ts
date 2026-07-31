export const SUPABASE_AUTH_STORAGE_KEY = "alios.sync.supabase.auth";

export type SupabaseAuthConfiguration = Readonly<{
  url: string;
  anonKey: string;
  authStorageKey: string;
}>;

export function getSupabaseAuthConfiguration():
  | SupabaseAuthConfiguration
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
    authStorageKey: SUPABASE_AUTH_STORAGE_KEY,
  };
}
