import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AuthRuntimeProvider,
  useAuth,
  useAuthSession,
} from "../AuthRuntimeProvider";
import type {
  AuthLoginInput,
  AuthLoginResult,
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
  AuthUser,
} from "../types";

class TestAuthProvider implements AuthProvider {
  readonly name = "test-auth";
  private readonly currentSession: AuthSession;

  constructor(session: AuthSession) {
    this.currentSession = session;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentSession.user;
  }

  async getCurrentSession(): Promise<AuthSession> {
    return this.currentSession;
  }

  async login(_input: AuthLoginInput): Promise<AuthLoginResult> {
    return { session: this.currentSession };
  }

  async logout(): Promise<void> {
    return undefined;
  }

  async refreshSession(): Promise<AuthSession> {
    return this.currentSession;
  }

  subscribe(_listener: AuthStateListener): AuthStateSubscription {
    return {
      unsubscribe: () => undefined,
    };
  }
}

const authenticatedSession: AuthSession = {
  status: "authenticated",
  provider: "test-auth",
  expiresAt: "2026-07-28T00:00:00.000Z",
  user: {
    userId: "user-1",
    email: "user@example.com",
    displayName: "AliOS User",
    createdAt: "2026-07-27T00:00:00.000Z",
    updatedAt: "2026-07-27T00:00:00.000Z",
  },
};

function AuthProbe() {
  const auth = useAuth();
  const session = useAuthSession();

  return (
    <div data-provider={auth.provider.name} data-session-status={session.status}>
      {session.detail ?? ""}
    </div>
  );
}

describe("AuthRuntimeProvider", () => {
  it("exposes the injected provider and bootstrap session through hooks", () => {
    const provider = new TestAuthProvider(authenticatedSession);

    const html = renderToStaticMarkup(
      <AuthRuntimeProvider provider={provider}>
        <AuthProbe />
      </AuthRuntimeProvider>
    );

    expect(html).toContain('data-provider="test-auth"');
    expect(html).toContain('data-session-status="authenticating"');
    expect(html).toContain("AliOS is preparing the authentication runtime.");
  });

  it("uses the local-only runtime by default", () => {
    const html = renderToStaticMarkup(
      <AuthRuntimeProvider>
        <AuthProbe />
      </AuthRuntimeProvider>
    );

    expect(html).toContain('data-provider="local-only"');
    expect(html).toContain('data-session-status="authenticating"');
  });

  it("throws a clear error when hooks are used outside the auth runtime", () => {
    expect(() => renderToStaticMarkup(<AuthProbe />)).toThrow(
      "AuthRuntimeProvider is missing from the application tree."
    );
  });
});
