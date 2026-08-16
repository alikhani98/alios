// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StorageAdapterProvider } from "@/core/storage";
import type { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { createTestStorage, destroyTestDatabase } from "@/test/database";
import { InboxPage } from "../pages/InboxPage";

function getButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((node) =>
    node.textContent?.includes(label)
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`);
  }

  return button;
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForInboxCount(storage: DexieStorageAdapter, count: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const items = await storage.inbox.list();
    if (items.length === count) {
      return items;
    }

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
  }

  return storage.inbox.list();
}

async function renderInboxPage(storage: DexieStorageAdapter): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/inbox"]}>
        <StorageAdapterProvider adapter={storage}>
          <I18nProvider>
            <DateDisplayProvider>
              <InboxPage />
            </DateDisplayProvider>
          </I18nProvider>
        </StorageAdapterProvider>
      </MemoryRouter>
    );
  });
  await flushEffects();

  return { container, root };
}

describe("InboxPage bulk actions", () => {
  let database: AliosDatabase;
  let storage: DexieStorageAdapter;
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    ({ database, storage } = await createTestStorage());
    await storage.inbox.create({ content: "First captured item", type: "note" });
    await storage.inbox.create({ content: "Second captured item", type: "task" });
    await storage.inbox.create({ content: "Keep this item", type: "idea" });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
    await destroyTestDatabase(database);
  });

  it("selects multiple inbox items and deletes only the selected records", async () => {
    ({ container, root } = await renderInboxPage(storage));

    await act(async () => {
      getButton(container!, "Select").click();
    });

    const checkboxes = Array.from(
      container!.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    );
    expect(checkboxes).toHaveLength(3);

    await act(async () => {
      checkboxes[0]?.click();
      checkboxes[1]?.click();
    });

    expect(container!.textContent).toContain("2 selected");

    await act(async () => {
      getButton(container!, "Delete selected").click();
    });
    await act(async () => {
      getButton(container!, "Confirm delete selected").click();
    });

    const remaining = await waitForInboxCount(storage, 1);
    expect(remaining).toHaveLength(1);
    expect([
      "First captured item",
      "Second captured item",
      "Keep this item",
    ]).toContain(remaining[0]?.content);
  });

  it("selects all visible inbox items and clears the selection", async () => {
    ({ container, root } = await renderInboxPage(storage));

    await act(async () => {
      getButton(container!, "Select").click();
    });
    await act(async () => {
      getButton(container!, "Select all visible").click();
    });

    expect(container!.textContent).toContain("3 selected");

    await act(async () => {
      getButton(container!, "Clear selection").click();
    });

    expect(container!.textContent).toContain("0 selected");
    const checkboxes = Array.from(
      container!.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    );
    expect(checkboxes.every((checkbox) => !checkbox.checked)).toBe(true);
  });

  it("exits bulk select mode with Escape", async () => {
    ({ container, root } = await renderInboxPage(storage));

    await act(async () => {
      getButton(container!, "Select").click();
    });

    expect(container!.textContent).toContain("tap a card");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(container!.textContent).not.toContain("tap a card");
    expect(container!.querySelector('input[type="checkbox"]')).toBeNull();
  });
});
