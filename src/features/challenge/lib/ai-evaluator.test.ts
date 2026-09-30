import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evaluateExplanationWithGroq,
  generateSocraticHintWithGroq,
} from "./ai-evaluator";

vi.mock("ai", () => ({
  generateText: vi.fn().mockImplementation(({ output }) => {
    if (output) {
      return {
        output: {
          alignmentPercent: 92,
          constructiveFeedback:
            "Spot on diagnosis! You accurately identified the stale closure inside setInterval.",
          enhancementSuggestions: [
            "Consider also mentioning memory cleanup with clearInterval.",
          ],
          fixScore: 20,
          isAiGraded: true,
          isCorrect: true,
          keyConceptsIdentified: [
            "Stale closure",
            "Empty dependency array",
            "Functional state update needed",
          ],
          missedMechanisms: [],
          needsEnhancement: false,
          preventionAnalysis:
            "Use the functional state updater syntax setCount(c => c + 1) or ESLint react-hooks/exhaustive-deps.",
          preventionScore: 20,
          rootCauseScore: 24,
        },
      };
    }
    return {
      text: "Think about what value of count the interval function sees across multiple ticks.",
    };
  }),
  Output: {
    object: vi.fn(({ schema }: { schema: unknown }) => ({ schema })),
    text: vi.fn(() => ({})),
  },
}));

describe("Groq AI Evaluator", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("evaluates explanation using Groq API response when key is present", async () => {
    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "The setInterval callback forms a closure over the initial count state (0).",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation:
          "The setInterval callback captures count from initial mount due to closure, never reading updated values.",
      },
      "gsk_test_api_key"
    );

    expect(result.isAiGraded).toBe(true);
    expect(result.isCorrect).toBe(true);
    expect(result.needsEnhancement).toBe(false);
    expect(result.enhancementSuggestions).toHaveLength(1);
    expect(result.rootCauseScore).toBe(24);
    expect(result.alignmentPercent).toBe(92);
    expect(result.constructiveFeedback).toContain("Spot on diagnosis");
  });

  it("falls back gracefully to deterministic token-overlap scoring when API fails", async () => {
    const ai = await import("ai");
    vi.mocked(ai.generateText).mockRejectedValueOnce(
      new Error("Network connection timeout")
    );

    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "The setInterval callback forms a closure over the initial count state (0).",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation:
          "The setInterval callback forms a closure over the initial count value.",
      },
      "gsk_test_api_key"
    );

    expect(result.isAiGraded).toBe(false);
    expect(result.rootCauseScore).toBeGreaterThanOrEqual(12);
  });

  it("falls back gracefully when API key is omitted", async () => {
    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "The setInterval callback forms a closure over the initial count state (0).",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation: "Stale closure in the interval timer hook.",
      },
      "" // empty API key
    );

    expect(result.isAiGraded).toBe(false);
    expect(result.rootCauseScore).toBeGreaterThanOrEqual(6);
  });

  it("scores exact canonical terms high in offline fallback", async () => {
    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "setInterval captured stale closure count without functional updater",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation:
          "setInterval captured stale closure count without functional updater",
      },
      ""
    );

    expect(result.isAiGraded).toBe(false);
    expect(result.rootCauseScore).toBe(25);
    expect(result.alignmentPercent).toBe(100);
  });

  it("scores unrelated text low in offline fallback", async () => {
    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "setInterval captured stale closure count without functional updater",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation:
          "The pizza delivery arrived late because traffic was heavy downtown",
      },
      ""
    );

    expect(result.isAiGraded).toBe(false);
    expect(result.rootCauseScore).toBeLessThanOrEqual(8);
    expect(result.isCorrect).toBe(false);
  });

  it("scores empty input as zero in offline fallback", async () => {
    const result = await evaluateExplanationWithGroq(
      {
        canonicalRootCause:
          "setInterval captured stale closure count without functional updater",
        challengeTitle: "Stale Closure in Counter Interval",
        userExplanation: "",
      },
      ""
    );

    expect(result.isAiGraded).toBe(false);
    expect(result.rootCauseScore).toBe(0);
    expect(result.alignmentPercent).toBe(0);
  });

  it("generates progressive Socratic hints via Groq", async () => {
    const hint = await generateSocraticHintWithGroq(
      {
        challengeTitle: "Stale Closure in Counter Interval",
        codeSnippet:
          "useEffect(() => { setInterval(() => setCount(count + 1), 1000) }, [])",
        hintLevel: 1,
        prompt: "Counter does not increment beyond 1.",
        selectedLine: 2,
      },
      "gsk_test_api_key"
    );

    expect(hint).toContain("Think about what value of count");
  });
});
