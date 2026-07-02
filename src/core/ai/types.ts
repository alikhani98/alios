export type AITextInput = {
  prompt: string;
  context?: string;
  metadata?: Record<string, unknown>;
};

export type AITextOutput = {
  text: string;
  provider: string;
  createdAt: string;
};

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateText(input: AITextInput): Promise<AITextOutput>;
}
