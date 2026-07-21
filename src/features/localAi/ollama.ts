export const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

export type OllamaConnectionResult =
  | { status: "connected"; models: readonly string[] }
  | { status: "invalidUrl" }
  | { status: "unavailable" };

type OllamaTagsResponse = {
  models?: Array<{ name?: unknown }>;
};

export function normalizeOllamaBaseUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export async function probeOllama(
  baseUrl: string,
  fetcher: typeof fetch = fetch
): Promise<OllamaConnectionResult> {
  const normalizedBaseUrl = normalizeOllamaBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return { status: "invalidUrl" };
  }

  try {
    const response = await fetcher(`${normalizedBaseUrl}/api/tags`);

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const payload = (await response.json()) as OllamaTagsResponse;
    const models = (payload.models ?? [])
      .map((model) => model.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0);

    return { status: "connected", models };
  } catch {
    return { status: "unavailable" };
  }
}
