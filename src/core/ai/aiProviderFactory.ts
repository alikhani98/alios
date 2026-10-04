import { AnthropicAIProvider } from "./AnthropicAIProvider";
import { OllamaAIProvider } from "./OllamaAIProvider";
import type { AIProvider } from "./AIProvider";
import { readStoredPreference } from "@/shared/preferences/storage";

const OLLAMA_BASE_URL_KEY = "alios.localAi.ollama.baseUrl";
const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export type AIProviderType = "anthropic" | "ollama";

export function createAIProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case "anthropic":
      return new AnthropicAIProvider();
    case "ollama": {
      const baseUrl = readStoredPreference(
        OLLAMA_BASE_URL_KEY,
        (value) =>
          typeof value === "string" && value.trim()
            ? value.trim()
            : DEFAULT_OLLAMA_URL,
        DEFAULT_OLLAMA_URL
      );
      return new OllamaAIProvider(baseUrl);
    }
  }
}

export function getDefaultAIProvider(): AIProvider {
  return new AnthropicAIProvider();
}
