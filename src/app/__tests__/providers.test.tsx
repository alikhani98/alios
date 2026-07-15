import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import {
  AppBootstrapErrorFallback,
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
});
