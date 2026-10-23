// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageAdapterProvider } from "@/core/storage";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { TherapyBridgePage } from "../components/TherapyBridgePage";

function LocationProbe() {
  const location = useLocation();
  return <output data-location>{location.pathname}{location.hash}</output>;
}

describe("E3 Therapy Settings entry without a configured provider", () => {
  let root: Root; let host: HTMLDivElement;
  let database: AliosDatabase; let storage: DexieStorageAdapter;
  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear(); window.localStorage.clear();
    await storage.therapyNotes.addNote({ date: getLocalDateKey(new Date()), category: "event", content: "Local test note" });
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); await destroyTestDatabase(database); });
  it.each(["en", "fa"])("keeps the note local and navigates to revealed advanced Settings in %s", async language => {
    for (const store of [localStorage, window.localStorage]) store.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    await act(async () => root.render(<MemoryRouter initialEntries={["/therapy"]}><I18nProvider><StorageAdapterProvider adapter={storage}>
      <TherapyBridgePage /><LocationProbe />
    </StorageAdapterProvider></I18nProvider></MemoryRouter>));
    function button(label: string) {
      const node = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === label);
      if (!node) throw new Error(`Missing button: ${label}`);
      return node;
    }
    await vi.waitFor(() => expect(host.textContent).toContain("Local test note"));
    await act(async () => button(messages["therapy.tabSummary"]).click());
    await act(async () => button(messages["therapy.prepareButton"]).click());
    const link = host.querySelector<HTMLAnchorElement>('a[href="/settings#settings-advanced-local-tools"]');
    expect(link?.textContent).toBe(messages["therapy.noProviderHint"]);
    if (!link) throw new Error("Missing Therapy Settings link");
    await act(async () => link.click());
    expect(host.querySelector("[data-location]")?.textContent).toBe("/settings#settings-advanced-local-tools");
    expect((await storage.therapyNotes.getNotesByDateRange(getLocalDateKey(new Date()), getLocalDateKey(new Date())))[0]?.content).toBe("Local test note");
  });
});
