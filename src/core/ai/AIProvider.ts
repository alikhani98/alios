export interface AIProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  complete(prompt: string, maxTokens?: number): Promise<string>;
}

export type AIProviderStatus = "available" | "unavailable" | "unknown";
