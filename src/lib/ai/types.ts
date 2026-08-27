export type AIProviderType = "groq";

export interface AIProviderOptions {
  apiKey?: string;
  provider?: AIProviderType;
}
