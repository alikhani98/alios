import { AnthropicAIProvider } from "./AnthropicAIProvider";
import { NoOpAIProvider } from "./NoOpAIProvider";
import { OllamaAIProvider } from "./OllamaAIProvider";
import { OpenRouterAIProvider } from "./OpenRouterAIProvider";
import type { AIProvider } from "./AIProvider";
import {
  AI_OPENROUTER_API_KEY_STORAGE_KEY,
  AI_OPENROUTER_MODEL_STORAGE_KEY,
  AI_PROVIDER_STORAGE_KEY,
  LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { readStoredPreference } from "@/shared/preferences/storage";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat";

export type AIProviderType = "anthropic" | "ollama" | "openrouter" | "noop";

function normalizeProviderType(value: string | null | undefined): AIProviderType {
  switch (value) {
    case "anthropic":
    case "ollama":
    case "openrouter":
    case "noop":
      return value;
    default:
      return "openrouter";
  }
}

export function createAIProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case "anthropic":
      return new AnthropicAIProvider();
    case "openrouter": {
      const apiKey = readStoredPreference(
        AI_OPENROUTER_API_KEY_STORAGE_KEY,
        (value) => (typeof value === "string" ? value.trim() : ""),
        ""
      );
      const model = readStoredPreference(
        AI_OPENROUTER_MODEL_STORAGE_KEY,
        (value) =>
          typeof value === "string" && value.trim()
            ? value.trim()
            : DEFAULT_OPENROUTER_MODEL,
        DEFAULT_OPENROUTER_MODEL
      );

      return apiKey ? new OpenRouterAIProvider(apiKey, model) : new NoOpAIProvider();
    }
    case "ollama": {
      const baseUrl = readStoredPreference(
        LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY,
        (value) =>
          typeof value === "string" && value.trim()
            ? value.trim()
            : DEFAULT_OLLAMA_URL,
        DEFAULT_OLLAMA_URL
      );
      return new OllamaAIProvider(baseUrl);
    }
    case "noop":
      return new NoOpAIProvider();
  }
}

export function getDefaultAIProvider(): AIProvider {
  const type = readStoredPreference(
    AI_PROVIDER_STORAGE_KEY,
    normalizeProviderType,
    "openrouter"
  );

  return createAIProvider(type);
}
