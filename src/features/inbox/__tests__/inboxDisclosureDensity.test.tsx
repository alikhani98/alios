// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type { InboxItem } from "@/shared/types";

import { InboxItemCard } from "../components/InboxItemCard";
import { InboxItemForm } from "../components/InboxItemForm";

function renderInboxForm() {
  return renderToStaticMarkup(
    <I18nProvider>
      <InboxItemForm
        isSubmitting={false}
        onSubmit={async () => true}
      />
    </I18nProvider>
  );
}

function renderInboxCard() {
  const item: InboxItem = {
    id: "inbox-one",
    content: "Process a captured idea",
    type: "idea",
    status: "unprocessed",
    createdAt: "2026-08-11T08:00:00.000Z",
    updatedAt: "2026-08-11T08:00:00.000Z",
  };

  return renderToStaticMarkup(
    <I18nProvider>
      <DateDisplayProvider>
        <InboxItemCard
          item={item}
          isBusy={false}
          isSelected={false}
          onSelectionChange={() => undefined}
          onEdit={async () => true}
          onToggleStatus={async () => undefined}
          onSnooze={async () => undefined}
          onClearSnooze={async () => undefined}
          onConvert={async () => undefined}
          onDelete={async () => undefined}
        />
      </DateDisplayProvider>
    </I18nProvider>
  );
}

describe("Inbox disclosure density", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "SpeechRecognition");
    Reflect.deleteProperty(window, "webkitSpeechRecognition");
  });

  it("keeps quick capture direct while optional type metadata starts collapsed", () => {
    const markup = renderInboxForm();

    expect(markup).toContain("Capture item");
    expect(markup).toContain("Capture");
    expect(markup).toContain('id="inbox-type-details"');
    expect(markup).toContain("Capture details");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="inbox-type-details-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("Type");
  });

  it("shows voice capture only when the browser supports local speech recognition", () => {
    const start = vi.fn();

    class MockSpeechRecognition {
      interimResults = false;
      lang = "";
      maxAlternatives = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null = null;

      start = start;
    }

    Reflect.set(window, "SpeechRecognition", MockSpeechRecognition);
    root = createRoot(container!);
    act(() => {
      root?.render(
        <I18nProvider>
          <InboxItemForm isSubmitting={false} onSubmit={async () => true} />
        </I18nProvider>
      );
    });

    const voiceButton = container!.querySelector(
      'button[aria-label="Dictate capture"]'
    );
    expect(voiceButton).not.toBeNull();
    act(() => {
      voiceButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(start).toHaveBeenCalledTimes(1);
  });

  it("hides voice capture when Web Speech is unavailable", () => {
    root = createRoot(container!);
    act(() => {
      root?.render(
        <I18nProvider>
          <InboxItemForm isSubmitting={false} onSubmit={async () => true} />
        </I18nProvider>
      );
    });

    expect(
      container!.querySelector('button[aria-label="Dictate capture"]')
    ).toBeNull();
  });

  it("adds mobile swipe affordances without removing tap-based inbox actions", () => {
    const markup = renderInboxCard();

    expect(markup).toContain("Process a captured idea");
    expect(markup).toContain("Process Inbox");
    expect(markup).toContain("Snooze");
    expect(markup).toContain("Delete");
    expect(markup).toContain("Edit");
    expect(markup).toContain("md:hidden");
  });

  it("keeps search direct while advanced filters are behind a disclosure", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/inbox/pages/InboxPage.tsx"),
      "utf8"
    );

    expect(source).toContain('id="inbox-search-filters"');
    expect(source).toContain('title={t("inbox.filters")}');
    expect(source).toContain('defaultOpen={false}');
    expect(source).toContain('placeholder={t("inbox.searchPlaceholder")}');
    expect(source).toContain('value={searchQuery}');
  });
});
