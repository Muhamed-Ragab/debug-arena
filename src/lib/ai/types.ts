export type AIProviderType =
  | "platform"
  | "groq"
  | "openai"
  | "anthropic"
  | "google";

export interface AIProviderOptions {
  apiKey?: string;
  provider?: AIProviderType;
}

export interface RecommendedModel {
  contextWindow?: number;
  description: string;
  id: string;
  isDefault?: boolean;
  name: string;
  provider: AIProviderType;
}
