// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KnowledgeRepository } from "@/core/repositories";
import type { AttachmentWorkflowDependencies } from "@/features/attachments";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { QUICK_ACCESS_STORAGE_KEY, readQuickAccessPreference } from "@/shared/quickAccess/quickAccess";
import { knowledgeItemRecord } from "@/test/factories";

const storageMock = vi.hoisted(() => vi.fn());
vi.mock("@/core/storage", () => ({ useStorageAdapter: storageMock }));

import { KnowledgePage } from "../pages/KnowledgePage";

describe("Knowledge controlled overflow menus", () => {
  let container: HTMLDivElement;
  let root: Root;
  let utilityStyle: HTMLStyleElement;
  const createAttachment = vi.fn<AttachmentWorkflowDependencies["attachments"]["create"]>();
  const saveBinary = vi.fn<AttachmentWorkflowDependencies["binaryStorage"]["save"]>();
  const deleteAttachment = vi.fn<AttachmentWorkflowDependencies["attachments"]["delete"]>();

  function element<T extends Element>(selector: string): T {
    const result = container.querySelector<T>(selector);
    if (!result) throw new Error(`Missing element: ${selector}`);
    return result;
  }

  function trigger(index: number): HTMLButtonElement {
    const result = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Quick actions"]'
    )[index];
    if (!result) throw new Error(`Missing trigger ${index}`);
    return result;
  }

  function panel(index: number): HTMLElement {
    const panelId = trigger(index).getAttribute("aria-controls");
    const result = panelId ? document.getElementById(panelId) : null;
    if (!result) throw new Error(`Missing panel ${index}`);
    return result;
  }

  function click(target: HTMLElement) {
    act(() => {
      target.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      target.focus();
      target.click();
    });
  }

  function action(index: number, name: string): HTMLButtonElement {
    const result = Array.from(panel(index).querySelectorAll("button"))
      .find((button) => button.textContent?.trim() === name);
    if (!result) throw new Error(`Missing action ${name}`);
    return result;
  }

  function fileInput(index: number): HTMLInputElement {
    const result = panel(index).querySelector<HTMLInputElement>('input[type="file"]');
    if (!result) throw new Error("Missing file input");
    return result;
  }

  async function selectFile(index: number, file?: File) {
    const input = fileInput(index);
    Object.defineProperty(input, "files", { configurable: true, value: file ? [file] : [] });
    await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); });
  }

  async function renderPage(key = "initial") {
    await act(async () => {
      root.render(
        <MemoryRouter key={key} initialEntries={["/knowledge"]}>
          <I18nProvider>
            <DateDisplayProvider><KnowledgePage /></DateDisplayProvider>
          </I18nProvider>
        </MemoryRouter>
      );
    });
  }

  function expectClosed(index: number) {
    expect(trigger(index).getAttribute("aria-expanded")).toBe("false");
    expect(panel(index).hidden).toBe(true);
    expect(getComputedStyle(panel(index)).display).toBe("none");
  }

  function expectOpen(index: number) {
    expect(trigger(index).getAttribute("aria-expanded")).toBe("true");
    expect(panel(index).hidden).toBe(false);
    expect(getComputedStyle(panel(index)).display).toBe("grid");
  }

  beforeEach(async () => {
    localStorage.clear();
    window.localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    createAttachment.mockReset();
    createAttachment.mockImplementation(async (input) => ({
      ...input,
      id: `new-attachment-${createAttachment.mock.calls.length}`,
      createdAt: knowledgeItemRecord.createdAt,
      updatedAt: knowledgeItemRecord.updatedAt,
    }));
    saveBinary.mockReset();
    saveBinary.mockResolvedValue(undefined);
    deleteAttachment.mockReset();
    deleteAttachment.mockResolvedValue(undefined);
    const items = [
      { ...knowledgeItemRecord, id: "first", title: "First note" },
      { ...knowledgeItemRecord, id: "second", title: "Second note" },
    ];
    const knowledge: KnowledgeRepository = {
      list: vi.fn(async () => items),
      search: vi.fn(async () => items),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const workflow: AttachmentWorkflowDependencies = {
      attachments: {
        create: createAttachment,
        getById: vi.fn(),
        listAll: vi.fn(async () => []),
        listByOwner: vi.fn(async () => []),
        delete: deleteAttachment,
      },
      binaryStorage: {
        save: saveBinary,
        retrieve: vi.fn(),
        has: vi.fn(async () => true),
        listKeys: vi.fn(async () => []),
        delete: vi.fn(),
      },
    };
    storageMock.mockReturnValue({
      knowledge,
      projects: { list: async () => [] },
      goals: { list: async () => [] },
      tasks: { list: async () => [] },
      resources: { list: async () => [] },
      attachments: workflow.attachments,
      attachmentBinary: workflow.binaryStorage,
    });
    // Reproduce the author-level grid rule that overrides the native hidden rule.
    utilityStyle = document.createElement("style");
    utilityStyle.textContent = ".grid { display: grid; }";
    document.head.appendChild(utilityStyle);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await renderPage();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    utilityStyle.remove();
    localStorage.clear();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps both action labels hidden initially even with the grid utility", () => {
    for (const index of [0, 1]) {
      expectClosed(index);
      expect(panel(index).textContent).toContain("Add attachment");
      expect(panel(index).textContent).toContain("Add to Quick Access");
    }
  });

  it("opens only the selected card and toggles it closed without an action", () => {
    click(trigger(0));
    expectOpen(0);
    expectClosed(1);
    click(trigger(1));
    expectClosed(0);
    expectOpen(1);
    click(trigger(1));
    expectClosed(1);
    expect(createAttachment).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(QUICK_ACCESS_STORAGE_KEY)).toBeNull();
  });

  it("dismisses outside and with Escape without invoking actions", () => {
    click(trigger(0));
    act(() => {
      document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    expectClosed(0);
    click(trigger(1));
    const action = panel(1).querySelector<HTMLButtonElement>("button[aria-pressed]");
    if (!action) throw new Error("Missing quick-access action");
    act(() => action.focus());
    act(() => {
      action.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expectClosed(1);
    expect(document.activeElement).toBe(trigger(1));
    expect(createAttachment).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(QUICK_ACCESS_STORAGE_KEY)).toBeNull();
  });

  it("dismisses when keyboard focus leaves the menu", () => {
    click(trigger(0));
    act(() => trigger(1).focus());
    expectClosed(0);
    expectClosed(1);
    expect(document.activeElement).toBe(trigger(1));
  });

  it("executes the quick-access action exactly once and restores trigger focus", () => {
    const write = vi.spyOn(window.localStorage, "setItem");
    click(trigger(0));
    const action = panel(0).querySelector<HTMLButtonElement>("button[aria-pressed]");
    if (!action) throw new Error("Missing quick-access action");
    click(action);
    expectClosed(0);
    expect(document.activeElement).toBe(trigger(0));
    expect(write.mock.calls.filter(([key]) => key === QUICK_ACCESS_STORAGE_KEY)).toHaveLength(1);
    expect(window.localStorage.getItem(QUICK_ACCESS_STORAGE_KEY)).toContain("knowledge:first");
    expect(createAttachment).not.toHaveBeenCalled();
  });

  it("keeps the file input alive after selection and does not close another menu on completion", async () => {
    let finishSave: () => void = () => { throw new Error("Save has not started"); };
    saveBinary.mockImplementation(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    click(trigger(0));
    const input = fileInput(0);
    const pickerClick = vi.fn();
    input.addEventListener("click", pickerClick);
    click(action(0, "Add attachment"));
    expect(pickerClick).toHaveBeenCalledTimes(1);
    expectOpen(0);
    expect(input.isConnected).toBe(true);
    expect(createAttachment).not.toHaveBeenCalled();

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File(["note"], "note.txt", { type: "text/plain" })],
    });
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(createAttachment).toHaveBeenCalledTimes(1);
    expect(saveBinary).toHaveBeenCalledTimes(1);
    expectClosed(0);
    click(trigger(1));
    await act(async () => { finishSave(); });
    expectClosed(0);
    expectOpen(1);
    expect(container.querySelector(".knowledge-item-content")?.textContent).toContain("note.txt");
    expect(createAttachment).toHaveBeenCalledTimes(1);
  });

  it("keeps cancellation inert and assigns repeated selections to the correct owner", async () => {
    click(trigger(1));
    const firstPicker = vi.fn();
    const secondPicker = vi.fn();
    fileInput(0).addEventListener("click", firstPicker);
    fileInput(1).addEventListener("click", secondPicker);
    click(action(1, "Add attachment"));
    expect(firstPicker).not.toHaveBeenCalled();
    expect(secondPicker).toHaveBeenCalledTimes(1);
    await selectFile(1);
    expect(createAttachment).not.toHaveBeenCalled();
    expectOpen(1);
    const file = new File(["content"], "second.txt", { type: "text/plain" });
    await selectFile(1, file);
    expect(createAttachment).toHaveBeenCalledWith(expect.objectContaining({
      ownerType: "knowledge", ownerId: "second", filename: "second.txt",
    }));
    expect(saveBinary).toHaveBeenCalledWith(expect.any(String), file);
    expect(container.textContent).toContain("Attachment added.");
    expectClosed(1);
    click(trigger(1));
    click(action(1, "Add attachment"));
    await selectFile(1, new File(["more"], "another.txt"));
    expect(createAttachment).toHaveBeenCalledTimes(2);
    expect(saveBinary).toHaveBeenCalledTimes(2);
    expect(fileInput(1).value).toBe("");
  });

  it("ignores duplicate selection events while an upload is pending", async () => {
    let finishSave: () => void = () => { throw new Error("Save has not started"); };
    saveBinary.mockImplementation(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    click(trigger(0));
    const file = new File(["content"], "once.txt");
    await selectFile(0, file);
    await selectFile(0, file);
    expect(createAttachment).toHaveBeenCalledTimes(1);
    expect(saveBinary).toHaveBeenCalledTimes(1);
    await act(async () => { finishSave(); });
    expect(container.textContent).toContain("Attachment added.");
  });

  it("shows validation errors outside the closed menu and allows retry", async () => {
    click(trigger(0));
    await selectFile(0, new File([], "empty.txt"));
    expectClosed(0);
    const alert = element<HTMLElement>('[role="alert"]');
    expect(alert.closest('[hidden]')).toBeNull();
    expect(alert.textContent).toContain("could not be added");
    expect(createAttachment).not.toHaveBeenCalled();
    click(trigger(0));
    await selectFile(0, new File(["valid"], "valid.txt"));
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(createAttachment).toHaveBeenCalledTimes(1);
  });

  it("reports metadata failures without trying to save binary data", async () => {
    createAttachment.mockRejectedValueOnce(new Error("Metadata unavailable"));
    click(trigger(0));
    await selectFile(0, new File(["valid"], "note.txt"));
    expect(element('[role="alert"]').textContent).toContain("could not be added");
    expect(container.textContent).not.toContain("Attachment added.");
    expect(saveBinary).not.toHaveBeenCalled();
  });

  it("preserves the workflow rollback and reports binary storage failure", async () => {
    saveBinary.mockRejectedValueOnce(new Error("Quota exceeded"));
    click(trigger(0));
    await selectFile(0, new File(["valid"], "note.txt"));
    expect(deleteAttachment).toHaveBeenCalledWith("new-attachment-1");
    expect(element('[role="alert"]').textContent).toContain("could not be added");
    expect(container.textContent).not.toContain("Attachment added.");
  });

  it("persists add/remove for only the selected item across page remounts", async () => {
    click(trigger(1));
    expect(action(1, "Add to Quick Access").getAttribute("aria-pressed")).toBe("false");
    click(action(1, "Add to Quick Access"));
    expectClosed(1);
    expect(readQuickAccessPreference().items.filter((item) => item.itemType === "knowledge"))
      .toEqual([expect.objectContaining({ id: "knowledge:second", targetId: "second" })]);
    await renderPage("return-after-add");
    click(trigger(1));
    expect(action(1, "Remove from Quick Access").getAttribute("aria-pressed")).toBe("true");
    click(action(1, "Remove from Quick Access"));
    await renderPage("return-after-remove");
    click(trigger(1));
    expect(action(1, "Add to Quick Access").getAttribute("aria-pressed")).toBe("false");
  });

  it("does not claim success or change pressed state when Quick Access cannot be saved", () => {
    const write = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    click(trigger(0));
    click(action(0, "Add to Quick Access"));
    expectOpen(0);
    expect(action(0, "Add to Quick Access").getAttribute("aria-pressed")).toBe("false");
    expect(element('[role="alert"]').textContent).toContain("Quick Access could not be saved");
    expect(container.textContent).not.toContain("Changes saved");
    write.mockRestore();
    click(action(0, "Add to Quick Access"));
    expectClosed(0);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("writes once for repeated activation in the same event turn", () => {
    const write = vi.spyOn(window.localStorage, "setItem");
    click(trigger(0));
    const button = action(0, "Add to Quick Access");
    act(() => { button.click(); button.click(); });
    expect(write.mock.calls.filter(([key]) => key === QUICK_ACCESS_STORAGE_KEY)).toHaveLength(1);
    expect(readQuickAccessPreference().items.filter((item) => item.id === "knowledge:first")).toHaveLength(1);
    expectClosed(0);
  });
});
