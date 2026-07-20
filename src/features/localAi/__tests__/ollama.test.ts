import { describe, expect, it, vi } from "vitest";

import { normalizeOllamaBaseUrl, probeOllama } from "../ollama";

describe("Ollama local connection", () => {
  it("normalizes an HTTP(S) endpoint to its origin", () => {
    expect(normalizeOllamaBaseUrl(" http://127.0.0.1:11434/ ")).toBe(
      "http://127.0.0.1:11434"
    );
    expect(normalizeOllamaBaseUrl("file:///tmp/ollama")).toBeNull();
  });

  it("reports available local models without sending any prompt", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: "qwen3:8b" }, { name: "" }] }),
    });

    await expect(probeOllama("http://localhost:11434", fetcher)).resolves.toEqual({
      status: "connected",
      models: ["qwen3:8b"],
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:11434/api/tags");
  });

  it("keeps Ollama optional when the local service is unavailable", async () => {
    await expect(
      probeOllama("http://localhost:11434", vi.fn().mockRejectedValue(new Error("offline")))
    ).resolves.toEqual({ status: "unavailable" });
  });
});
