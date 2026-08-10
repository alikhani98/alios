import {
  EMAIL_ACCOUNT_PROVIDER_ID,
  GOOGLE_ACCOUNT_PROVIDER_ID,
  type AccountAuthenticateInput,
  type AccountAuthenticateResult,
  type AccountCapabilitySet,
  type AccountIdentity,
  type AccountProvider,
  type AccountSessionBoundary,
  type AccountStateListener,
  type AccountStateSubscription,
  type AccountStatus,
} from "@/core/account/types";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "@/core/auth/types";
import type {
  SyncConflictRecord,
  SyncConflictResolutionInput,
  SyncConflictResolutionResult,
  SyncProvider,
  SyncResult,
  SyncStateListener,
  SyncStateSubscription,
  SyncStatus,
} from "@/core/sync/types";
import type { StorageAdapter } from "@/core/storage";

type ActivatableSyncProvider = SyncProvider &
  Readonly<{
    activate?: () => void;
    deactivate?: () => void;
  }>;

function isEmailConfigured() {
  return isSupabaseConfigured();
}

function isSupabaseConfigured() {
  const url =
    typeof import.meta !== "undefined"
      ? import.meta.env.VITE_SUPABASE_URL
      : undefined;
  const anonKey =
    typeof import.meta !== "undefined"
      ? import.meta.env.VITE_SUPABASE_ANON_KEY
      : undefined;

  return (
    typeof url === "string" &&
    url.trim().length > 0 &&
    typeof anonKey === "string" &&
    anonKey.trim().length > 0
  );
}

function isGoogleConfigured() {
  const clientId =
    typeof import.meta !== "undefined"
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : "";

  return typeof clientId === "string" && clientId.trim().length > 0;
}

class LazyEmailAuthProvider implements AuthProvider {
  readonly name = EMAIL_ACCOUNT_PROVIDER_ID;
  private providerPromise: Promise<AuthProvider> | null = null;

  isConfigured() {
    return isEmailConfigured();
  }

  private loadProvider() {
    if (!this.providerPromise) {
      this.providerPromise = import("@/core/auth/EmailAuthProvider").then(
        (module) => module.emailAuthProvider
      );
    }

    return this.providerPromise;
  }

  async createAccount(input: AuthLoginInput): Promise<AuthLoginResult> {
    const provider = await this.loadProvider();
    if (typeof provider.createAccount !== "function") {
      throw new Error("Email account creation is unavailable.");
    }

    return provider.createAccount(input);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return (await this.loadProvider()).getCurrentUser();
  }

  async getCurrentSession(): Promise<AuthSession> {
    return (await this.loadProvider()).getCurrentSession();
  }

  async login(input: AuthLoginInput): Promise<AuthLoginResult> {
    return (await this.loadProvider()).login(input);
  }

  async logout(): Promise<void> {
    return (await this.loadProvider()).logout();
  }

  async refreshSession(): Promise<AuthSession> {
    return (await this.loadProvider()).refreshSession();
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    let active = true;
    let subscription: AuthStateSubscription | null = null;

    void this.loadProvider().then((provider) => {
      if (!active) {
        return;
      }

      subscription = provider.subscribe(listener);
    });

    return {
      unsubscribe: () => {
        active = false;
        subscription?.unsubscribe();
      },
    };
  }
}

class LazyGoogleAuthProvider implements AuthProvider {
  readonly name = GOOGLE_ACCOUNT_PROVIDER_ID;
  private providerPromise: Promise<
    AuthProvider & {
      getIdToken?: () => string | null;
      renderButton?: (parent: HTMLElement) => Promise<void>;
    }
  > | null = null;
  private loadedProvider:
    | (AuthProvider & {
        getIdToken?: () => string | null;
        renderButton?: (parent: HTMLElement) => Promise<void>;
      })
    | null = null;

  isConfigured() {
    return isGoogleConfigured();
  }

  private loadProvider() {
    if (!this.providerPromise) {
      this.providerPromise = import("@/core/auth/GoogleAuthProvider").then(
        (module) => {
          this.loadedProvider = module.googleAuthProvider;
          return module.googleAuthProvider;
        }
      );
    }

    return this.providerPromise;
  }

  getIdToken(): string | null {
    return this.loadedProvider?.getIdToken?.() ?? null;
  }

  async renderButton(parent: HTMLElement): Promise<void> {
    const provider = await this.loadProvider();
    if (typeof provider.renderButton !== "function") {
      throw new Error("Google sign-in rendering is unavailable.");
    }

    return provider.renderButton(parent);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return (await this.loadProvider()).getCurrentUser();
  }

  async getCurrentSession(): Promise<AuthSession> {
    return (await this.loadProvider()).getCurrentSession();
  }

  async login(input: AuthLoginInput): Promise<AuthLoginResult> {
    return (await this.loadProvider()).login(input);
  }

  async logout(): Promise<void> {
    return (await this.loadProvider()).logout();
  }

  async refreshSession(): Promise<AuthSession> {
    return (await this.loadProvider()).refreshSession();
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    let active = true;
    let subscription: AuthStateSubscription | null = null;

    void this.loadProvider().then((provider) => {
      if (!active) {
        return;
      }

      subscription = provider.subscribe(listener);
    });

    return {
      unsubscribe: () => {
        active = false;
        subscription?.unsubscribe();
      },
    };
  }
}

class LazyAccountProvider implements AccountProvider {
  private providerPromise: Promise<AccountProvider> | null = null;

  constructor(
    readonly providerId: typeof EMAIL_ACCOUNT_PROVIDER_ID | typeof GOOGLE_ACCOUNT_PROVIDER_ID,
    private readonly load: () => Promise<AccountProvider>
  ) {}

  private loadProvider() {
    if (!this.providerPromise) {
      this.providerPromise = this.load();
    }

    return this.providerPromise;
  }

  async getStatus(): Promise<AccountStatus> {
    return (await this.loadProvider()).getStatus();
  }

  async getCapabilities(): Promise<AccountCapabilitySet> {
    return (await this.loadProvider()).getCapabilities();
  }

  async getCurrentIdentity(): Promise<AccountIdentity | null> {
    return (await this.loadProvider()).getCurrentIdentity();
  }

  async getCurrentSession(): Promise<AccountSessionBoundary> {
    return (await this.loadProvider()).getCurrentSession();
  }

  async authenticate(
    input: AccountAuthenticateInput
  ): Promise<AccountAuthenticateResult> {
    return (await this.loadProvider()).authenticate(input);
  }

  async restoreIdentity(): Promise<AccountSessionBoundary> {
    return (await this.loadProvider()).restoreIdentity();
  }

  async refreshSession(): Promise<AccountSessionBoundary> {
    return (await this.loadProvider()).refreshSession();
  }

  async signOut(): Promise<void> {
    return (await this.loadProvider()).signOut();
  }

  subscribe(listener: AccountStateListener): AccountStateSubscription {
    let active = true;
    let subscription: AccountStateSubscription | null = null;

    void this.loadProvider().then((provider) => {
      if (!active) {
        return;
      }

      subscription = provider.subscribe(listener);
    });

    return {
      unsubscribe: () => {
        active = false;
        subscription?.unsubscribe();
      },
    };
  }
}

export const lazyEmailAuthProvider = new LazyEmailAuthProvider();
export const lazyGoogleAuthProvider = new LazyGoogleAuthProvider();

export const lazyEmailAccountProvider = new LazyAccountProvider(
  EMAIL_ACCOUNT_PROVIDER_ID,
  () =>
    import("@/core/account/EmailAccountProvider").then(
      (module) => module.emailAccountProvider
    )
);

export const lazyGoogleAccountProvider = new LazyAccountProvider(
  GOOGLE_ACCOUNT_PROVIDER_ID,
  () =>
    import("@/core/account/GoogleAccountProvider").then(
      (module) => module.googleAccountProvider
    )
);

export class LazySupabaseSyncProvider implements ActivatableSyncProvider {
  readonly name = "supabase";
  private providerPromise: Promise<ActivatableSyncProvider> | null = null;
  private loadedProvider: ActivatableSyncProvider | null = null;
  private activeRequested = false;

  constructor(
    private readonly dependencies: Readonly<{
      authProvider: Pick<AuthProvider, "getCurrentSession" | "subscribe">;
      idTokenProvider?: Pick<LazyGoogleAuthProvider, "getIdToken">;
      backupStorage: StorageAdapter["backup"];
    }>
  ) {}

  private loadProvider() {
    if (!this.providerPromise) {
      this.providerPromise = import(
        "@/core/sync/SupabasePreferenceSyncProvider"
      ).then((module) => {
        const provider = new module.SupabasePreferenceSyncProvider({
          authProvider: this.dependencies.authProvider,
          idTokenProvider: this.dependencies.idTokenProvider,
          backupStorage: this.dependencies.backupStorage,
        });
        this.loadedProvider = provider;
        if (this.activeRequested) {
          provider.activate();
        }

        return provider;
      });
    }

    return this.providerPromise;
  }

  activate() {
    this.activeRequested = true;
    this.loadedProvider?.activate?.();
  }

  deactivate() {
    this.activeRequested = false;
    this.loadedProvider?.deactivate?.();
  }

  async getStatus(): Promise<SyncStatus> {
    return (await this.loadProvider()).getStatus();
  }

  async syncNow(): Promise<SyncResult> {
    return (await this.loadProvider()).syncNow();
  }

  getConflictSnapshot(): ReadonlyArray<SyncConflictRecord> {
    return this.loadedProvider?.getConflictSnapshot?.() ?? [];
  }

  async listConflicts(): Promise<ReadonlyArray<SyncConflictRecord>> {
    const provider = await this.loadProvider();
    return provider.listConflicts?.() ?? [];
  }

  async resolveConflict(
    input: SyncConflictResolutionInput
  ): Promise<SyncConflictResolutionResult> {
    const provider = await this.loadProvider();
    if (typeof provider.resolveConflict !== "function") {
      throw new Error("Sync conflict resolution is unavailable.");
    }

    return provider.resolveConflict(input);
  }

  subscribe(listener: SyncStateListener): SyncStateSubscription {
    let active = true;
    let subscription: SyncStateSubscription | null = null;

    void this.loadProvider().then((provider) => {
      if (!active) {
        return;
      }

      subscription = provider.subscribe(listener);
    });

    return {
      unsubscribe: () => {
        active = false;
        subscription?.unsubscribe();
      },
    };
  }
}

export function isOptionalAuthConfigured() {
  return isEmailConfigured() || isGoogleConfigured();
}

export function isOptionalSyncConfigured() {
  return isSupabaseConfigured();
}
