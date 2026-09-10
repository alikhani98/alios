// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { resourceRecord } from "@/test/factories";
import { ResourceCard } from "../components/ResourceCard";

describe("ResourceCard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        <I18nProvider>
          <ResourceCard
            resource={resourceRecord}
            isDeleting={false}
            onEdit={vi.fn()}
            onDelete={vi.fn(async () => undefined)}
          />
        </I18nProvider>
      );
      await Promise.resolve();
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders the resource title, type, status, and progress", () => {
    expect(container.textContent).toContain(resourceRecord.title);
    expect(container.textContent).toContain("Document");
    expect(container.textContent).toContain("In progress");
    expect(container.textContent).toContain("40%");
  });

  it("keeps edit and delete actions available", () => {
    expect(
      Array.from(container.querySelectorAll("button")).map(
        (button) => button.textContent
      )
    ).toEqual(expect.arrayContaining(["Edit", "Delete"]));
  });
});
