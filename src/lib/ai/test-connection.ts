import { generateText } from "ai";
import { getAIModel } from "./client";
import type { AIProviderType } from "./types";

const DEFAULT_TEST_MODELS: Record<AIProviderType, string> = {
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-1.5-flash-latest",
  groq: "llama-3.1-8b-instant",
  openai: "gpt-4o-mini",
  platform: "llama-3.1-8b-instant",
};

export interface TestConnectionResult {
  error?: string;
  latencyMs: number;
  success: boolean;
}

/**
 * Tests live connection to an AI provider using a minimal completion request.
 * Measures latency and strips raw API key from any returned error messages.
 */
export async function testProviderConnection(
  provider: AIProviderType,
  apiKey: string,
  modelId?: string
): Promise<TestConnectionResult> {
  if (provider !== "platform" && !apiKey.trim()) {
    return {
      error: "API key is required to test connection",
      latencyMs: 0,
      success: false,
    };
  }

  const testModelId = modelId ?? DEFAULT_TEST_MODELS[provider];
  const startTime = performance.now();

  try {
    const model = getAIModel(testModelId, {
      apiKey: apiKey.trim(),
      provider,
    });

    await generateText({
      abortSignal: AbortSignal.timeout(10_000),
      model,
      prompt: "ping",
    });

    const latencyMs = Math.max(0, Math.round(performance.now() - startTime));
    return {
      latencyMs,
      success: true,
    };
  } catch (err) {
    const latencyMs = Math.max(0, Math.round(performance.now() - startTime));
    let rawMessage =
      err instanceof Error ? err.message : "Provider connection test failed";

    // Sanitize API key if it inadvertently appears in error messages
    if (apiKey && apiKey.length > 4) {
      rawMessage = rawMessage.replaceAll(apiKey, "[REDACTED]");
    }

    return {
      error: rawMessage,
      latencyMs,
      success: false,
    };
  }
}
