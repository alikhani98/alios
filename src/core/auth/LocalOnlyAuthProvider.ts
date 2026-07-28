import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "./types";

const localOnlySession: AuthSession = {
  status: "unauthenticated",
  user: null,
  provider: "local-only",
  detail: "AliOS is currently running without an authenticated user session.",
};

export class LocalOnlyAuthProvider implements AuthProvider {
  readonly name = "local-only";

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  async getCurrentSession(): Promise<AuthSession> {
    return localOnlySession;
  }

  async login(_input: AuthLoginInput): Promise<AuthLoginResult> {
    throw new Error("Authentication is not enabled in AliOS 1.0.");
  }

  async logout(): Promise<void> {
    return undefined;
  }

  async refreshSession(): Promise<AuthSession> {
    return localOnlySession;
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    listener(localOnlySession);

    return {
      unsubscribe: () => undefined,
    };
  }
}

export const localOnlyAuthProvider = new LocalOnlyAuthProvider();
