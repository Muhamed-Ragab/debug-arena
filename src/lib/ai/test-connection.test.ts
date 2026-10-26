import { generateText } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testProviderConnection } from "./test-connection";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("./client", () => ({
  getAIModel: vi.fn((modelId, options) => ({
    modelId,
    options,
  })),
}));

describe("Live Provider Connection Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success and measured latency when provider responds", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: "pong",
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    const result = await testProviderConnection(
      "openai",
      "sk-valid-key",
      "gpt-4o-mini"
    );

    expect(result.success).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "ping",
      })
    );
  });

  it("selects sensible default test models per provider", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "pong",
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    await testProviderConnection("anthropic", "sk-ant-test");
    expect(generateText).toHaveBeenCalled();
  });

  it("fails immediately if API key is empty for non-platform provider", async () => {
    const result = await testProviderConnection("openai", "");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/API key is required/i);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("handles provider authentication/network errors gracefully", async () => {
    vi.mocked(generateText).mockRejectedValueOnce(
      new Error("Invalid API key provided: sk-secret-12345")
    );

    const result = await testProviderConnection(
      "groq",
      "sk-secret-12345",
      "llama-3.1-8b-instant"
    );

    expect(result.success).toBe(false);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeDefined();
    // Ensures sensitive key is not exposed in error string
    expect(result.error).not.toContain("sk-secret-12345");
  });
});
