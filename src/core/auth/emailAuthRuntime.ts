import { EMAIL_ACCOUNT_PROVIDER_ID } from "@/core/account/types";
import {
  createSupabaseBrowserClient,
  type SupabaseBrowserClient,
  type SupabaseSession,
} from "@/core/sync/supabaseClient";

import { getSupabaseAuthConfiguration } from "./supabaseAuthConfig";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "./types";

type EmailAuthRuntimeDependencies = Readonly<{
  client?: SupabaseBrowserClient | null;
  createClient?: () => SupabaseBrowserClient | null;
  now?: () => Date;
}>;

function toIsoString(date: Date) {
  return date.toISOString();
}

function readMetadataTimestamp(
  metadata: Record<string, unknown>,
  keys: ReadonlyArray<string>
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function createSessionCacheKey(session: SupabaseSession) {
  return [
    session.user.id,
    session.access_token,
    session.refresh_token ?? "",
    session.expires_at ?? "",
  ].join("|");
}

function createSignedOutSession(detail: string): AuthSession {
  return {
    status: "unauthenticated",
    user: null,
    provider: EMAIL_ACCOUNT_PROVIDER_ID,
    detail,
  };
}

function createAuthenticatedSession(
  session: SupabaseSession,
  authenticatedAt: string
): AuthSession {
  const metadata = session.user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name.trim().length > 0
      ? metadata.display_name.trim()
      : typeof metadata.name === "string" && metadata.name.trim().length > 0
        ? metadata.name.trim()
        : typeof metadata.full_name === "string" &&
            metadata.full_name.trim().length > 0
          ? metadata.full_name.trim()
          : typeof metadata.email === "string" && metadata.email.trim().length > 0
            ? metadata.email.trim()
            : session.user.id;
  const email =
    typeof metadata.email === "string" && metadata.email.trim().length > 0
      ? metadata.email.trim()
      : "";
  const createdAt =
    readMetadataTimestamp(metadata, ["created_at", "createdAt"]) ??
    authenticatedAt;
  const updatedAt =
    readMetadataTimestamp(metadata, ["updated_at", "updatedAt"]) ??
    authenticatedAt;

  return {
    status: "authenticated",
    provider: EMAIL_ACCOUNT_PROVIDER_ID,
    user: {
      userId: session.user.id,
      email,
      displayName,
      createdAt: updatedAt,
      updatedAt,
      metadata,
    },
    expiresAt:
      typeof session.expires_at === "number"
        ? toIsoString(new Date(session.expires_at * 1000))
        : undefined,
    detail: "Email account connected on this device.",
  };
}

export class EmailAuthRuntime {
  private readonly listeners = new Set<AuthStateListener>();
  private readonly now: () => Date;
  private readonly createClient: () => SupabaseBrowserClient | null;
  private readonly sessionTimestampCache = new Map<string, string>();
  private client: SupabaseBrowserClient | null;
  private currentSession: AuthSession;
  private hydrationInFlight: Promise<AuthSession> | null = null;

  constructor(dependencies: EmailAuthRuntimeDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    this.createClient =
      dependencies.createClient ??
      (() => {
        const configuration = getSupabaseAuthConfiguration();
        if (!configuration) {
          return null;
        }

        return createSupabaseBrowserClient(
          configuration.url,
          configuration.anonKey,
          configuration.authStorageKey
        );
      });
    this.client = dependencies.client ?? this.createClient();
    this.currentSession = this.client
      ? {
          status: "authenticating",
          user: null,
          provider: EMAIL_ACCOUNT_PROVIDER_ID,
          detail: "AliOS is restoring the email session on this device.",
        }
      : createSignedOutSession(
          "Email sign-in is unavailable until Supabase environment variables are configured."
        );
  }

  isConfigured() {
    return this.client !== null;
  }

  async getSession(): Promise<AuthSession> {
    if (!this.client) {
      this.setSession(
        createSignedOutSession(
          "Email sign-in is unavailable until Supabase environment variables are configured."
        )
      );
      return this.currentSession;
    }

    if (!this.hydrationInFlight) {
      this.hydrationInFlight = this.resolveCurrentSession().finally(() => {
        this.hydrationInFlight = null;
      });
    }

    return this.hydrationInFlight;
  }

  async getUser(): Promise<AuthUser | null> {
    return (await this.getSession()).user;
  }

  async createAccount(input: AuthLoginInput): Promise<AuthLoginResult> {
    if (!this.client) {
      throw new Error(
        "Email sign-in is unavailable until Supabase environment variables are configured."
      );
    }

    const email = input.email?.trim();
    const password = input.password?.trim();

    if (!email || !password) {
      throw new Error("Email and password are required to create an account.");
    }

    this.setSession({
      status: "authenticating",
      user: this.currentSession.user,
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      detail: "AliOS is creating your email account.",
    });

    const result = await this.client.auth.signUpWithPassword({
      email,
      password,
      data: {
        email,
        ...(input.metadata ?? {}),
      },
    });

    if (result.error) {
      this.setSession({
        status: "error",
        user: null,
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        detail: result.error.message,
      });
      throw result.error;
    }

    if (result.data.session) {
      const session = createAuthenticatedSession(
        result.data.session,
        this.resolveAuthenticatedAt(result.data.session)
      );
      this.setSession(session);
      return { session };
    }

    const verificationSession = createSignedOutSession(
      "AliOS created the account. Verify your email, then sign in on this device."
    );
    this.setSession(verificationSession);
    return {
      session: verificationSession,
      requiresVerification: true,
    };
  }

  async login(input: AuthLoginInput): Promise<AuthLoginResult> {
    if (!this.client) {
      throw new Error(
        "Email sign-in is unavailable until Supabase environment variables are configured."
      );
    }

    const email = input.email?.trim();
    const password = input.password?.trim();

    if (!email || !password) {
      throw new Error("Email and password are required to sign in.");
    }

    this.setSession({
      status: "authenticating",
      user: this.currentSession.user,
      provider: EMAIL_ACCOUNT_PROVIDER_ID,
      detail: "AliOS is signing you in with email.",
    });

    const result = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error || !result.data.session) {
      const error =
        result.error ??
        new Error("Supabase email sign-in did not return a usable session.");
      this.setSession({
        status: "error",
        user: null,
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        detail: error.message,
      });
      throw error;
    }

    const session = createAuthenticatedSession(
      result.data.session,
      this.resolveAuthenticatedAt(result.data.session)
    );
    this.setSession(session);
    return { session };
  }

  async logout(): Promise<void> {
    if (!this.client) {
      this.setSession(
        createSignedOutSession(
          "Email sign-in is unavailable until Supabase environment variables are configured."
        )
      );
      return;
    }

    const result = await this.client.auth.signOut();
    if (result.error) {
      throw result.error;
    }

    this.setSession(createSignedOutSession("Email account signed out on this device."));
  }

  async refreshSession(): Promise<AuthSession> {
    if (!this.client) {
      const signedOutSession = createSignedOutSession(
        "Email sign-in is unavailable until Supabase environment variables are configured."
      );
      this.setSession(signedOutSession);
      return signedOutSession;
    }

    const result = await this.client.auth.refreshSession();
    if (result.error) {
      const errorSession: AuthSession = {
        status: "error",
        user: null,
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        detail: result.error.message,
      };
      this.setSession(errorSession);
      return errorSession;
    }

    const nextSession = result.data.session
      ? createAuthenticatedSession(
          result.data.session,
          this.resolveAuthenticatedAt(result.data.session)
        )
      : createSignedOutSession("No email account is signed in on this device.");
    this.setSession(nextSession);
    return nextSession;
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    this.listeners.add(listener);
    listener(this.currentSession);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  private setSession(nextSession: AuthSession) {
    this.currentSession = nextSession;
    this.listeners.forEach((listener) => {
      listener(nextSession);
    });
  }

  private resolveAuthenticatedAt(session: SupabaseSession) {
    const cacheKey = createSessionCacheKey(session);
    const cachedTimestamp = this.sessionTimestampCache.get(cacheKey);
    if (cachedTimestamp) {
      return cachedTimestamp;
    }

    const authenticatedAt = toIsoString(this.now());
    this.sessionTimestampCache.set(cacheKey, authenticatedAt);
    return authenticatedAt;
  }

  private async resolveCurrentSession(): Promise<AuthSession> {
    if (!this.client) {
      const signedOutSession = createSignedOutSession(
        "Email sign-in is unavailable until Supabase environment variables are configured."
      );
      this.setSession(signedOutSession);
      return signedOutSession;
    }

    const callbackRestoreResult = await this.client.auth.restoreSessionFromUrlHash();
    if (callbackRestoreResult.error) {
      const errorSession: AuthSession = {
        status: "error",
        user: null,
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        detail: callbackRestoreResult.error.message,
      };
      this.setSession(errorSession);
      return errorSession;
    }

    if (callbackRestoreResult.data.session) {
      const restoredSession = createAuthenticatedSession(
        callbackRestoreResult.data.session,
        this.resolveAuthenticatedAt(callbackRestoreResult.data.session)
      );
      this.setSession(restoredSession);
      return restoredSession;
    }

    const result = await this.client.auth.getSession();
    if (result.error) {
      const errorSession: AuthSession = {
        status: "error",
        user: null,
        provider: EMAIL_ACCOUNT_PROVIDER_ID,
        detail: result.error.message,
      };
      this.setSession(errorSession);
      return errorSession;
    }

    const nextSession = result.data.session
      ? createAuthenticatedSession(
          result.data.session,
          this.resolveAuthenticatedAt(result.data.session)
        )
      : createSignedOutSession("No email account is signed in on this device.");
    this.setSession(nextSession);
    return nextSession;
  }
}

export const emailAuthRuntime = new EmailAuthRuntime();
