// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";

import { CommandPalette } from "../CommandPalette";

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

  it("filters commands by typed label", () => {
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

    act(() => {
      input!.value = "finance";
      input!.dispatchEvent(new Event("input", { bubbles: true }));
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
});
