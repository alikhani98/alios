// @vitest-environment jsdom
import React, { StrictMode, act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { localOnlyAccountProvider } from "@/core/account";
import { localOnlyAuthProvider } from "@/core/auth";
import { SupabasePreferenceSyncProvider } from "@/core/sync";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import {
  AppBootstrapErrorFallback,
  AppProviders,
  loadDexieStorageAdapter,
  normalizeBootstrapError,
} from "../providers";

describe("app storage bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the adapter produced by the async storage module", async () => {
    const { database, storage } = await createTestStorage();

    try {
      const loadedAdapter = await loadDexieStorageAdapter(async () => ({
        dexieStorageAdapter: storage,
      }));

      expect(loadedAdapter).toBe(storage);
    } finally {
      await destroyTestDatabase(database);
    }
  });

  it("preserves async storage-loading failures for the provider fallback", async () => {
    const failure = new Error("Storage chunk unavailable");

    await expect(
      loadDexieStorageAdapter(async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(normalizeBootstrapError(failure)).toBe(failure);
    expect(normalizeBootstrapError("Storage unavailable").message).toBe(
      "Storage unavailable"
    );
  });

  it("renders a calm Persian retry and reload fallback by default", () => {
    const html = renderToStaticMarkup(
      <I18nProvider>
        <AppBootstrapErrorFallback
          onRetry={() => undefined}
          onReload={() => undefined}
        />
      </I18nProvider>
    );

    expect(html).toContain("AliOS نتوانست داده‌های محلی را آماده کند");
    expect(html).toContain("تلاش دوباره");
    expect(html).toContain("بارگذاری مجدد صفحه");
    expect(html).toContain('role="alert"');
  });

  it("renders the same bootstrap recovery actions in English", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");

    const html = renderToStaticMarkup(
      <I18nProvider>
        <AppBootstrapErrorFallback
          onRetry={() => undefined}
          onReload={() => undefined}
        />
      </I18nProvider>
    );

    expect(html).toContain("AliOS could not prepare local data");
    expect(html).toContain("Try again");
    expect(html).toContain("Reload page");
  });

  it("ships the local-only auth provider as the default runtime boundary", async () => {
    await expect(localOnlyAuthProvider.getCurrentSession()).resolves.toMatchObject({
      status: "unauthenticated",
      provider: "local-only",
    });
  });

  it("activates the sync provider only after storage bootstrap and cleans up safely under StrictMode", async () => {
    const { database, storage } = await createTestStorage();
    const listeners = new Set<(session: unknown) => void>();
    let activeSyncSubscriptions = 0;
    let maxActiveSyncSubscriptions = 0;
    const subscribe = vi.fn((listener: (session: unknown) => void) => {
      listeners.add(listener);
      activeSyncSubscriptions += 1;
      maxActiveSyncSubscriptions = Math.max(
        maxActiveSyncSubscriptions,
        activeSyncSubscriptions
      );

      return {
        unsubscribe: () => {
          if (!listeners.delete(listener)) {
            return;
          }
          activeSyncSubscriptions -= 1;
        },
      };
    });
    const appAuthProvider = {
      name: "email" as const,
      getCurrentUser: async () => null,
      getCurrentSession: async () => ({
        status: "unauthenticated" as const,
        provider: "email" as const,
        user: null,
        detail: "Signed out.",
      }),
      login: async () => ({
        session: {
          status: "unauthenticated" as const,
          provider: "email" as const,
          user: null,
          detail: "Signed out.",
        },
      }),
      logout: async () => undefined,
      refreshSession: async () => ({
        status: "unauthenticated" as const,
        provider: "email" as const,
        user: null,
        detail: "Signed out.",
      }),
      subscribe: vi.fn(() => ({
        unsubscribe: () => undefined,
      })),
      isConfigured: () => true,
    };
    const syncAuthProvider = {
      name: "email" as const,
      getCurrentUser: async () => null,
      getCurrentSession: async () => ({
        status: "unauthenticated" as const,
        provider: "email" as const,
        user: null,
        detail: "Signed out.",
      }),
      login: async () => ({
        session: {
          status: "unauthenticated" as const,
          provider: "email" as const,
          user: null,
          detail: "Signed out.",
        },
      }),
      logout: async () => undefined,
      refreshSession: async () => ({
        status: "unauthenticated" as const,
        provider: "email" as const,
        user: null,
        detail: "Signed out.",
      }),
      subscribe,
      isConfigured: () => true,
    };
    const syncProvider = new SupabasePreferenceSyncProvider({
      authProvider: syncAuthProvider,
      getStorage: () => localStorage,
    });
    const activateSpy = vi.spyOn(syncProvider, "activate");
    const deactivateSpy = vi.spyOn(syncProvider, "deactivate");
    const container = document.createElement("div");
    const root = createRoot(container);

    document.body.appendChild(container);

    try {
      expect(subscribe).not.toHaveBeenCalled();
      expect(activateSpy).not.toHaveBeenCalled();
      expect(deactivateSpy).not.toHaveBeenCalled();

      await act(async () => {
        root.render(
          <StrictMode>
            <AppProviders
              loadStorageAdapter={async () => storage}
              accountProvider={localOnlyAccountProvider}
              authProvider={appAuthProvider}
              syncProvider={syncProvider}
            >
              <div>ready</div>
            </AppProviders>
          </StrictMode>
        );
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.textContent).toContain("ready");
      expect(activateSpy).toHaveBeenCalled();
      expect(activeSyncSubscriptions).toBe(1);
      expect(maxActiveSyncSubscriptions).toBe(1);

      await act(async () => {
        root.unmount();
      });

      expect(deactivateSpy).toHaveBeenCalled();
      expect(activeSyncSubscriptions).toBe(0);
    } finally {
      container.remove();
      await destroyTestDatabase(database);
    }
  });
});
