// @vitest-environment jsdom
import { act, type ReactNode, type SetStateAction } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";
import { useViewDensityMode, VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { ViewDensityModeControl } from "../pages/SettingsPage";

import { PROFILE_AVATAR_IMAGE_STORAGE_KEY, PROFILE_AVATAR_STORAGE_KEY } from "@/shared/constants/preferences";
import { ProfileSettings } from "../components/ProfileSettings";
import * as avatarImages from "../profileAvatarImage";

// React ignores post-unmount state updates; count setter calls to make that regression observable.
const avatarLifecycle = vi.hoisted(() => ({ observe: false, updates: 0 }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState<S>(initial: S | (() => S)) {
      const [value, setValue] = actual.useState(initial);
      const trackedSetter = actual.useCallback((next: SetStateAction<S>) => {
        if (avatarLifecycle.observe) avatarLifecycle.updates += 1;
        setValue(next);
      }, [setValue]);
      return [value, trackedSetter];
    },
  };
});

function DensityHarness() {
  const { value, setValue, persistenceFailed } = useViewDensityMode();
  return <><output>{value}</output><button onClick={() => setValue("simple")}>Simple</button>{persistenceFailed ? <p role="alert">Save failed</p> : null}</>;
}

describe("Density persistence feedback", () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalLocalStorage: PropertyDescriptor | undefined;
  beforeEach(async () => {
    await loadMessages("en");
    await loadMessages("fa");
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
    if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(content: ReactNode) {
    await act(async () => root.render(content));
  }
  async function click(label: string) {
    const button = [...container.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
    if (!button) throw new Error(`Button not found: ${label}`);
    await act(async () => button.click());
  }
  function failWrite(key: string) {
    const original = localStorage.setItem.bind(localStorage);
    return vi.spyOn(localStorage, "setItem").mockImplementation((entry, value) => {
      if (entry === key) throw new Error("private storage detail");
      original(entry, value);
    });
  }

  it("updates multiple same-tab subscribers, handles external storage events, and reloads the saved mode", async () => {
    await render(<><DensityHarness /><DensityHarness /></>);
    await click("Simple");
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["simple", "simple"]);
    localStorage.removeItem(VIEW_DENSITY_MODE_STORAGE_KEY);
    await act(async () => window.dispatchEvent(new StorageEvent("storage", {
      key: VIEW_DENSITY_MODE_STORAGE_KEY, oldValue: "simple", newValue: null,
    })));
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["full", "full"]);
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", {
      key: VIEW_DENSITY_MODE_STORAGE_KEY, oldValue: null, newValue: "simple",
    })));
    expect([...container.querySelectorAll("output")].map((node) => node.textContent)).toEqual(["simple", "simple"]);
    await render(null);
    await render(<DensityHarness />);
    expect(container.querySelector("output")?.textContent).toBe("simple");
  });

  it.each(["en", "fa"] as const)("reports failed save and reset in the existing density control, then retries (%s)", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    await render(<I18nProvider><ViewDensityModeControl /><DensityHarness /></I18nProvider>);
    const selected = () => container.querySelector<HTMLInputElement>('input[name="viewDensityMode"]:checked')?.value;
    const simple = container.querySelector<HTMLInputElement>('input[name="viewDensityMode"][value="simple"]');
    if (!simple) throw new Error("Missing density radio");
    const failure = failWrite(VIEW_DENSITY_MODE_STORAGE_KEY);
    await act(async () => simple.click());
    expect(selected()).toBe("full");
    expect(container.querySelector("output")?.textContent).toBe("full");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.localPersistenceError"]);
    failure.mockRestore();
    await act(async () => simple.click());
    expect(selected()).toBe("simple");
    expect(container.querySelector("output")?.textContent).toBe("simple");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    const originalRemove = localStorage.removeItem.bind(localStorage);
    const removalFailure = vi.spyOn(localStorage, "removeItem").mockImplementation((key) => {
      if (key === VIEW_DENSITY_MODE_STORAGE_KEY) throw new Error("storage blocked");
      originalRemove(key);
    });
    await click(language === "fa" ? "بازنشانی به نمای کامل" : "Reset to Full View");
    expect(selected()).toBe("simple");
    expect(container.querySelector("output")?.textContent).toBe("simple");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.localPersistenceError"]);
    expect(container.textContent).not.toContain("storage blocked");
    removalFailure.mockRestore();
    await click(language === "fa" ? "بازنشانی به نمای کامل" : "Reset to Full View");
    expect(selected()).toBe("full");
    expect(container.querySelector("output")?.textContent).toBe("full");
    expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBeNull();
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
  });

  it("notifies density subscribers only after a successful write", async () => {
    await render(<DensityHarness />);
    const changed = vi.fn((event: Event) => {
      if (event instanceof CustomEvent && event.detail?.key === VIEW_DENSITY_MODE_STORAGE_KEY) return event.detail.key;
      return undefined;
    });
    window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed);
    try {
      const failure = failWrite(VIEW_DENSITY_MODE_STORAGE_KEY);
      await click("Simple");
      expect(changed).not.toHaveBeenCalled();
      expect(container.querySelector("output")?.textContent).toBe("full");
      failure.mockRestore();
      await click("Simple");
      expect(localStorage.getItem(VIEW_DENSITY_MODE_STORAGE_KEY)).toBe("simple");
      expect(container.querySelector("output")?.textContent).toBe("simple");
      expect(changed).toHaveBeenCalledTimes(1);
      expect(changed.mock.results[0]?.value).toBe(VIEW_DENSITY_MODE_STORAGE_KEY);
    } finally {
      window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed);
    }
  });

});

function deferredAvatar() {
  let resolve!: (value: string) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<string>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

describe("Profile avatar upload concurrency", () => {
  let root: Root; let host: HTMLDivElement; let descriptor: PropertyDescriptor | undefined;
  const oldPhoto = "data:image/webp;base64,old";
  const newPhoto = "data:image/webp;base64,new";
  beforeEach(async () => {
    avatarLifecycle.observe = false; avatarLifecycle.updates = 0;
    await loadMessages("en"); await loadMessages("fa");
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear(); localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    localStorage.setItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY, oldPhoto);
    localStorage.setItem(PROFILE_AVATAR_STORAGE_KEY, "initials");
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    avatarLifecycle.observe = false;
    await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(content: ReactNode = <ProfileSettings />) {
    await act(async () => root.render(<I18nProvider>{content}</I18nProvider>));
  }
  function uploadInput() {
    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("Missing upload control");
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["fixture"], "avatar.png", { type: "image/png" })] });
    return input;
  }
  const dispatchUpload = (input: HTMLInputElement) => input.dispatchEvent(new Event("change", { bubbles: true }));
  function button(label: string) {
    const node = [...host.querySelectorAll("button")].find(item => item.textContent?.trim() === label);
    if (!node) throw new Error("Missing button: " + label); return node;
  }
  async function click(label: string) { await act(async () => button(label).click()); }
  const preview = () => host.querySelector("img")?.getAttribute("src");

  it.each(["en", "fa"] as const)("serializes pre-render uploads, releases rejection and retries through explicit Save/Cancel in %s", async language => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language); await render();
    const messages = language === "fa" ? messagesFa : messagesEn;
    const save = language === "fa" ? "ذخیرهٔ عکس" : "Save photo";
    const cancel = language === "fa" ? "لغو تغییر عکس" : "Cancel photo changes";
    const first = deferredAvatar(); const retry = deferredAvatar();
    const writes = vi.spyOn(localStorage, "setItem"); const input = uploadInput();
    const resize = vi.spyOn(avatarImages, "resizeProfileAvatarImage").mockImplementationOnce(() => {
      // Re-enter before the first native event finishes; separate events otherwise flush disabled.
      expect(input.disabled).toBe(false);
      dispatchUpload(input);
      return first.promise;
    }).mockReturnValueOnce(retry.promise).mockResolvedValue(newPhoto);
    await act(async () => dispatchUpload(input));
    expect(resize).toHaveBeenCalledTimes(1);
    expect(input.disabled).toBe(true); expect(button(save).disabled).toBe(true);
    expect(button(messages["settings.profileAvatarPhotoProcessing"]).disabled).toBe(true);
    expect(button(messages["settings.profileAvatarPhotoRemove"]).disabled).toBe(true);
    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(preview()).toBe(oldPhoto); expect(writes).not.toHaveBeenCalled();
    await act(async () => first.reject(new Error("private image failure")));
    expect(input.disabled).toBe(false); expect(button(save).disabled).toBe(false);
    expect(button(messages["settings.profileAvatarPhotoUpload"]).disabled).toBe(false);
    expect(host.querySelector('[aria-busy="true"]')).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(messages["settings.profileAvatarPhotoError"]);
    expect(host.textContent).not.toContain("private image failure"); expect(host.querySelector('[role="status"]')).toBeNull();
    await act(async () => dispatchUpload(input)); expect(resize).toHaveBeenCalledTimes(2);
    await act(async () => retry.resolve(newPhoto));
    expect(input.disabled).toBe(false); expect(preview()).toBe(newPhoto);
    expect(host.querySelector('[role="alert"]')).toBeNull(); expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(oldPhoto);
    await click(cancel); expect(preview()).toBe(oldPhoto); expect(writes).not.toHaveBeenCalled();
    await act(async () => dispatchUpload(input)); expect(resize).toHaveBeenCalledTimes(3);
    expect(preview()).toBe(newPhoto); expect(writes).not.toHaveBeenCalled();
    await click(save);
    expect(writes.mock.calls.map(([key]) => key)).toEqual([PROFILE_AVATAR_IMAGE_STORAGE_KEY]);
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(newPhoto);
    expect(localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY)).toBe("initials");
    expect(host.querySelector('[role="status"]')?.textContent).toBe(messages["common.changesSaved"]);
  });

  it.each(["resolve", "reject"] as const)("ignores a cancelled upload's stale %s while a newer upload is processing", async outcome => {
    await render(); const old = deferredAvatar(); const current = deferredAvatar();
    const resize = vi.spyOn(avatarImages, "resizeProfileAvatarImage").mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const writes = vi.spyOn(localStorage, "setItem"); const input = uploadInput();
    await act(async () => dispatchUpload(input)); await click("Cancel photo changes");
    expect(input.disabled).toBe(false); expect(preview()).toBe(oldPhoto);
    await act(async () => dispatchUpload(input)); expect(resize).toHaveBeenCalledTimes(2);
    await act(async () => { if (outcome === "resolve") old.resolve("data:image/webp;base64,stale"); else old.reject(new Error("stale failure")); });
    expect(input.disabled).toBe(true); expect(button("Save photo").disabled).toBe(true);
    expect(preview()).toBe(oldPhoto); expect(host.querySelector('[role="alert"]')).toBeNull();
    await act(async () => current.resolve(newPhoto));
    expect(input.disabled).toBe(false); expect(preview()).toBe(newPhoto); expect(writes).not.toHaveBeenCalled();
    await click("Cancel photo changes"); expect(preview()).toBe(oldPhoto); expect(writes).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)("does not call state setters or persist when processing %ss after unmount", async outcome => {
    await render(); const pending = deferredAvatar();
    vi.spyOn(avatarImages, "resizeProfileAvatarImage").mockReturnValueOnce(pending.promise);
    const writes = vi.spyOn(localStorage, "setItem"); const input = uploadInput();
    await act(async () => dispatchUpload(input)); await render(null);
    expect(input.isConnected).toBe(false); avatarLifecycle.observe = true;
    await act(async () => { if (outcome === "resolve") pending.resolve(newPhoto); else pending.reject(new Error("late failure")); });
    expect(avatarLifecycle.updates).toBe(0); expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(oldPhoto);
    expect(localStorage.getItem(PROFILE_AVATAR_STORAGE_KEY)).toBe("initials");
    avatarLifecycle.observe = false; await render();
    expect(preview()).toBe(oldPhoto); expect(uploadInput().disabled).toBe(false); expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});
