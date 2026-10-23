// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageAdapterProvider } from "@/core/storage";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { TherapyNoteForm } from "../components/TherapyNoteForm";

// Actual pointer reachability is additionally checked in Chrome against the built app.
describe("Therapy form escapes the isolated route stacking context", () => {
  let root: Root; let host: HTMLDivElement;
  let database: AliosDatabase; let storage: DexieStorageAdapter;
  const close = vi.fn(); const saved = vi.fn();
  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear(); window.localStorage.clear(); close.mockReset(); saved.mockReset();
    host = document.createElement("div"); host.style.isolation = "isolate"; host.style.transform = "translateY(0)";
    document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); await destroyTestDatabase(database); });
  async function render(language: string, open = true) {
    for (const store of [localStorage, window.localStorage]) store.setItem(LANGUAGE_STORAGE_KEY, language);
    await act(async () => root.render(<I18nProvider><StorageAdapterProvider adapter={storage}>
      <TherapyNoteForm open={open} onClose={close} onSaved={saved} />
    </StorageAdapterProvider></I18nProvider>));
  }
  it.each(["en", "fa"])("portals outside clipping ancestors and submits to the existing repository in %s", async language => {
    await render(language);
    const dialog = document.body.querySelector<HTMLElement>('[aria-labelledby="therapy-note-form-title"]')!;
    expect(dialog.parentElement).toBe(document.body);
    expect(host.contains(dialog)).toBe(false);
    expect(dialog.dir).toBe(language === "fa" ? "rtl" : "ltr");
    expect(dialog.classList.contains("alios-modal-overlay")).toBe(true);
    expect(dialog.querySelector(".alios-modal-panel")).not.toBeNull();
    const textarea = dialog.querySelector<HTMLTextAreaElement>("textarea")!;
    const submit = dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => { setter.call(textarea, "Reachable local note"); textarea.dispatchEvent(new Event("input", { bubbles: true })); });
    expect(submit.disabled).toBe(false);
    await act(async () => submit.click());
    await vi.waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(close).toHaveBeenCalledTimes(1);
    const today = getLocalDateKey(new Date());
    expect((await storage.therapyNotes.getNotesByDateRange(today, today))[0]?.content).toBe("Reachable local note");
    await render(language, false);
    expect(document.body.querySelector('[aria-labelledby="therapy-note-form-title"]')).toBeNull();
  });
});
