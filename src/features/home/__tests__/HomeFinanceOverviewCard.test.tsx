// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatFinanceAmount } from "@/features/finance/financeCalculations";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { messagesFa } from "@/shared/i18n/messages.fa";
import { financeTransactionRecord } from "@/test/factories";
import { HomeFinanceOverviewCard } from "../components/HomeFinanceOverviewCard";
import { buildHomeFinanceOverview, type HomeFinanceOverviewState } from "../homeFinanceOverview";

const date = new Date(2026, 9, 19);
const snapshot = buildHomeFinanceOverview([
  { ...financeTransactionRecord, id: "income", type: "income", occurredAt: "2026-10-01", amount: 12345 },
  { ...financeTransactionRecord, id: "expense", type: "expense", occurredAt: "2026-10-31", amount: 98765 },
], [], date);

describe("Home Finance privacy and states", () => {
  let container: HTMLDivElement;
  let root: Root;
  const retry = vi.fn();

  beforeEach(async () => {
    await loadMessages("en");
    await loadMessages("fa");
    localStorage.clear();
    window.localStorage.clear();
    retry.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });
  async function render(state: HomeFinanceOverviewState, language: "en" | "fa" = "en") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await act(async () => root.render(<MemoryRouter><I18nProvider>
      <HomeFinanceOverviewCard state={state} onRetry={retry} />
    </I18nProvider></MemoryRouter>));
  }
  function privacy() {
    const button = container.querySelector<HTMLButtonElement>("button[aria-pressed]");
    if (!button) throw new Error("Missing privacy control");
    return button;
  }
  function expectHidden(locale: "en-US" | "fa-IR") {
    for (const value of [12345, 98765, -86420]) {
      // innerHTML covers text and all DOM attributes, including accessible descriptions.
      expect(container.innerHTML).not.toContain(formatFinanceAmount(value, locale));
    }
    expect(container.querySelectorAll('dd [aria-label]')).toHaveLength(3);
    expect(privacy().getAttribute("aria-pressed")).toBe("false");
  }

  it.each(["en", "fa"] as const)("hides by default and toggles every amount without persistence in %s", async (language) => {
    const locale = language === "fa" ? "fa-IR" : "en-US";
    const messages = language === "fa" ? messagesFa : messagesEn;
    const original = structuredClone(snapshot);
    await render({ data: snapshot, isLoading: false, hasError: false }, language);
    expectHidden(locale);
    expect(container.querySelector('[role="region"]')?.getAttribute("dir")).toBe(language === "fa" ? "rtl" : "ltr");
    expect(container.textContent).toContain(messages["home.financeRecordedIncome"]);
    expect(container.textContent).toContain(messages["home.financeRecordedExpenses"]);
    expect(container.textContent).toContain(messages["home.financeTransactionNet"]);
    expect(container.textContent).toContain(messages["home.financeActiveObligations"]);
    expect(container.textContent).toContain(messages["home.financeDisclaimer"]);
    expect(container.querySelector('a')?.getAttribute("href")).toBe("/finance");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const localWrite = vi.spyOn(localStorage, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");
    const clear = vi.spyOn(Storage.prototype, "clear");
    privacy().focus();
    expect(document.activeElement).toBe(privacy());
    expect(privacy().type).toBe("button");
    expect(privacy().tabIndex).toBe(0);
    await act(async () => privacy().click());
    expect(privacy().getAttribute("aria-pressed")).toBe("true");
    expect(privacy().getAttribute("aria-label")).toBe(messages["home.financeHideAmounts"]);
    for (const value of [12345, 98765, -86420]) {
      expect(container.textContent).toContain(formatFinanceAmount(value, locale));
    }
    await act(async () => privacy().click());
    expectHidden(locale);
    expect(setItem).not.toHaveBeenCalled();
    expect(localWrite).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect(snapshot).toEqual(original);
    await act(async () => privacy().click());
    await act(async () => root.render(null));
    await render({ data: snapshot, isLoading: false, hasError: false }, language);
    expectHidden(locale);
  });

  it("does not fabricate metrics while loading or after an initial failure, and exposes retry", async () => {
    await render({ data: null, isLoading: true, hasError: false });
    expect(container.textContent).toContain(messagesEn["home.financeLoading"]);
    expect(container.querySelectorAll("dd")).toHaveLength(0);
    expect(privacy().disabled).toBe(true);
    await render({ data: null, isLoading: false, hasError: true });
    expect(container.textContent).toContain(messagesEn["home.financeError"]);
    expect(container.textContent).not.toContain(messagesEn["home.financeEmpty"]);
    expect(container.querySelectorAll("dd")).toHaveLength(0);
    const button = Array.from(container.querySelectorAll("button")).find((entry) => entry.textContent === messagesEn["home.financeRetry"]);
    await act(async () => button?.click());
    expect(retry).toHaveBeenCalledOnce();
  });

  it("retains valid data and marks a refresh failure as stale, including while retrying", async () => {
    await render({ data: snapshot, isLoading: false, hasError: false });
    await act(async () => privacy().click());
    await render({ data: snapshot, isLoading: false, hasError: true });
    expect(container.textContent).toContain(messagesEn["home.financeStale"]);
    expect(container.textContent).toContain("-86,420");
    await render({ data: snapshot, isLoading: true, hasError: true });
    expect(container.textContent).toContain(messagesEn["home.financeStale"]);
    expect(container.textContent).toContain(messagesEn["home.financeRefreshing"]);
    expect(container.textContent).toContain("-86,420");
  });

  it("distinguishes empty records, older history, and genuine recorded zero", async () => {
    await render({ data: buildHomeFinanceOverview([], [], date), isLoading: false, hasError: false });
    expect(container.textContent).toContain(messagesEn["home.financeEmpty"]);
    await act(async () => privacy().click());
    expect(Array.from(container.querySelectorAll("dd bdi")).map((entry) => entry.textContent)).toEqual(["0", "0", "0"]);
    const history = buildHomeFinanceOverview([{ ...financeTransactionRecord, occurredAt: "2026-09-30" }], [], date);
    await render({ data: history, isLoading: false, hasError: false });
    expect(container.textContent).toContain(messagesEn["home.financeNoMonthlyTransactions"]);
    expect(container.textContent).not.toContain(messagesEn["home.financeEmpty"]);
    const zero = buildHomeFinanceOverview([{ ...financeTransactionRecord, occurredAt: "2026-10-01", amount: 0 }], [], date);
    await render({ data: zero, isLoading: false, hasError: false });
    expect(container.textContent).not.toContain(messagesEn["home.financeNoMonthlyTransactions"]);
    expect(container.querySelectorAll("dd bdi")).toHaveLength(3);
  });
});
