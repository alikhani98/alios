export type SupabaseSessionUser = Readonly<{
  id: string;
  user_metadata?: Record<string, unknown>;
}>;

export type SupabaseSession = Readonly<{
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: SupabaseSessionUser;
}>;

export type SupabaseRecordRow = Readonly<{
  user_id: string;
  entity: string;
  record_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
  created_at: string;
  last_synced_at?: string;
  last_synced_by_device_id?: string;
  has_conflict?: boolean;
  conflict_reason?: string;
}>;

export type SupabaseBrowserClient = Readonly<{
  auth: {
    getSession: () => Promise<{
      data: { session: SupabaseSession | null };
      error: Error | null;
    }>;
    signUpWithPassword: (input: {
      email: string;
      password: string;
      data?: Record<string, unknown>;
    }) => Promise<{
      data: {
        session: SupabaseSession | null;
        user: SupabaseSessionUser | null;
      };
      error: Error | null;
    }>;
    signInWithPassword: (input: {
      email: string;
      password: string;
    }) => Promise<{
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
    refreshSession: () => Promise<{
      data: { session: SupabaseSession | null };
      error: Error | null;
    }>;
    updateUser: (attributes: {
      data: Record<string, unknown>;
    }) => Promise<{
      data: { user: SupabaseSessionUser | null };
      error: Error | null;
    }>;
    signOut: () => Promise<{ error: Error | null }>;
  };
  records: {
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
  };
}>;

type SupabaseAuthTokenResponse = Readonly<{
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: SupabaseSessionUser;
}>;

type SupabaseUserResponse = Readonly<{
  user?: SupabaseSessionUser;
}>;

type SupabaseSignUpResponse = Readonly<{
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: SupabaseSessionUser;
}>;

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredSession(storageKey: string): SupabaseSession | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SupabaseSession>;
    if (
      typeof parsed.access_token !== "string" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      return null;
    }

    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
      user: {
        id: parsed.user.id,
        user_metadata: parsed.user.user_metadata,
      },
    };
  } catch {
    return null;
  }
}

function writeStoredSession(storageKey: string, session: SupabaseSession | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    if (!session) {
      storage.removeItem(storageKey);
      return;
    }

    storage.setItem(storageKey, JSON.stringify(session));
  } catch {
    // Keep runtime sync best-effort if session storage is unavailable.
  }
}

function toError(error: unknown, fallback: string) {
  return error instanceof Error
    ? error
    : new Error(typeof error === "string" ? error : fallback);
}

function toSupabaseSession(
  payload:
    | SupabaseAuthTokenResponse
    | SupabaseSignUpResponse
    | null
    | undefined
): SupabaseSession | null {
  if (
    !payload ||
    typeof payload.access_token !== "string" ||
    !payload.user ||
    typeof payload.user.id !== "string"
  ) {
    return null;
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_at,
    user: {
      id: payload.user.id,
      user_metadata: payload.user.user_metadata,
    },
  };
}

function isSessionExpired(session: SupabaseSession | null): boolean {
  if (!session?.expires_at) {
    return false;
  }

  return session.expires_at * 1000 <= Date.now();
}

function encodeInFilter(values: ReadonlyArray<string>) {
  return `(${values.map((value) => `"${value}"`).join(",")})`;
}

async function parseErrorResponse(
  response: Response,
  fallback: string
): Promise<Error> {
  try {
    const payload = (await response.json()) as
      | { msg?: string; error_description?: string; message?: string }
      | null;
    return new Error(
      payload?.msg ??
        payload?.error_description ??
        payload?.message ??
        fallback
    );
  } catch {
    return new Error(fallback);
  }
}

export function createSupabaseBrowserClient(
  url: string,
  anonKey: string,
  authStorageKey: string
): SupabaseBrowserClient {
  const baseHeaders = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };

  return {
    auth: {
      async getSession() {
        const currentSession = readStoredSession(authStorageKey);
        if (!currentSession) {
          return {
            data: { session: null },
            error: null,
          };
        }

        if (!isSessionExpired(currentSession) || !currentSession.refresh_token) {
          return {
            data: { session: currentSession },
            error: null,
          };
        }

        try {
          const response = await fetch(
            `${url}/auth/v1/token?grant_type=refresh_token`,
            {
              method: "POST",
              headers: baseHeaders,
              body: JSON.stringify({
                refresh_token: currentSession.refresh_token,
              }),
            }
          );

          if (!response.ok) {
            writeStoredSession(authStorageKey, null);
            return {
              data: { session: null },
              error: await parseErrorResponse(
                response,
                "Supabase session refresh failed."
              ),
            };
          }

          const payload =
            (await response.json()) as SupabaseAuthTokenResponse;
          const nextSession = toSupabaseSession(payload);

          if (!nextSession) {
            writeStoredSession(authStorageKey, null);
            return {
              data: { session: null },
              error: new Error(
                "Supabase session refresh did not return a usable session."
              ),
            };
          }

          writeStoredSession(authStorageKey, nextSession);
          return {
            data: { session: nextSession },
            error: null,
          };
        } catch (error) {
          writeStoredSession(authStorageKey, null);
          return {
            data: { session: null },
            error: toError(error, "Supabase session refresh failed."),
          };
        }
      },

      async signUpWithPassword({ email, password, data }) {
        try {
          const response = await fetch(`${url}/auth/v1/signup`, {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              email,
              password,
              data,
            }),
          });

          if (!response.ok) {
            return {
              data: { session: null, user: null },
              error: await parseErrorResponse(
                response,
                "Supabase email account creation failed."
              ),
            };
          }

          const payload = (await response.json()) as SupabaseSignUpResponse;
          const session = toSupabaseSession(payload);
          const user =
            payload.user && typeof payload.user.id === "string"
              ? {
                  id: payload.user.id,
                  user_metadata: payload.user.user_metadata,
                }
              : null;

          writeStoredSession(authStorageKey, session);
          return {
            data: { session, user },
            error: null,
          };
        } catch (error) {
          return {
            data: { session: null, user: null },
            error: toError(error, "Supabase email account creation failed."),
          };
        }
      },

      async signInWithPassword({ email, password }) {
        try {
          const response = await fetch(
            `${url}/auth/v1/token?grant_type=password`,
            {
              method: "POST",
              headers: baseHeaders,
              body: JSON.stringify({
                email,
                password,
              }),
            }
          );

          if (!response.ok) {
            return {
              data: { session: null },
              error: await parseErrorResponse(
                response,
                "Supabase email sign-in failed."
              ),
            };
          }

          const payload =
            (await response.json()) as SupabaseAuthTokenResponse;
          const session = toSupabaseSession(payload);

          if (!session) {
            return {
              data: { session: null },
              error: new Error(
                "Supabase email sign-in did not return a usable session."
              ),
            };
          }

          writeStoredSession(authStorageKey, session);
          return {
            data: { session },
            error: null,
          };
        } catch (error) {
          return {
            data: { session: null },
            error: toError(error, "Supabase email sign-in failed."),
          };
        }
      },

      async refreshSession() {
        const currentSession = readStoredSession(authStorageKey);
        if (!currentSession?.refresh_token) {
          return {
            data: { session: null },
            error: new Error(
              "Supabase session refresh is unavailable without a stored refresh token."
            ),
          };
        }

        try {
          const response = await fetch(
            `${url}/auth/v1/token?grant_type=refresh_token`,
            {
              method: "POST",
              headers: baseHeaders,
              body: JSON.stringify({
                refresh_token: currentSession.refresh_token,
              }),
            }
          );

          if (!response.ok) {
            writeStoredSession(authStorageKey, null);
            return {
              data: { session: null },
              error: await parseErrorResponse(
                response,
                "Supabase session refresh failed."
              ),
            };
          }

          const payload =
            (await response.json()) as SupabaseAuthTokenResponse;
          const nextSession = toSupabaseSession(payload);

          if (!nextSession) {
            writeStoredSession(authStorageKey, null);
            return {
              data: { session: null },
              error: new Error(
                "Supabase session refresh did not return a usable session."
              ),
            };
          }

          writeStoredSession(authStorageKey, nextSession);
          return {
            data: { session: nextSession },
            error: null,
          };
        } catch (error) {
          writeStoredSession(authStorageKey, null);
          return {
            data: { session: null },
            error: toError(error, "Supabase session refresh failed."),
          };
        }
      },

      async signInWithIdToken({ provider, token }) {
        try {
          const response = await fetch(
            `${url}/auth/v1/token?grant_type=id_token`,
            {
              method: "POST",
              headers: baseHeaders,
              body: JSON.stringify({
                provider,
                id_token: token,
              }),
            }
          );

          if (!response.ok) {
            return {
              data: { session: null },
              error: await parseErrorResponse(
                response,
                "Supabase sign-in with Google failed."
              ),
            };
          }

          const payload =
            (await response.json()) as SupabaseAuthTokenResponse;
          const session = toSupabaseSession(payload);

          if (!session) {
            return {
              data: { session: null },
              error: new Error(
                "Supabase sign-in did not return a usable session."
              ),
            };
          }

          writeStoredSession(authStorageKey, session);

          return {
            data: { session },
            error: null,
          };
        } catch (error) {
          return {
            data: { session: null },
            error: toError(error, "Supabase sign-in with Google failed."),
          };
        }
      },

      async updateUser({ data }) {
        const currentSession = readStoredSession(authStorageKey);
        if (!currentSession) {
          return {
            data: { user: null },
            error: new Error(
              "Supabase sync is unavailable until this device has an authenticated session."
            ),
          };
        }

        try {
          const response = await fetch(`${url}/auth/v1/user`, {
            method: "PUT",
            headers: {
              ...baseHeaders,
              Authorization: `Bearer ${currentSession.access_token}`,
            },
            body: JSON.stringify({ data }),
          });

          if (!response.ok) {
            return {
              data: { user: null },
              error: await parseErrorResponse(
                response,
                "Supabase user metadata update failed."
              ),
            };
          }

          const payload = (await response.json()) as SupabaseUserResponse;
          const user =
            payload.user && typeof payload.user.id === "string"
              ? {
                  id: payload.user.id,
                  user_metadata: payload.user.user_metadata,
                }
              : null;

          if (user) {
            writeStoredSession(authStorageKey, {
              ...currentSession,
              user,
            });
          }

          return {
            data: { user },
            error: null,
          };
        } catch (error) {
          return {
            data: { user: null },
            error: toError(error, "Supabase user metadata update failed."),
          };
        }
      },

      async signOut() {
        const currentSession = readStoredSession(authStorageKey);
        writeStoredSession(authStorageKey, null);

        if (!currentSession) {
          return { error: null };
        }

        try {
          await fetch(`${url}/auth/v1/logout`, {
            method: "POST",
            headers: {
              ...baseHeaders,
              Authorization: `Bearer ${currentSession.access_token}`,
            },
          });

          return { error: null };
        } catch (error) {
          return {
            error: toError(error, "Supabase sign-out failed."),
          };
        }
      },
    },
    records: {
      async list({ table, userId, entities }) {
        const currentSession = readStoredSession(authStorageKey);
        if (!currentSession) {
          return {
            data: [],
            error: new Error(
              "Supabase sync is unavailable until this device has an authenticated session."
            ),
          };
        }

        if (entities.length === 0) {
          return { data: [], error: null };
        }

        try {
          const query = new URLSearchParams({
            select:
              "user_id,entity,record_id,payload,updated_at,created_at,last_synced_at,last_synced_by_device_id,has_conflict,conflict_reason",
            user_id: `eq.${userId}`,
            entity: `in.${encodeInFilter(entities)}`,
          });
          const response = await fetch(
            `${url}/rest/v1/${table}?${query.toString()}`,
            {
              method: "GET",
              headers: {
                ...baseHeaders,
                Authorization: `Bearer ${currentSession.access_token}`,
              },
            }
          );

          if (!response.ok) {
            return {
              data: [],
              error: await parseErrorResponse(
                response,
                "Supabase record listing failed."
              ),
            };
          }

          const payload = (await response.json()) as ReadonlyArray<SupabaseRecordRow>;
          return {
            data: Array.isArray(payload) ? payload : [],
            error: null,
          };
        } catch (error) {
          return {
            data: [],
            error: toError(error, "Supabase record listing failed."),
          };
        }
      },

      async upsert({ table, rows }) {
        const currentSession = readStoredSession(authStorageKey);
        if (!currentSession) {
          return {
            data: [],
            error: new Error(
              "Supabase sync is unavailable until this device has an authenticated session."
            ),
          };
        }

        if (rows.length === 0) {
          return { data: [], error: null };
        }

        try {
          const response = await fetch(
            `${url}/rest/v1/${table}?on_conflict=user_id,entity,record_id`,
            {
              method: "POST",
              headers: {
                ...baseHeaders,
                Authorization: `Bearer ${currentSession.access_token}`,
                Prefer: "resolution=merge-duplicates,return=representation",
              },
              body: JSON.stringify(rows),
            }
          );

          if (!response.ok) {
            return {
              data: [],
              error: await parseErrorResponse(
                response,
                "Supabase record upsert failed."
              ),
            };
          }

          const payload = (await response.json()) as ReadonlyArray<SupabaseRecordRow>;
          return {
            data: Array.isArray(payload) ? payload : [],
            error: null,
          };
        } catch (error) {
          return {
            data: [],
            error: toError(error, "Supabase record upsert failed."),
          };
        }
      },
    },
  };
}
