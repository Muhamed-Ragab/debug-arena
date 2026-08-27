import { createGroq, type GroqProvider } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import { env } from "@/lib/env/env";
import { AI_PRIMARY_MODEL } from "./constants";
import type { AIProviderOptions } from "./types";

/**
 * AI Provider Factory Method
 * Creates and configures AI SDK provider instances based on requested provider type and credentials.
 */
export function createAIProvider(options?: AIProviderOptions): GroqProvider {
  const providerType = options?.provider ?? "groq";
  const apiKey =
    options?.apiKey === undefined ? env.GROQ_API_KEY : options.apiKey;

  if (providerType === "groq") {
    return createGroq({
      apiKey: apiKey || "",
    });
  }

  return createGroq({
    apiKey: apiKey || "",
  });
}

/**
 * AI Provider Facade
 * Provides a unified, high-level facade for obtaining LanguageModel instances.
 */
export function getAIModel(
  modelName: string = AI_PRIMARY_MODEL,
  options?: AIProviderOptions | string
): LanguageModel {
  const opts: AIProviderOptions =
    typeof options === "string" ? { apiKey: options } : (options ?? {});
  const provider = createAIProvider(opts);
  return provider(modelName);
}
