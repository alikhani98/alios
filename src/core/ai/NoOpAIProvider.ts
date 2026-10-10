import type { AIProvider } from "./AIProvider";

export class NoOpAIProvider implements AIProvider {
  readonly name = "noop";

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async complete(_prompt: string, _maxTokens?: number): Promise<string> {
    throw new Error("No AI provider configured");
  }
}
