import { describe, expect, it, vi } from "vitest";

import { createAuthSessionStore } from "../authSessionStore";
import type {
  AuthProvider,
  AuthSession,
  AuthStateListener,
  AuthStateSubscription,
} from "../types";

const signedOutSession: AuthSession = {
  status: "unauthenticated",
  provider: "email",
  user: null,
  detail: "Signed out.",
};

const signedInSession: AuthSession = {
  status: "authenticated",
  provider: "email",
  user: {
    userId: "user-1",
    email: "user@example.com",
    displayName: "AliOS User",
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
  },
  detail: "Signed in.",
};

function createTrackingAuthProvider(initialSession: AuthSession) {
  let currentSession = initialSession;
  let activeSubscriptions = 0;
  let maxActiveSubscriptions = 0;
  let unsubscribeCalls = 0;
  const listeners = new Set<AuthStateListener>();

  const provider: AuthProvider = {
    name: "email",
    getCurrentUser: async () => currentSession.user,
    getCurrentSession: async () => currentSession,
    login: async () => ({ session: currentSession }),
    logout: async () => undefined,
    refreshSession: async () => currentSession,
    subscribe: vi.fn((listener: AuthStateListener): AuthStateSubscription => {
      listeners.add(listener);
      activeSubscriptions += 1;
      maxActiveSubscriptions = Math.max(
        maxActiveSubscriptions,
        activeSubscriptions
      );
      listener(currentSession);

      return {
        unsubscribe: () => {
          if (!listeners.delete(listener)) {
            return;
          }

          activeSubscriptions -= 1;
          unsubscribeCalls += 1;
        },
      };
    }),
  };

  return {
    provider,
    emit(session: AuthSession) {
      currentSession = session;
      listeners.forEach((listener) => listener(session));
    },
    getActiveSubscriptions: () => activeSubscriptions,
    getMaxActiveSubscriptions: () => maxActiveSubscriptions,
    getUnsubscribeCalls: () => unsubscribeCalls,
  };
}

describe("auth session store", () => {
  it("does not subscribe to the concrete auth runtime during construction", () => {
    const harness = createTrackingAuthProvider(signedOutSession);

    createAuthSessionStore(harness.provider);

    expect(harness.provider.subscribe).not.toHaveBeenCalled();
    expect(harness.getActiveSubscriptions()).toBe(0);
  });

  it("fans out multiple consumers through one concrete auth runtime subscription", () => {
    const harness = createTrackingAuthProvider(signedOutSession);
    const store = createAuthSessionStore(harness.provider);
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const firstSubscription = store.subscribe(firstListener);
    const secondSubscription = store.subscribe(secondListener);

    expect(harness.provider.subscribe).toHaveBeenCalledTimes(1);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);

    harness.emit(signedInSession);

    expect(firstListener).toHaveBeenLastCalledWith(signedInSession);
    expect(secondListener).toHaveBeenLastCalledWith(signedInSession);

    firstSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getUnsubscribeCalls()).toBe(0);

    secondSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getUnsubscribeCalls()).toBe(1);
  });

  it("cleans up StrictMode-style subscribe and cleanup replay", () => {
    const harness = createTrackingAuthProvider(signedOutSession);
    const store = createAuthSessionStore(harness.provider);
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const firstSubscription = store.subscribe(firstListener);
    firstSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getUnsubscribeCalls()).toBe(1);

    const secondSubscription = store.subscribe(secondListener);

    expect(harness.provider.subscribe).toHaveBeenCalledTimes(2);
    expect(harness.getActiveSubscriptions()).toBe(1);
    expect(harness.getMaxActiveSubscriptions()).toBe(1);

    secondSubscription.unsubscribe();

    expect(harness.getActiveSubscriptions()).toBe(0);
    expect(harness.getUnsubscribeCalls()).toBe(2);
  });

  it("does not notify consumers when only derived user timestamps change", () => {
    const harness = createTrackingAuthProvider(signedInSession);
    const store = createAuthSessionStore(harness.provider);
    const listener = vi.fn();

    const subscription = store.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);

    harness.emit({
      ...signedInSession,
      user: signedInSession.user
        ? {
            ...signedInSession.user,
            createdAt: "2026-07-29T10:05:00.000Z",
            updatedAt: "2026-07-29T10:05:00.000Z",
          }
        : null,
    });

    expect(listener).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
  });
});
