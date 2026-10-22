// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistentBoolean } from "../usePersistentBoolean";
import { usePersistentString } from "../usePersistentString";
import { LOCAL_PREFERENCE_CHANGE_EVENT } from "@/shared/constants/preferences";

function BooleanHarness({ strict = true }: { strict?: boolean }) {
  const { value, setValue, persistenceFailed } = usePersistentBoolean({ key: "qa.boolean", defaultValue: false, requirePersistence: strict });
  return <><output>{String(value)}</output><button onClick={() => { setValue(v => !v); setValue(v => !v); }}>Twice</button><button onClick={() => setValue(true)}>Enable</button>{persistenceFailed && <p role="alert">Failed</p>}</>;
}
function StringHarness() {
  const { value, setStoredValue, persistenceFailed } = usePersistentString({ key: "qa.string", defaultValue: "old" });
  return <><output>{value}</output><button onClick={() => setStoredValue("new")}>Save</button>{persistenceFailed && <p role="alert">Failed</p>}</>;
}
describe("Settings strict persistence prerequisites", () => {
  let root: Root; let host: HTMLDivElement; let descriptor: PropertyDescriptor | undefined;
  beforeEach(() => {
    descriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
    localStorage.clear(); host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); localStorage.clear();
    if (descriptor) Object.defineProperty(window, "localStorage", descriptor); else Reflect.deleteProperty(window, "localStorage");
  });
  it.each([true, false])("applies two functional updates before rerender, strict=%s", async (strict) => {
    await act(async () => root.render(<BooleanHarness strict={strict} />));
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector("output")?.textContent).toBe("false");
    expect(localStorage.getItem("qa.boolean")).toBe("false");
  });
  it("does not persist defaults in strict mode and preserves active state after failure, then retries", async () => {
    await act(async () => root.render(<BooleanHarness />));
    expect(localStorage.getItem("qa.boolean")).toBeNull();
    const changed = vi.fn(); window.addEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed);
    try {
      const failure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
      await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
      expect(host.querySelector("output")?.textContent).toBe("false"); expect(host.querySelector('[role="alert"]')).not.toBeNull(); expect(changed).not.toHaveBeenCalled();
      failure.mockRestore();
      await act(async () => host.querySelectorAll<HTMLButtonElement>("button")[1].click());
      expect(host.querySelector("output")?.textContent).toBe("true"); expect(localStorage.getItem("qa.boolean")).toBe("true"); expect(changed).toHaveBeenCalledTimes(1);
    } finally { window.removeEventListener(LOCAL_PREFERENCE_CHANGE_EVENT, changed); }
  });
  it("retains string state on failed strict write and unreadable synchronization, then retries", async () => {
    localStorage.setItem("qa.string", "old"); await act(async () => root.render(<StringHarness />));
    const failure = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector("output")?.textContent).toBe("old"); expect(localStorage.getItem("qa.string")).toBe("old"); expect(host.querySelector('[role="alert"]')).not.toBeNull();
    failure.mockRestore(); await act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
    expect(host.querySelector("output")?.textContent).toBe("new"); expect(host.querySelector('[role="alert"]')).toBeNull();
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("unreadable"); });
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: "qa.string" })));
    expect(host.querySelector("output")?.textContent).toBe("new");
  });
});
