// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n";
import { knowledgeItemRecord } from "@/test/factories";
import { KnowledgeGraphView } from "../components/KnowledgeGraphView";
import { buildKnowledgeGraph } from "../knowledgeGraph";

describe("Knowledge graph SVG sizing", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each([2, 100])("preserves intrinsic aspect ratio and node interactions for %i nodes", async (count) => {
    const graph = buildKnowledgeGraph(Array.from({ length: count }, (_, index) => ({
      ...knowledgeItemRecord, id: String(index), title: `Node ${index}`,
      content: index === 0 ? "[[Node 1]]" : "",
    })));
    const onSelectNode = vi.fn();
    await act(async () => root.render(<I18nProvider>
      <KnowledgeGraphView graph={graph} focusedItemId="0" onSelectNode={onSelectNode} />
    </I18nProvider>));
    const svg = container.querySelector("svg[role='img']");
    expect(svg).not.toBeNull();
    const dimensions = svg!.getAttribute("viewBox")!.split(" ").map(Number);
    expect(Number(svg!.getAttribute("width"))).toBe(dimensions[2]);
    expect(Number(svg!.getAttribute("height"))).toBe(dimensions[3]);
    expect(dimensions[3]).toBe(count === 2 ? 640 : 2600);
    expect(svg!.classList.contains("h-[32rem]")).toBe(false);
    expect(container.querySelectorAll("g[role='link']")).toHaveLength(count);
    expect(svg!.querySelectorAll("line")).toHaveLength(1);
    const node = svg!.querySelector<SVGGElement>("g[role='link']")!;
    expect(node.getAttribute("tabindex")).toBe("0");
    expect(node.querySelector("circle")?.getAttribute("r")).toBe("58");
    node.focus();
    expect(document.activeElement).toBe(node);
    act(() => {
      node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      node.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });
    expect(onSelectNode.mock.calls).toEqual([["0"], ["0"], ["0"]]);
  });
});
