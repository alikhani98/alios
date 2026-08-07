// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createAuthSessionStore } from "../authSessionStore";
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

  it("derives live session updates from a shared session source without subscribing directly", async () => {
    const provider = new TestAuthProvider(authenticatedSession);
    const providerSubscribeSpy = vi.spyOn(provider, "subscribe");
    const sessionSource = createAuthSessionStore(provider);
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    try {
      await act(async () => {
        root.render(
          <AuthRuntimeProvider
            provider={provider}
            sessionSource={sessionSource}
          >
            <AuthProbe />
          </AuthRuntimeProvider>
        );
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(providerSubscribeSpy).toHaveBeenCalledTimes(1);
      expect(container.innerHTML).toContain('data-provider="test-auth"');
      expect(container.innerHTML).toContain(
        'data-session-status="authenticated"'
      );

      await act(async () => {
        root.unmount();
      });
    } finally {
      container.remove();
    }
  });
});
