// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
  MORNING_WARMUP_ENABLED_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { usePersistentBoolean } from "@/shared/hooks/usePersistentBoolean";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { HomeRoutineNudgeCard } from "../components/HomeRoutineNudgeCard";

function SettingsToggle() {
  const { value, setValue } = usePersistentBoolean({ key: MORNING_WARMUP_ENABLED_STORAGE_KEY, defaultValue: true });
  return <button type="button" aria-label="Warm-up preference" aria-pressed={value}
    onClick={() => setValue(!value)}>Toggle warm-up</button>;
}

describe("restored Home warm-up connection", () => {
  let container: HTMLDivElement;
  let root: Root;
  const viewRoutine = vi.fn();

  beforeEach(async () => {
    await loadMessages("en");
    await loadMessages("fa");
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 5, 30));
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(MORNING_WARMUP_ENABLED_STORAGE_KEY, "true");
    viewRoutine.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function render() {
    await act(async () => root.render(<MemoryRouter><I18nProvider>
      <SettingsToggle />
      <HomeRoutineNudgeCard id="warmup-test" sectionId="routineNudge" open
        onOpenChange={() => {}} onViewRoutine={viewRoutine} />
    </I18nProvider></MemoryRouter>));
  }
  function card() { return container.querySelector("#warmup-test"); }
  function button(label: string) {
    const element = Array.from(container.querySelectorAll("button")).find((entry) =>
      entry.getAttribute("aria-label") === label || entry.textContent?.trim() === label);
    if (!element) throw new Error("Missing button: " + label);
    return element;
  }
  async function click(label: string) { await act(async () => button(label).click()); }

  it.each([[4, 59, false], [5, 0, true], [6, 59, true], [7, 0, false]] as const)(
    "uses the established local time window at %s:%s", async (hour, minute, visible) => {
      vi.setSystemTime(new Date(2026, 7, 9, hour, minute));
      await render();
      expect(card() !== null).toBe(visible);
    });

  it("reacts to the same persisted enable preference as Settings, including after remount", async () => {
    await render();
    expect(card()).not.toBeNull();
    await click("Warm-up preference");
    expect(card()).toBeNull();
    expect(window.localStorage.getItem(MORNING_WARMUP_ENABLED_STORAGE_KEY)).toBe("false");
    await act(async () => root.render(null));
    await render();
    expect(card()).toBeNull();
    await click("Warm-up preference");
    expect(card()).not.toBeNull();
  });

  it("dismisses only for today's local date and restores the card the following morning", async () => {
    await render();
    await click(messagesEn["home.dismissForToday"]);
    expect(card()).toBeNull();
    expect(window.localStorage.getItem(MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY)).toBe("2026-08-09");
    expect(window.localStorage.getItem(MORNING_WARMUP_ENABLED_STORAGE_KEY)).toBe("true");
    await act(async () => root.render(null));
    await render();
    expect(card()).toBeNull();
    vi.setSystemTime(new Date(2026, 7, 10, 5, 30));
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(card()).not.toBeNull();
  });

  it("disables the existing preference from the card and updates the Settings toggle", async () => {
    await render();
    await click(messagesEn["home.disableReminder"]);
    expect(card()).toBeNull();
    expect(button("Warm-up preference").getAttribute("aria-pressed")).toBe("false");
    expect(window.localStorage.getItem(MORNING_WARMUP_ENABLED_STORAGE_KEY)).toBe("false");
  });

  it("updates when an open page enters or leaves the time window", async () => {
    vi.setSystemTime(new Date(2026, 7, 9, 4, 59));
    await render();
    expect(card()).toBeNull();
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(card()).not.toBeNull();
    vi.setSystemTime(new Date(2026, 7, 9, 6, 59));
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(card()).toBeNull();
  });

  it.each(["en", "fa"] as const)("retains local-only guidance and existing template actions in %s", async (language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const messages = language === "fa" ? messagesFa : messagesEn;
    await render();
    expect(card()?.textContent).toContain(messages["home.morningWarmupTitle"]);
    expect(card()?.textContent).toContain(messages["settings.noPushNotification"]);
    const settingsLink = card()?.querySelector<HTMLAnchorElement>('a[href="/settings"]');
    expect(settingsLink?.textContent).toContain(messages["home.goSettings"]);
    expect(settingsLink?.getAttribute("href")).toBe("/settings");
    await click(messages["routines.viewRoutine"]);
    expect(viewRoutine).toHaveBeenLastCalledWith("morningWarmup");
    await click(messages["wellness.badmintonRoutineTitle"]);
    expect(viewRoutine).toHaveBeenLastCalledWith("parkBadmintonRoutine");
  });
});
