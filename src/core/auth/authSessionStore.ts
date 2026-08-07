import type {
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
} from "./types";

export type AuthSessionSource = Pick<
  AuthProvider,
  "getCurrentSession" | "subscribe"
>;

export interface AuthSessionStore extends AuthSessionSource {
  getSnapshot(): AuthSession | null;
  refresh(): Promise<AuthSession>;
}

function authUsersMatch(
  left: AuthSession["user"],
  right: AuthSession["user"]
) {
  if (left === null || right === null) {
    return left === right;
  }

  return (
    left.userId === right.userId &&
    left.email === right.email &&
    left.displayName === right.displayName &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt &&
    left.avatarUrl === right.avatarUrl
  );
}

function authSessionsMatch(left: AuthSession, right: AuthSession) {
  return (
    left.status === right.status &&
    left.provider === right.provider &&
    left.expiresAt === right.expiresAt &&
    left.detail === right.detail &&
    authUsersMatch(left.user, right.user)
  );
}

class DefaultAuthSessionStore implements AuthSessionStore {
  private currentSession: AuthSession | null = null;
  private upstreamSubscription: AuthStateSubscription | null = null;
  private refreshInFlight: Promise<AuthSession> | null = null;
  private readonly listeners = new Set<AuthStateListener>();

  constructor(private readonly source: AuthSessionSource) {}

  getSnapshot(): AuthSession | null {
    return this.currentSession;
  }

  getCurrentSession(): Promise<AuthSession> {
    return this.refresh();
  }

  refresh(): Promise<AuthSession> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.source
        .getCurrentSession()
        .then((session) => {
          this.setSession(session);
          return session;
        })
        .finally(() => {
          this.refreshInFlight = null;
        });
    }

    return this.refreshInFlight;
  }

  subscribe(listener: AuthStateListener): AuthStateSubscription {
    const hadSnapshot = this.currentSession !== null;
    this.listeners.add(listener);
    this.ensureUpstreamSubscription();

    if (hadSnapshot && this.currentSession) {
      listener(this.currentSession);
    } else {
      void this.refresh();
    }

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
        if (this.listeners.size === 0) {
          this.upstreamSubscription?.unsubscribe();
          this.upstreamSubscription = null;
        }
      },
    };
  }

  private ensureUpstreamSubscription() {
    if (this.upstreamSubscription) {
      return;
    }

    this.upstreamSubscription = this.source.subscribe((session) => {
      this.setSession(session);
    });
  }

  private setSession(session: AuthSession) {
    if (this.currentSession && authSessionsMatch(this.currentSession, session)) {
      return;
    }

    this.currentSession = session;
    this.listeners.forEach((listener) => {
      listener(session);
    });
  }
}

export function createAuthSessionStore(
  source: AuthSessionSource
): AuthSessionStore {
  return new DefaultAuthSessionStore(source);
}
