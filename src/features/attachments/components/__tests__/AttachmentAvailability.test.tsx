// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { Attachment } from "@/shared/types";
import { AttachmentSection } from "../AttachmentSection";

const attachments: Attachment[] = [
  {
    id: "attachment-1",
    ownerType: "resource",
    ownerId: "resource-1",
    kind: "document",
    filename: "missing.pdf",
    mimeType: "application/pdf",
    size: 12,
    storageKey: "attachments/missing",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
  {
    id: "attachment-2",
    ownerType: "resource",
    ownerId: "resource-1",
    kind: "image",
    filename: "available.png",
    mimeType: "image/png",
    size: 12,
    storageKey: "attachments/available",
    createdAt: "2026-07-05T08:30:00.000Z",
    updatedAt: "2026-07-05T08:30:00.000Z",
  },
];

describe("AttachmentSection binary availability", () => {
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
    act(() => root.unmount());
    container.remove();
  });

  it("checks every attachment concurrently and discloses missing binaries", async () => {
    let activeChecks = 0;
    let maximumConcurrentChecks = 0;
    const resolvers: Array<(value: boolean) => void> = [];
    const has = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          activeChecks += 1;
          maximumConcurrentChecks = Math.max(
            maximumConcurrentChecks,
            activeChecks
          );
          resolvers.push((value) => {
            activeChecks -= 1;
            resolve(value);
          });
        })
    );

    await act(async () => {
      root.render(
        <I18nProvider>
          <DateDisplayProvider>
            <AttachmentSection
              attachments={attachments}
              accessDependencies={{
                attachments: {
                  create: vi.fn(),
                  getById: vi.fn(),
                  listAll: vi.fn(),
                  listByOwner: vi.fn(),
                  delete: vi.fn(),
                },
                binaryStorage: {
                  save: vi.fn(),
                  retrieve: vi.fn(),
                  has,
                  listKeys: vi.fn(),
                  delete: vi.fn(),
                },
              }}
            />
          </DateDisplayProvider>
        </I18nProvider>
      );
      await Promise.resolve();
    });

    expect(has).toHaveBeenCalledTimes(2);
    expect(maximumConcurrentChecks).toBe(2);

    await act(async () => {
      resolvers[0](false);
      resolvers[1](true);
      await Promise.resolve();
    });

    expect(container.textContent).toContain(
      "The file is unavailable because its binary content is missing."
    );
  });
});
