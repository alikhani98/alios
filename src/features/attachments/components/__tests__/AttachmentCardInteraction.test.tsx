// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Attachment } from "@/shared/types";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { AttachmentCard } from "../AttachmentCard";

const attachment: Attachment = {
  id: "attachment-1",
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename: "book.pdf",
  mimeType: "application/pdf",
  size: 12,
  storageKey: "attachments/attachment-1",
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
};

describe("AttachmentCard interactions", () => {
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

  it("confirms deletion and reports the deleted attachment", async () => {
    const onDeleted = vi.fn();
    const dependencies = {
      attachments: {
        create: vi.fn(),
        getById: vi.fn(async () => attachment),
        listByOwner: vi.fn(),
        delete: vi.fn(async () => undefined),
      },
      binaryStorage: {
        save: vi.fn(),
        retrieve: vi.fn(),
        delete: vi.fn(async () => undefined),
      },
    };

    await act(async () => {
      root.render(
        <I18nProvider>
          <DateDisplayProvider>
            <AttachmentCard
              attachment={attachment}
              workflowDependencies={dependencies}
              onDeleted={onDeleted}
            />
          </DateDisplayProvider>
        </I18nProvider>
      );
      await Promise.resolve();
    });

    const deleteButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Delete attachment")
    );
    expect(deleteButton).not.toBeUndefined();

    await act(async () => {
      deleteButton?.click();
      await Promise.resolve();
    });

    const confirmButton = Array.from(
      container.querySelectorAll("button")
    ).find((button) => button.textContent?.includes("Confirm delete"));
    expect(confirmButton).not.toBeUndefined();

    await act(async () => {
      confirmButton?.click();
      await Promise.resolve();
    });

    expect(dependencies.attachments.delete).toHaveBeenCalledWith(attachment.id);
    expect(dependencies.binaryStorage.delete).toHaveBeenCalledWith(
      attachment.storageKey
    );
    expect(onDeleted).toHaveBeenCalledWith(attachment.id);
  });
});
