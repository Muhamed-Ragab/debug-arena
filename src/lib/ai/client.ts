import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { env } from "@/lib/env/env";
import { AI_PRIMARY_MODEL } from "./constants";
import type { AIProviderOptions } from "./types";

export type AIModelFactory = (modelId: string) => LanguageModel;

/**
 * AI Provider Factory Method
 * Creates and configures AI SDK provider instances dynamically across
 * Groq, OpenAI, Anthropic, and Google Gemini.
 */
export function createAIProvider(options?: AIProviderOptions): AIModelFactory {
  const providerType = options?.provider ?? "platform";
  const apiKey =
    providerType === "platform" || providerType === "groq"
      ? (options?.apiKey ?? env.GROQ_API_KEY ?? "")
      : (options?.apiKey ?? "");

  switch (providerType) {
    case "openai": {
      return createOpenAI({ apiKey }) as unknown as AIModelFactory;
    }
    case "anthropic": {
      return createAnthropic({ apiKey }) as unknown as AIModelFactory;
    }
    case "google": {
      return createGoogleGenerativeAI({ apiKey }) as unknown as AIModelFactory;
    }
    default: {
      return createGroq({
        apiKey: apiKey || "",
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 30_000);
          try {
            return await fetch(input, {
              ...init,
              signal: controller.signal,
            });
          } finally {
            clearTimeout(t);
          }
        },
      }) as unknown as AIModelFactory;
    }
  }
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
