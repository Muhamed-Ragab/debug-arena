import { describe, expect, it, vi } from "vitest";
import { createAIProvider, getAIModel } from "./client";
import { AI_PRIMARY_MODEL, RECOMMENDED_MODELS } from "./constants";

vi.mock("@/lib/env/env", () => ({ env: { GROQ_API_KEY: "mock_groq_key" } }));

vi.mock("@ai-sdk/groq", () => ({
  createGroq: vi.fn((config) => (modelId: string) => ({
    config,
    modelId,
    provider: "groq",
  })),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn((config) => (modelId: string) => ({
    config,
    modelId,
    provider: "openai",
  })),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn((config) => (modelId: string) => ({
    config,
    modelId,
    provider: "anthropic",
  })),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn((config) => (modelId: string) => ({
    config,
    modelId,
    provider: "google",
  })),
}));

describe("AI Client Factory & Facade", () => {
  it("creates provider using default platform credentials", () => {
    const provider = createAIProvider();
    const model = provider(AI_PRIMARY_MODEL);
    expect(model).toBeDefined();
    expect((model as unknown as { provider: string }).provider).toBe("groq");
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("mock_groq_key");
  });

  it("creates OpenAI provider with custom key", () => {
    const provider = createAIProvider({
      apiKey: "sk-openai-test-key",
      provider: "openai",
    });
    const model = provider("gpt-4o");
    expect((model as unknown as { provider: string }).provider).toBe("openai");
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("sk-openai-test-key");
  });

  it("creates Anthropic provider with custom key", () => {
    const provider = createAIProvider({
      apiKey: "sk-ant-test-key",
      provider: "anthropic",
    });
    const model = provider("claude-3-5-sonnet-20241022");
    expect((model as unknown as { provider: string }).provider).toBe(
      "anthropic"
    );
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("sk-ant-test-key");
  });

  it("creates Google provider with custom key", () => {
    const provider = createAIProvider({
      apiKey: "google-test-key",
      provider: "google",
    });
    const model = provider("gemini-1.5-pro-latest");
    expect((model as unknown as { provider: string }).provider).toBe("google");
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("google-test-key");
  });

  it("resolves language model directly via getAIModel facade with provider options", () => {
    const model = getAIModel("claude-3-5-sonnet-20241022", {
      apiKey: "sk-ant-facade-key",
      provider: "anthropic",
    });
    expect((model as unknown as { modelId: string }).modelId).toBe(
      "claude-3-5-sonnet-20241022"
    );
    expect((model as unknown as { provider: string }).provider).toBe(
      "anthropic"
    );
  });

  it("provides catalog of recommended models across all supported providers", () => {
    expect(RECOMMENDED_MODELS.length).toBeGreaterThan(0);
    const providers = new Set(RECOMMENDED_MODELS.map((m) => m.provider));
    expect(providers.has("groq")).toBe(true);
    expect(providers.has("openai")).toBe(true);
    expect(providers.has("anthropic")).toBe(true);
    expect(providers.has("google")).toBe(true);
  });
});
