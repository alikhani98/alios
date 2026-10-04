import type { AIProvider } from "./AIProvider";

type OllamaGenerateResponse = {
  response?: unknown;
};

export class OllamaAIProvider implements AIProvider {
  readonly name = "ollama";

  constructor(private readonly baseUrl: string) {}

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(prompt: string, maxTokens = 1000): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        options: { num_predict: maxTokens },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    if (typeof data.response !== "string") {
      throw new Error("Invalid response from Ollama");
    }

    return data.response;
  }
}
