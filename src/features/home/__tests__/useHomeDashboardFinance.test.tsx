// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import type { FinanceObligation, FinanceTransaction } from "@/shared/types";
import { financeObligationRecord, financeTransactionRecord } from "@/test/factories";
import { HomeFinanceOverviewCard } from "../components/HomeFinanceOverviewCard";
import { useHomeDashboard } from "../hooks/useHomeDashboard";

const transactions = vi.fn<() => Promise<FinanceTransaction[]>>();
const obligations = vi.fn<() => Promise<FinanceObligation[]>>();
const createTransaction = vi.fn();
const createObligation = vi.fn();
function createListRepository() {
  return { list: vi.fn<() => Promise<never[]>>() };
}
const listRepositories = {
  tasks: createListRepository(),
  dailyCheckins: createListRepository(),
  projects: createListRepository(),
  journal: createListRepository(),
  knowledge: createListRepository(),
  goals: createListRepository(),
  lifeAreas: createListRepository(),
  manual: createListRepository(),
  inbox: createListRepository(),
  routines: createListRepository(),
  resources: createListRepository(),
};
const repositories = {
  ...listRepositories,
  weeklyPlans: { getByWeekStart: vi.fn().mockResolvedValue(undefined) },
  finance: { listTransactions: transactions, listObligations: obligations, createTransaction, createObligation },
};
vi.mock("@/core/storage", () => ({ useStorageAdapter: () => repositories }));

let latest: ReturnType<typeof useHomeDashboard>;
function Harness() {
  latest = useHomeDashboard();
  return <HomeFinanceOverviewCard state={latest.financeOverview} onRetry={() => void latest.loadDashboard()} />;
}

describe("Home Finance loading ownership", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(async () => {
    await loadMessages("en");
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    vi.clearAllMocks();
    // Vitest 2 restoreAllMocks also resets standalone vi.fn implementations.
    for (const repository of Object.values(listRepositories)) {
      repository.list.mockReset().mockResolvedValue([]);
    }
    repositories.weeklyPlans.getByWeekStart.mockReset().mockResolvedValue(undefined);
    transactions.mockReset().mockResolvedValue([]);
    obligations.mockReset().mockResolvedValue([]);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });
  async function mount() {
    await act(async () => root.render(<MemoryRouter><I18nProvider><Harness /></I18nProvider></MemoryRouter>));
  }

  it("shares one read per Finance collection and performs no reads or writes when toggling", async () => {
    transactions.mockResolvedValue([{ ...financeTransactionRecord, occurredAt: new Date().toISOString().slice(0, 10) }]);
    await mount();
    expect(transactions).toHaveBeenCalledOnce();
    expect(obligations).toHaveBeenCalledOnce();
    expect(latest.financeOverview.data?.transactionCount).toBe(1);
    expect(latest.financeOverview.hasError).toBe(false);
    expect(latest.data?.finance).toBe(latest.financeOverview.data);
    expect(latest.hasError).toBe(false);
    for (const repository of Object.values(listRepositories)) {
      expect(repository.list).toHaveBeenCalledOnce();
    }
    const before = structuredClone(latest.financeOverview.data);
    const localWrite = vi.spyOn(localStorage, "setItem");
    const browserWrite = vi.spyOn(Storage.prototype, "setItem");
    await act(async () => container.querySelector<HTMLButtonElement>("button[aria-pressed]")?.click());
    await act(async () => container.querySelector<HTMLButtonElement>("button[aria-pressed]")?.click());
    expect(transactions).toHaveBeenCalledOnce();
    expect(obligations).toHaveBeenCalledOnce();
    expect(createTransaction).not.toHaveBeenCalled();
    expect(createObligation).not.toHaveBeenCalled();
    expect(localWrite).not.toHaveBeenCalled();
    expect(browserWrite).not.toHaveBeenCalled();
    expect(latest.financeOverview.data).toEqual(before);
  });

  it("represents pending Finance reads without invented zero data", async () => {
    let resolveTransactions: (value: FinanceTransaction[]) => void = () => {};
    transactions.mockReturnValue(new Promise((resolve) => { resolveTransactions = resolve; }));
    await mount();
    expect(latest.financeOverview).toEqual({ data: null, isLoading: true, hasError: false });
    expect(container.querySelectorAll("dd")).toHaveLength(0);
    await act(async () => resolveTransactions([]));
    expect(latest.financeOverview.data?.transactionCount).toBe(0);
    expect(latest.financeOverview.hasError).toBe(false);
  });

  it.each(["transactions", "obligations"] as const)("isolates initial %s failure, retains other Home data and recovers on retry", async (collection) => {
    const failing = collection === "transactions" ? transactions : obligations;
    failing.mockRejectedValueOnce(new Error("Storage unavailable"));
    await mount();
    expect(latest.hasError).toBe(false);
    expect(latest.data).not.toBeNull();
    expect(latest.data?.finance).toBeNull();
    expect(latest.data?.isEmpty).toBe(false);
    expect(latest.financeOverview).toEqual({ data: null, isLoading: false, hasError: true });
    expect(container.querySelectorAll("dd")).toHaveLength(0);
    const retry = Array.from(container.querySelectorAll("button")).find((entry) => entry.textContent?.includes("Retry financial summary"));
    await act(async () => retry?.click());
    expect(latest.financeOverview.hasError).toBe(false);
    expect(latest.financeOverview.data?.transactionCount).toBe(0);
    expect(latest.data?.isEmpty).toBe(true);
    expect(transactions).toHaveBeenCalledTimes(2);
    expect(obligations).toHaveBeenCalledTimes(2);
  });

  it("retains the previous valid summary after refresh failure and clears stale status on recovery", async () => {
    const source = { ...financeTransactionRecord, occurredAt: "2026-10-01", amount: 12345 };
    transactions.mockResolvedValue([source]);
    obligations.mockResolvedValue([{ ...financeObligationRecord, status: "active", totalAmount: 0, paidAmount: 0 }]);
    await mount();
    const previous = latest.financeOverview.data;
    obligations.mockRejectedValueOnce(new Error("Refresh failed"));
    await act(async () => latest.loadDashboard());
    expect(latest.financeOverview.data).toBe(previous);
    expect(latest.data?.finance).toBe(previous);
    expect(latest.financeOverview.hasError).toBe(true);
    expect(container.textContent).toContain("may be outdated");
    expect(latest.hasError).toBe(false);
    await act(async () => latest.loadDashboard());
    expect(latest.financeOverview.hasError).toBe(false);
    expect(latest.financeOverview.data?.activeObligationCount).toBe(1);
    expect(container.textContent).not.toContain("may be outdated");
  });

  it("keeps an unrelated Home read failure out of Finance error state", async () => {
    listRepositories.tasks.list.mockRejectedValueOnce(new Error("Task read failed"));
    await mount();
    expect(latest.hasError).toBe(true);
    expect(latest.data).toBeNull();
    expect(latest.financeOverview.hasError).toBe(false);
    expect(latest.financeOverview.data?.transactionCount).toBe(0);
    await act(async () => latest.loadDashboard());
    expect(latest.hasError).toBe(false);
    expect(latest.data?.finance).toBe(latest.financeOverview.data);
  });

  it("ignores an older Finance read that completes after a newer refresh", async () => {
    let finishOld: (value: FinanceTransaction[]) => void = () => {};
    transactions.mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve; }));
    await mount();
    transactions.mockResolvedValue([{ ...financeTransactionRecord, id: "new" }]);
    await act(async () => latest.loadDashboard());
    const current = latest.financeOverview.data;
    await act(async () => finishOld([]));
    expect(latest.financeOverview.data).toBe(current);
    expect(latest.data?.finance).toBe(current);
    expect(latest.financeOverview.data?.transactionCount).toBe(1);
  });
});
