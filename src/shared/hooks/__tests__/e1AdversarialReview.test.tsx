// @vitest-environment jsdom
import { act, useEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistentString } from "../usePersistentString";
import { I18nProvider } from "@/shared/i18n";
import { DateDisplayProvider, useDateFormatter } from "@/shared/date";
import { CALENDAR_DISPLAY_STORAGE_KEY } from "@/shared/date/formatDate";
import { resetHomeDashboardLayoutPreference } from "@/features/home/hooks/useHomeDashboardLayout";
import { HOME_DASHBOARD_LAYOUT_STORAGE_KEY } from "@/features/home/dashboardLayout";
import { usePersistentBoolean } from "../usePersistentBoolean";
import { useAccentColorPreference } from "@/shared/preferences/accentColor";
import { LOCAL_PREFERENCE_CHANGE_EVENT, RECOVERY_MODE_ENABLED_STORAGE_KEY, ACCENT_COLOR_STORAGE_KEY } from "@/shared/constants/preferences";
import { applyRecoveryModeUrlFlag } from "@/shared/recovery/recoveryMode";
const observed: { setter?: unknown; returned?: unknown; results?: unknown[] } = {};
function RecoveryConsumer() {
  const { value, setValue } = usePersistentBoolean({ key: RECOVERY_MODE_ENABLED_STORAGE_KEY, defaultValue: false });
  useEffect(() => { if (applyRecoveryModeUrlFlag({ search: "?recovery=1", hash: "" })) setValue(true); }, [setValue]);
  return <><output>{String(value)}</output><button onClick={() => setValue(false)}>Exit recovery</button></>;
}
function LegacyConsumer() {
  const { value, setValue } = usePersistentBoolean({ key: "review.legacy", defaultValue: false });
  observed.setter = setValue;
  return <><output>{String(value)}</output><button onClick={() => { observed.returned = setValue(true); }}>Enable</button></>;
}
function AccentConsumer() {
  const { value, setValue, persistenceFailed } = useAccentColorPreference();
  return <><output>{value}</output><button onClick={() => setValue("violet")}>Violet</button>{persistenceFailed && <span role="alert">Failed</span>}</>;
}
function StrictBooleanConsumer() {
  const { value, setValue, persistenceFailed } = usePersistentBoolean({ key: "review.strict", defaultValue: false, requirePersistence: true });
  return <><output>{String(value)}</output><button onClick={() => { observed.results = [setValue(v => !v), setValue(v => !v)]; }}>Twice</button><button onClick={() => { observed.returned = setValue(v => !v); }}>Toggle</button>{persistenceFailed && <span role="alert">Failed</span>}</>;
}
function StringConsumer({ strict = true }: { strict?: boolean }) {
  const { value, setValue, setStoredValue, persistenceFailed } = usePersistentString({ key: "review.string", defaultValue: "fallback" });
  return <><output>{value}</output><button onClick={() => { observed.returned = strict ? setStoredValue("new") : setValue("new"); }}>Save</button>{persistenceFailed && <span role="alert">Failed</span>}</>;
}
function CalendarConsumer() {
  const { calendarDisplay, setCalendarDisplay } = useDateFormatter();
  return <><output>{calendarDisplay}</output><button onClick={() => { observed.returned = setCalendarDisplay("jalali"); }}>Jalali</button></>;
}
function CalendarSubscribers() {
  return <I18nProvider><DateDisplayProvider><CalendarConsumer /></DateDisplayProvider><DateDisplayProvider><CalendarConsumer /></DateDisplayProvider></I18nProvider>;
}
describe("E1 adversarial compatibility and synchronization", () => {
  let host: HTMLDivElement; let root: Root; let descriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage }); localStorage.clear();
    host = document.createElement("div"); document.body.append(host); root = createRoot(host);
    delete observed.setter; delete observed.returned; delete observed.results;
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
  });
  async function render(node: ReactNode) { await act(async () => root.render(node)); }
  it("preserves the AppShell recovery URL effect contract so the user can exit recovery", async () => {
    await render(<RecoveryConsumer />); expect(host.querySelector("output")?.textContent).toBe("true");
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector("output")?.textContent).toBe("false");
    expect(localStorage.getItem(RECOVERY_MODE_ENABLED_STORAGE_KEY)).toBe("false");
  });
  it("keeps the legacy React dispatch stable across unrelated rerenders", async () => {
    await render(<LegacyConsumer />); const setter = observed.setter;
    await render(<LegacyConsumer />); expect(observed.setter).toBe(setter);
  });
  it("does not introduce a durable-success return value for legacy memory-only updates", async () => {
    await render(<LegacyConsumer />);
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("unavailable"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBeUndefined(); expect(host.querySelector("output")?.textContent).toBe("true");
    expect(localStorage.getItem("review.legacy")).toBe("false");
  });
  it("retains the last readable accent for subscribers when a synchronization read throws", async () => {
    localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, "rose"); await render(<><AccentConsumer /><AccentConsumer /></>);
    const original = localStorage.getItem.bind(localStorage);
    vi.spyOn(localStorage, "getItem").mockImplementation((key) => { if (key === ACCENT_COLOR_STORAGE_KEY) throw new Error("denied"); return original(key); });
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: ACCENT_COLOR_STORAGE_KEY })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["rose", "rose"]);
  });
  it("keeps the last successful Boolean between a successful and failed functional update in one event", async () => {
    await render(<StrictBooleanConsumer />); const native = localStorage.setItem.bind(localStorage); let attempts = 0;
    const listener = vi.fn(); window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, listener);
    try {
      const failure = vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
        if (key === "review.strict" && ++attempts === 2) throw new Error("blocked"); native(key, value);
      });
      await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
      expect(observed.results).toEqual([true, false]); expect(host.querySelector("output")?.textContent).toBe("true");
      expect(localStorage.getItem("review.strict")).toBe("true"); expect(listener).toHaveBeenCalledTimes(1); expect(host.querySelector('[role="alert"]')).not.toBeNull();
      failure.mockRestore();
      await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
      expect(observed.returned).toBe(true); expect(host.querySelector("output")?.textContent).toBe("false");
      expect(localStorage.getItem("review.strict")).toBe("false"); expect(listener).toHaveBeenCalledTimes(2); expect(host.querySelector('[role="alert"]')).toBeNull();
    } finally { window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, listener); }
  });
  it.each(["null", "throwing"])("retains strict Boolean state when storage is %s and allows retry", async (kind) => {
    const memory = localStorage; memory.setItem("review.strict", "true"); await render(<StrictBooleanConsumer />);
    if (kind === "null") Object.defineProperty(window, "localStorage", { configurable: true, value: null });
    else Object.defineProperty(window, "localStorage", { configurable: true, get: () => { throw new Error("denied"); } });
    await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
    expect(observed.returned).toBe(false); expect(host.querySelector("output")?.textContent).toBe("true"); expect(memory.getItem("review.strict")).toBe("true");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: "review.strict" })));
    expect(host.querySelector("output")?.textContent).toBe("true");
    Object.defineProperty(window, "localStorage", { configurable: true, value: memory });
    await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
    expect(observed.returned).toBe(true); expect(memory.getItem("review.strict")).toBe("false"); expect(host.querySelector('[role="alert"]')).toBeNull();
  });
  it("uses successful external Boolean values for the next functional update and clear restores its default", async () => {
    await render(<StrictBooleanConsumer />); localStorage.setItem("review.strict", "true");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: "review.strict" })));
    await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
    expect(localStorage.getItem("review.strict")).toBe("false");
    localStorage.removeItem("review.strict"); await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect(host.querySelector("output")?.textContent).toBe("false");
  });
  it("preserves the legacy String memory fallback without claiming durable success or notifying other subscribers", async () => {
    localStorage.setItem("review.string", "old"); await render(<><StringConsumer strict={false} /><StringConsumer /></>);
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBeUndefined(); expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["new", "old"]); expect(localStorage.getItem("review.string")).toBe("old");
    failure.mockRestore(); await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["new", "new"]);
  });
  it("keeps strict String subscribers unchanged on failure, synchronizes success, and handles external clear", async () => {
    localStorage.setItem("review.string", "old"); await render(<><StringConsumer /><StringConsumer /></>);
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBe(false); expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["old", "old"]);
    failure.mockRestore(); await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBe(true); expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["new", "new"]);
    localStorage.clear(); await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["fallback", "fallback"]);
  });
  it("does not turn a completed String write into failure if event publication throws", async () => {
    await render(<StringConsumer />); vi.spyOn(window, "dispatchEvent").mockImplementation(() => { throw new Error("blocked event"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBe(true); expect(host.querySelector("output")?.textContent).toBe("new"); expect(localStorage.getItem("review.string")).toBe("new"); expect(host.querySelector('[role="alert"]')).toBeNull();
  });
  it("preserves accent subscribers on failed mutation, retries, and accepts a real clear", async () => {
    localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, "rose"); await render(<><AccentConsumer /><AccentConsumer /></>);
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["rose", "rose"]); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    failure.mockRestore(); await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["violet", "violet"]); expect(host.querySelector('[role="alert"]')).toBeNull();
    localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY); await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: ACCENT_COLOR_STORAGE_KEY })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["default", "default"]);
  });
  it("retains accent when storage access is denied and synchronizes after it becomes readable", async () => {
    const memory = localStorage; memory.setItem(ACCENT_COLOR_STORAGE_KEY, "rose"); await render(<AccentConsumer />);
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => { throw new Error("denied"); } });
    await act(async () => window.dispatchEvent(new Event(LOCAL_PREFERENCE_CHANGE_EVENT)));
    expect(host.querySelector("output")?.textContent).toBe("rose");
    Object.defineProperty(window, "localStorage", { configurable: true, value: memory }); memory.setItem(ACCENT_COLOR_STORAGE_KEY, "emerald");
    await act(async () => window.dispatchEvent(new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: { key: ACCENT_COLOR_STORAGE_KEY } })));
    expect(host.querySelector("output")?.textContent).toBe("emerald");
  });
  it("reports calendar failure without changing either provider, then synchronizes a successful retry", async () => {
    localStorage.setItem(CALENDAR_DISPLAY_STORAGE_KEY, "gregorian"); await render(<CalendarSubscribers />);
    const original = localStorage.setItem.bind(localStorage);
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation((key, value) => { if (key === CALENDAR_DISPLAY_STORAGE_KEY) throw new Error("blocked"); original(key, value); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBe(false); expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["gregorian", "gregorian"]); expect(localStorage.getItem(CALENDAR_DISPLAY_STORAGE_KEY)).toBe("gregorian");
    failure.mockRestore(); await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(observed.returned).toBe(true); expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["jalali", "jalali"]);
  });
  it("preserves calendar on unreadable synchronization, ignores unrelated events and accepts valid external changes/clear", async () => {
    localStorage.setItem(CALENDAR_DISPLAY_STORAGE_KEY, "gregorian"); await render(<CalendarSubscribers />);
    const original = localStorage.getItem.bind(localStorage);
    const reads = vi.spyOn(localStorage, "getItem").mockImplementation((key) => { if (key === CALENDAR_DISPLAY_STORAGE_KEY) throw new Error("blocked"); return original(key); });
    await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" })); window.dispatchEvent(new CustomEvent(LOCAL_PREFERENCE_CHANGE_EVENT, { detail: { key: "unrelated" } })); });
    expect(reads).not.toHaveBeenCalled();
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: CALENDAR_DISPLAY_STORAGE_KEY })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["gregorian", "gregorian"]);
    reads.mockRestore(); localStorage.setItem(CALENDAR_DISPLAY_STORAGE_KEY, "jalali");
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: CALENDAR_DISPLAY_STORAGE_KEY })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["jalali", "jalali"]);
    localStorage.removeItem(CALENDAR_DISPLAY_STORAGE_KEY); await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect([...host.querySelectorAll("output")].map(x => x.textContent)).toEqual(["auto", "auto"]);
  });
  it("returns false from dashboard reset on removal failure and true only after an actual retry", () => {
    localStorage.setItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY, "saved layout");
    const listener = vi.fn(); window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, listener);
    try {
      const failure = vi.spyOn(localStorage, "removeItem").mockImplementation(() => { throw new Error("blocked"); });
      expect(resetHomeDashboardLayoutPreference()).toBe(false); expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBe("saved layout"); expect(listener).not.toHaveBeenCalled();
      failure.mockRestore(); expect(resetHomeDashboardLayoutPreference()).toBe(true); expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBeNull(); expect(listener).toHaveBeenCalledTimes(1);
    } finally { window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, listener); }
  });

});
