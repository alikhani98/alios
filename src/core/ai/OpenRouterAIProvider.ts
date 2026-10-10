import type { AIProvider } from "./AIProvider";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterMessage = {
  content?: unknown;
};

type OpenRouterChoice = {
  message?: OpenRouterMessage;
};

type OpenRouterCompletionResponse = {
  choices?: OpenRouterChoice[];
};

export class OpenRouterAIProvider implements AIProvider {
  readonly name = "openrouter";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async isAvailable(): Promise<boolean> {
    return this.apiKey.trim().length > 0;
  }

  async complete(prompt: string, maxTokens = 1000): Promise<string> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://alikhani98.github.io/alios",
        "X-Title": "AliOS",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterCompletionResponse;
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("Empty response from OpenRouter");
    }

    return text;
  }
}
