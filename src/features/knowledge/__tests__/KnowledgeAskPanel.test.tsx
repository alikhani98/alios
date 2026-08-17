// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KnowledgeRepository } from "@/core/repositories";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { KnowledgeItem } from "@/shared/types";

import { KnowledgeAskPanel } from "../components/KnowledgeAskPanel";

function typeIntoInput(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function item(id: string, title: string, content: string): KnowledgeItem {
  return {
    id,
    title,
    type: "note",
    content,
    createdAt: "2026-08-17T08:00:00.000Z",
    updatedAt: "2026-08-17T08:00:00.000Z",
  };
}

function repository(items: KnowledgeItem[]): KnowledgeRepository {
  return {
    list: vi.fn(async () => items),
    search: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe("KnowledgeAskPanel", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
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
    vi.useRealTimers();
  });

  it("shows an encouraging empty state when no local notes match", async () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <KnowledgeAskPanel
              knowledgeRepository={repository([
                item("capture", "Inbox rule", "Capture first."),
              ])}
            />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const input = container.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();

    await act(async () => {
      typeIntoInput(input!, "budget");
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Nothing matched");
  });

  it("renders highlighted excerpts and focused links for matching notes", async () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <I18nProvider>
            <KnowledgeAskPanel
              knowledgeRepository={repository([
                item("deep", "Deep work", "Protect deep work every morning."),
              ])}
            />
          </I18nProvider>
        </MemoryRouter>
      );
    });

    const input = container.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();

    await act(async () => {
      typeIntoInput(input!, "deep morning");
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Deep work");
    expect(container.querySelectorAll("mark")).toHaveLength(2);
    expect(container.innerHTML).toContain("/knowledge?focusId=deep");
  });
});
