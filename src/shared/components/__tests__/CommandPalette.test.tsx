// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { CommandPalette } from "../CommandPalette";

function typeIntoInput(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <MemoryRouter>
      <I18nProvider>
        <CommandPalette
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
        />
      </I18nProvider>
    </MemoryRouter>
  );
}

describe("CommandPalette", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
  });

  it("opens with Ctrl+K", () => {
    act(() => {
      root.render(<Harness />);
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
        })
      );
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("Command Palette");
  });

  it("filters commands by typed label", async () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <CommandPalette open onOpen={() => undefined} onClose={() => undefined} />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[role="searchbox"]'
    );
    expect(input).not.toBeNull();

    await act(async () => {
      typeIntoInput(input!, "finance");
    });

    expect(container.textContent).toContain("Finance");
    expect(container.textContent).not.toContain("Journal");
  });

  it("closes with Escape", () => {
    act(() => {
      root.render(<Harness />);
    });

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        })
      );
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    act(() => {
      container
        .querySelector('[role="dialog"]')
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("keeps Tab focus inside the open command dialog", () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <CommandPalette open onOpen={() => undefined} onClose={() => undefined} />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    const input = container.querySelector<HTMLInputElement>(
      'input[role="searchbox"]'
    );
    const focusableElements = Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
      ) ?? []
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(input).not.toBeNull();
    expect(firstElement).toBeDefined();
    expect(lastElement).toBeDefined();

    act(() => {
      firstElement?.focus();
      dialog?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        })
      );
    });

    expect(document.activeElement).toBe(lastElement);

    act(() => {
      lastElement?.focus();
      dialog?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
        })
      );
    });

    expect(document.activeElement).toBe(firstElement);
  });
});
