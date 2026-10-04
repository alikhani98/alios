import type { AIProvider } from "./AIProvider";

type AnthropicTextBlock = {
  type: string;
  text?: unknown;
};

type AnthropicMessageResponse = {
  content?: unknown;
};

export class AnthropicAIProvider implements AIProvider {
  readonly name = "anthropic";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async complete(prompt: string, maxTokens = 1000): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = (await response.json()) as AnthropicMessageResponse;

    if (!Array.isArray(data.content) || data.content.length === 0) {
      throw new Error("Empty response from Anthropic API");
    }

    const textBlock = data.content.find(
      (block): block is AnthropicTextBlock =>
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        (block as { type?: unknown }).type === "text"
    );

    if (!textBlock || typeof textBlock.text !== "string") {
      throw new Error("No text block in Anthropic API response");
    }

    return textBlock.text;
  }
}
