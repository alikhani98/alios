import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { buildLocalReminderSnapshot } from "../../localReminderResolver";
import { LocalReminderPanel } from "../LocalReminderPanel";

describe("LocalReminderPanel", () => {
  beforeEach(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  afterEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it("renders separate task and finance reminder groups with existing navigation", () => {
    const snapshot = buildLocalReminderSnapshot(
      [
        {
          id: "task-1",
          title: "Submit report",
          status: "todo",
          priority: "high",
          dueDate: "2026-09-20",
          isMit: false,
          createdAt: "2026-09-01T08:00:00.000Z",
          updatedAt: "2026-09-19T08:00:00.000Z",
        },
      ],
      [
        {
          id: "obligation-1",
          type: "debt",
          title: "Pay installment",
          totalAmount: 500,
          paidAmount: 0,
          dueDate: "2026-09-19",
          status: "active",
          createdAt: "2026-09-01T08:00:00.000Z",
          updatedAt: "2026-09-19T08:00:00.000Z",
        },
      ],
      new Date("2026-09-20T12:00:00.000Z")
    );

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <I18nProvider>
          <LocalReminderPanel snapshot={snapshot} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(markup).toContain("Submit report");
    expect(markup).toContain("Pay installment");
    expect(markup).toContain('href="/today?focusId=task-1"');
    expect(markup).toContain('href="/finance#finance-obligations"');
    expect(markup).toContain("Notifications work only while AliOS is open");
  });

  it("does not render an empty panel", () => {
    const snapshot = buildLocalReminderSnapshot(
      [],
      [],
      new Date("2026-09-20T12:00:00.000Z")
    );

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <I18nProvider>
          <LocalReminderPanel snapshot={snapshot} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(markup).toBe("");
  });
});
