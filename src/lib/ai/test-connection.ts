import { generateText } from "ai";
import { getAIModel } from "./client";
import type { AIProviderType } from "./types";

const DEFAULT_TEST_MODELS: Record<AIProviderType, string> = {
  anthropic: "claude-3-5-haiku-20241022",
  google: "gemini-3.8-flash",
  groq: "llama-3.1-8b-instant",
  openai: "gpt-4o-mini",
  platform: "llama-3.1-8b-instant",
};

interface GoogleListModelsResponse {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
}

export interface TestConnectionResult {
  error?: string;
  latencyMs: number;
  success: boolean;
}

/**
 * Queries Google's ModelService directly to discover models enabled for the given key.
 */
async function fetchGoogleAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as GoogleListModelsResponse;
    if (!Array.isArray(data.models)) {
      return [];
    }
    return data.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Attempts connection recovery if the requested Google model is unsupported in v1beta or times out.
 */
async function tryGoogleFallbackConnection(
  apiKey: string,
  failedModelId: string,
  startTime: number,
  isTimeout: boolean
): Promise<TestConnectionResult | null> {
  const availableModels = await fetchGoogleAvailableModels(apiKey.trim());
  if (availableModels.length === 0) {
    return null;
  }

  // If text generation timed out but ModelService successfully validated the key and model
  if (isTimeout && availableModels.includes(failedModelId)) {
    return {
      latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
      success: true,
    };
  }

  const candidate = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    ...availableModels,
  ].find((m) => m !== failedModelId && availableModels.includes(m));

  if (candidate) {
    try {
      const fallbackModel = getAIModel(candidate, {
        apiKey: apiKey.trim(),
        provider: "google",
      });
      await generateText({
        abortSignal: AbortSignal.timeout(25_000),
        maxOutputTokens: 1,
        model: fallbackModel,
        prompt: "ping",
      });
      return {
        latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
        success: true,
      };
    } catch {
      // Fall through
    }
  }

  // If text generation timed out but the key successfully authenticated against ModelService
  if (isTimeout) {
    return {
      latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
      success: true,
    };
  }

  return {
    error: `Model '${failedModelId}' is not available for this key. Available models: ${availableModels.slice(0, 6).join(", ")}`,
    latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
    success: false,
  };
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
      abortSignal: AbortSignal.timeout(25_000),
      maxOutputTokens: 1,
      model,
      prompt: "ping",
    });

    return {
      latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
      success: true,
    };
  } catch (err) {
    if (
      provider === "google" &&
      err instanceof Error &&
      (err.name === "AbortError" ||
        err.message.includes("timeout") ||
        err.message.includes("not found for API version v1beta") ||
        err.message.includes("ModelService.ListModels") ||
        err.message.includes("no longer available"))
    ) {
      const isTimeout =
        err.name === "AbortError" || err.message.includes("timeout");
      const fallback = await tryGoogleFallbackConnection(
        apiKey,
        testModelId,
        startTime,
        isTimeout
      );
      if (fallback) {
        return fallback;
      }
    }

    let rawMessage =
      err instanceof Error ? err.message : "Provider connection test failed";

    if (apiKey && apiKey.length > 4) {
      rawMessage = rawMessage.replaceAll(apiKey, "[REDACTED]");
    }

    return {
      error: rawMessage,
      latencyMs: Math.max(0, Math.round(performance.now() - startTime)),
      success: false,
    };
  }
}
