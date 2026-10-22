// @vitest-environment jsdom
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APPEARANCE_STORAGE_KEY, DISPLAY_NAME_STORAGE_KEY, PROFILE_AVATAR_IMAGE_STORAGE_KEY } from "@/shared/constants/preferences";
import { usePersistentString } from "@/shared/hooks/usePersistentString";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { ACCENT_COLOR_STORAGE_KEY } from "@/shared/constants/preferences";
import { parseAppearancePreference } from "@/shared/preferences/appearance";
import { AccentColorSettings, ThemePreviewPicker } from "../components/AppearanceControls";
import { ProfileSettings } from "../components/ProfileSettings";
import { resolveSettingsTab, SettingsPanel, SettingsTabs, settingsTabs, type SettingsTab } from "../components/SettingsTabs";
import { resizeProfileAvatarImage } from "../profileAvatarImage";

vi.mock("../profileAvatarImage", async (importOriginal) => ({
  ...await importOriginal<typeof import("../profileAvatarImage")>(),
  resizeProfileAvatarImage: vi.fn(),
}));

function ThemeHarness() {
  const { value, setValue } = usePersistentString({ key: APPEARANCE_STORAGE_KEY, defaultValue: "system" });
  return <ThemePreviewPicker value={parseAppearancePreference(value)} onChange={setValue} />;
}

function TabHarness() {
  const [active, setActive] = useState<SettingsTab>("general");
  return <><SettingsTabs activeTab={active} onChange={setActive} />{settingsTabs.map((tab) => <SettingsPanel key={tab} tab={tab} activeTab={active}><input aria-label={`${tab} draft`} /></SettingsPanel>)}</>;
}

describe("Settings tabs and canonical preference controls", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(resizeProfileAvatarImage).mockReset();
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });
  async function render(content: ReactNode) {
    await act(async () => root.render(<I18nProvider>{content}</I18nProvider>));
  }
  async function click(element: Element | null) {
    if (!(element instanceof HTMLElement)) throw new Error("Expected an interactive element");
    await act(async () => element.click());
  }
  function button(label: string) {
    const element = [...container.querySelectorAll("button")].find((item) => item.textContent?.trim() === label);
    if (!element) throw new Error(`Button not found: ${label}`);
    return element;
  }
  async function inputValue(input: HTMLInputElement, value: string) {
    // Use the native setter so React receives an actual input change.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("Missing native input setter");
    await act(async () => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("keeps section bookmarks and validates tab parameters", () => {
    expect(resolveSettingsTab("", "")).toBe("general");
    expect(resolveSettingsTab("?tab=invalid", "")).toBe("general");
    expect(resolveSettingsTab("?tab=appearance&safe=1", "")).toBe("appearance");
    expect(resolveSettingsTab("?tab=profile", "#settings-backup-restore")).toBe("data");
    expect(resolveSettingsTab("", "#settings-local-error-log")).toBe("diagnostics");
    expect(resolveSettingsTab("", "#settings-reminder-settings-group")).toBe("notifications");
    expect(resolveSettingsTab("", "#settings-appearance-behavior-group")).toBe("appearance");
  });

  it("supports arrow, Home and End navigation with one tab stop and retains drafts", async () => {
    await render(<TabHarness />);
    const tabs = [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...container.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    const draft = container.querySelector<HTMLInputElement>('input[aria-label="general draft"]')!;
    await inputValue(draft, "Unsubmitted name");
    tabs[0].focus();
    await act(async () => tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
    expect(tabs[1].getAttribute("aria-controls")).toBe(panels[1].id);
    await act(async () => tabs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true })));
    expect(document.activeElement).toBe(tabs[5]);
    await act(async () => tabs[5].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true })));
    expect(document.activeElement).toBe(tabs[0]);
    expect(draft.value).toBe("Unsubmitted name");
  });

  it("reverses arrow navigation in Persian and renders localized labels", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");
    await render(<TabHarness />);
    const first = container.querySelector<HTMLButtonElement>('[role="tab"]')!;
    expect(first.textContent).toBe("عمومی");
    await act(async () => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe("ظاهر");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("persists all four theme choices and restores the selected preview after remount", async () => {
    await render(<ThemeHarness />);
    for (const [label, value] of [["Light", "light"], ["Dark", "dark"], ["System", "system"], ["Scheduled", "scheduled"]]) {
      await click(button(label));
      expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe(value);
      expect(button(label).getAttribute("aria-pressed")).toBe("true");
    }
    await render(<div />);
    await render(<ThemeHarness />);
    expect(button("Scheduled").getAttribute("aria-pressed")).toBe("true");
  });

  it("exposes all existing accent colors and persists the actual accent preference", async () => {
    await render(<AccentColorSettings />);
    expect(container.querySelectorAll('button[aria-pressed]')).toHaveLength(10);
    const violet = button("Violet");
    await click(violet);
    expect(localStorage.getItem(ACCENT_COLOR_STORAGE_KEY)).toBe("violet");
    await render(<div />);
    await render(<AccentColorSettings />);
    expect(button("Violet").getAttribute("aria-pressed")).toBe("true");
  });

  it("saves a normalized local name, cancels edits, and reloads the stored value", async () => {
    localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, "Original");
    await render(<ProfileSettings />);
    const input = container.querySelector<HTMLInputElement>('input:not([type="file"])')!;
    await inputValue(input, "Discard this");
    await click(button("Cancel"));
    expect(input.value).toBe("Original");
    await inputValue(input, "  Sadegh Ali  ");
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)).toBe("Sadegh Ali");
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    await render(<div />);
    await render(<ProfileSettings />);
    expect(container.querySelector<HTMLInputElement>('input:not([type="file"])')?.value).toBe("Sadegh Ali");
  });

  it("preserves the photo on upload failure, saves resized photos, and supports removal", async () => {
    const oldPhoto = "data:image/webp;base64,old";
    const newPhoto = "data:image/webp;base64,new";
    localStorage.setItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY, oldPhoto);
    await render(<ProfileSettings />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["image"], "avatar.png", { type: "image/png" })] });
    vi.mocked(resizeProfileAvatarImage).mockRejectedValueOnce(new Error("Invalid image"));
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(oldPhoto);
    vi.mocked(resizeProfileAvatarImage).mockResolvedValueOnce(newPhoto);
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(oldPhoto);
    await click(button("Save photo"));
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(newPhoto);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(newPhoto);
    const remove = [...container.querySelectorAll("button")].find((item) => item.textContent?.toLowerCase().includes("remove"));
    await click(remove ?? null);
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(newPhoto);
    await click(button("Save photo"));
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe("");
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps drafts and saved values after failed writes, never writes the redundant avatar mode, and retries", async () => {
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, "Original");
    const oldPhoto = "data:image/webp;base64,old";
    localStorage.setItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY, oldPhoto);
    await render(<ProfileSettings />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File(["image"], "avatar.png", { type: "image/png" })] });
    vi.mocked(resizeProfileAvatarImage).mockResolvedValueOnce("data:image/webp;base64,new");
    await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
    const original = localStorage.setItem.bind(localStorage);
    const writes: string[] = [];
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
      writes.push(key);
      if (key === PROFILE_AVATAR_IMAGE_STORAGE_KEY || key === DISPLAY_NAME_STORAGE_KEY || key === "alios.profile.avatar") throw new Error("blocked");
      original(key, value);
    });
    await click(button("Save photo"));
    expect(writes).toEqual([PROFILE_AVATAR_IMAGE_STORAGE_KEY]);
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe(oldPhoto);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    const name = container.querySelector<HTMLInputElement>('input:not([type="file"])')!;
    await inputValue(name, "Unsaved");
    await click(button("Save changes"));
    expect(name.value).toBe("Unsaved");
    expect(localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)).toBe("Original");
    failure.mockRestore();
    await click(button("Save photo"));
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe("data:image/webp;base64,new");
    expect(name.value).toBe("Unsaved");
    await click(button("Cancel"));
    expect(name.value).toBe("Original");
    await click(button("Remove photo"));
    await click(button("Cancel photo changes"));
    expect(container.querySelector("img")?.getAttribute("src")).toBe("data:image/webp;base64,new");
  });

  it("does not change a photo when the file dialog is cancelled", async () => {
    localStorage.setItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY, "data:image/webp;base64,kept");
    await render(<ProfileSettings />);
    await act(async () => container.querySelector('input[type="file"]')!.dispatchEvent(new Event("change", { bubbles: true })));
    expect(resizeProfileAvatarImage).not.toHaveBeenCalled();
    expect(localStorage.getItem(PROFILE_AVATAR_IMAGE_STORAGE_KEY)).toBe("data:image/webp;base64,kept");
  });
});
