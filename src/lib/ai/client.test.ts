import { describe, expect, it, vi } from "vitest";
import { createAIProvider, getAIModel } from "./client";
import { AI_PRIMARY_MODEL } from "./constants";

vi.mock("@/lib/env/env", () => ({ env: { GROQ_API_KEY: "mock_test_key" } }));

vi.mock("@ai-sdk/groq", () => ({
  createGroq: vi.fn((config) => (modelId: string) => ({
    config,
    modelId,
    provider: "groq",
  })),
}));

describe("AI Client Factory & Facade", () => {
  it("creates provider using createAIProvider factory with default credentials", () => {
    const provider = createAIProvider();
    const model = provider(AI_PRIMARY_MODEL);
    expect(model).toBeDefined();
    expect((model as unknown as { provider: string }).provider).toBe("groq");
  });

  it("creates provider with custom API key override", () => {
    const provider = createAIProvider({
      apiKey: "custom_key_override",
      provider: "groq",
    });
    const model = provider("custom-model");
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("custom_key_override");
  });

  it("resolves language model directly via getAIModel facade", () => {
    const model = getAIModel(AI_PRIMARY_MODEL, "facade_override_key");
    expect((model as unknown as { modelId: string }).modelId).toBe(
      AI_PRIMARY_MODEL
    );
    expect(
      (model as unknown as { config: { apiKey: string } }).config.apiKey
    ).toBe("facade_override_key");
  });
});
