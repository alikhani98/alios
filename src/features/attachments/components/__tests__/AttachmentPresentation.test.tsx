import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { Attachment } from "@/shared/types";
import { AttachmentCard } from "../AttachmentCard";
import { AttachmentSection } from "../AttachmentSection";

const attachment: Attachment = {
  id: "attachment-1",
  ownerType: "resource",
  ownerId: "resource-1",
  kind: "document",
  filename: "atomic-habits.pdf",
  mimeType: "application/pdf",
  size: 2048,
  storageKey: "attachments/attachment-1",
  createdAt: "2026-07-05T08:30:00.000Z",
  updatedAt: "2026-07-05T08:30:00.000Z",
};

function renderWithProviders(children: ReactNode): string {
  return renderToStaticMarkup(
    <I18nProvider>
      <DateDisplayProvider>{children}</DateDisplayProvider>
    </I18nProvider>
  );
}

describe("Attachment presentation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("renders attachment metadata without loading binary content", () => {
    const markup = renderWithProviders(
      <AttachmentCard attachment={attachment} ownerLabel="Atomic Habits" />
    );

    expect(markup).toContain("atomic-habits.pdf");
    expect(markup).toContain("application/pdf");
    expect(markup).toContain("2 KB");
    expect(markup).toContain("Owner");
    expect(markup).toContain("Atomic Habits");
    expect(markup).not.toContain("Download");
  });

  it("renders an unavailable state for missing metadata", () => {
    const markup = renderWithProviders(<AttachmentCard attachment={null} />);

    expect(markup).toContain("Attachment unavailable");
    expect(markup).toContain("metadata is missing");
  });

  it("renders a reusable empty state for an owner without attachments", () => {
    const markup = renderWithProviders(<AttachmentSection attachments={[]} />);

    expect(markup).toContain("No attachments yet");
    expect(markup).toContain("Attachment metadata will appear here");
  });
});
