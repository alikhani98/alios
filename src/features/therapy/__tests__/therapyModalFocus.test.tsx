// @vitest-environment jsdom
import { act, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageAdapterProvider } from "@/core/storage";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { TherapyNoteForm } from "../components/TherapyNoteForm";

function Harness() {
  const [open, setOpen] = useState(false);
  const [, rerender] = useState(0);
  return <><button id="opener" onClick={() => setOpen(true)}>Open</button>
    <button id="outside" onClick={() => rerender(value => value + 1)}>Outside</button>
    <TherapyNoteForm open={open} onClose={() => setOpen(false)} />
  </>;
}

describe("Therapy modal keyboard focus lifecycle", () => {
  let root: Root; let host: HTMLDivElement;
  let database: AliosDatabase; let storage: DexieStorageAdapter;
  beforeEach(async () => {
    ({ database, storage } = await createTestStorage());
    localStorage.clear(); window.localStorage.clear();
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); await destroyTestDatabase(database); });
  async function render(language = "en") {
    for (const store of [localStorage, window.localStorage]) store.setItem(LANGUAGE_STORAGE_KEY, language);
    await act(async () => root.render(<StrictMode><I18nProvider><StorageAdapterProvider adapter={storage}><Harness /></StorageAdapterProvider></I18nProvider></StrictMode>));
  }
  async function until(assertion: () => void) {
    await vi.waitFor(async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); assertion(); });
  }
  function opener() { return host.querySelector<HTMLButtonElement>("#opener")!; }
  function dialog() { return document.querySelector<HTMLElement>('[aria-labelledby="therapy-note-form-title"]')!; }
  function close() { return dialog().querySelector<HTMLButtonElement>('button[aria-label][tabindex]:not([tabindex="-1"])') ?? dialog().querySelector<HTMLButtonElement>('.alios-modal-panel button')!; }
  function submit() { return dialog().querySelector<HTMLButtonElement>('button[type="submit"]')!; }
  async function open() { opener().focus(); await act(async () => opener().click()); }
  async function key(target: HTMLElement, key: string, shiftKey = false) {
    const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
    await act(async () => target.dispatchEvent(event)); return event;
  }
  async function fill() {
    const input = dialog().querySelector<HTMLTextAreaElement>("textarea")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => { setter.call(input, "Local keyboard note"); input.dispatchEvent(new Event("input", { bubbles: true })); });
  }
  it.each(["en", "fa"])("enters the dialog and wraps Tab/Shift+Tab around enabled controls in %s", async language => {
    await render(language); await open(); expect(document.activeElement).toBe(close());
    expect(dialog().dir).toBe(language === "fa" ? "rtl" : "ltr");
    const cancel = dialog().querySelector<HTMLButtonElement>('form button[type="button"]:not([aria-pressed])')!;
    expect(submit().disabled).toBe(true);
    const reverse = await key(close(), "Tab", true); expect(reverse.defaultPrevented).toBe(true); expect(document.activeElement).toBe(cancel);
    const forward = await key(cancel, "Tab"); expect(forward.defaultPrevented).toBe(true); expect(document.activeElement).toBe(close());
    await fill(); submit().focus(); await key(submit(), "Tab"); expect(document.activeElement).toBe(close());
    await key(close(), "Tab", true); expect(document.activeElement).toBe(submit());
  });
  it("restores the opener after Cancel and Escape over repeated cycles", async () => {
    await render();
    for (let count = 0; count < 3; count++) {
      await open(); expect(document.activeElement).toBe(close());
      const cancel = dialog().querySelector<HTMLButtonElement>('form button[type="button"]:not([aria-pressed])')!;
      cancel.focus(); await act(async () => cancel.click()); expect(dialog()).toBeNull(); expect(document.activeElement).toBe(opener());
      await open(); await key(close(), "Escape"); expect(dialog()).toBeNull(); expect(document.activeElement).toBe(opener());
    }
  });
  it("restores focus after successful Save to the real repository", async () => {
    await render(); await open(); await fill();
    await act(async () => submit().click()); await until(() => expect(dialog()).toBeNull());
    expect(document.activeElement).toBe(opener());
  });
  it("retains the draft, open dialog and retry focus after a failed Save", async () => {
    const failure = vi.spyOn(storage.therapyNotes, "addNote").mockRejectedValueOnce(new Error("Controlled save failure"));
    await render(); await open(); await fill();
    await act(async () => submit().click()); await until(() => expect(dialog().querySelector('[role="alert"]')?.textContent).toBe("Controlled save failure"));
    expect(document.activeElement).toBe(submit()); expect(dialog().querySelector("textarea")?.value).toBe("Local keyboard note");
    failure.mockRestore();
    await act(async () => submit().click()); await until(() => expect(dialog()).toBeNull());
    expect(document.activeElement).toBe(opener());
  });
  it("does not recapture the opener or reset focus when callback identities change", async () => {
    await render(); await open(); await fill(); const input = dialog().querySelector<HTMLTextAreaElement>("textarea")!; input.focus();
    await act(async () => host.querySelector<HTMLButtonElement>("#outside")!.click());
    expect(document.activeElement).toBe(input); await key(input, "Escape"); expect(document.activeElement).toBe(opener());
  });
  it("ignores a stale pending Save when a new modal session has opened", async () => {
    let resolve!: () => void;
    vi.spyOn(storage.therapyNotes, "addNote").mockImplementationOnce(() => new Promise<void>(done => { resolve = done; }));
    await render(); await open(); await fill(); await act(async () => submit().click());
    expect(document.activeElement).toBe(close());
    await key(close(), "Escape"); await open(); const input = dialog().querySelector<HTMLTextAreaElement>("textarea")!; input.focus();
    await act(async () => resolve()); expect(dialog()).not.toBeNull(); expect(document.activeElement).toBe(input); expect(submit().disabled).toBe(false);
  });
  it("cleans up on unmount and never focuses a disconnected opener", async () => {
    await render(); await open();
    const external = document.createElement("button"); document.body.append(external); host.remove(); external.focus();
    await act(async () => root.render(null)); expect(dialog()).toBeNull(); expect(document.activeElement).toBe(external);
    const tab = await key(external, "Tab"); expect(tab.defaultPrevented).toBe(false); external.remove();
  });
  it("keeps the global command shortcut from opening a second trap", async () => {
    const command = vi.fn(); document.addEventListener("keydown", command);
    try { await render(); await open(); const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true });
      await act(async () => close().dispatchEvent(event)); expect(command).not.toHaveBeenCalled(); expect(event.defaultPrevented).toBe(true);
    } finally { document.removeEventListener("keydown", command); }
  });
});
