import type { AIProvider, AITextInput, AITextOutput } from "./types";

export class NoAIProvider implements AIProvider {
  name = "none";

  isAvailable(): boolean {
    return false;
  }

  async generateText(_input: AITextInput): Promise<AITextOutput> {
    throw new Error("AI integration is not enabled in AliOS 1.0.");
  }
}

export const noAIProvider = new NoAIProvider();
