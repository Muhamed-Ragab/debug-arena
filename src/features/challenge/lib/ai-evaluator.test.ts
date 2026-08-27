import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evaluateExplanationWithGroq,
  generateSocraticHintWithGroq,
} from "./ai-evaluator";

describe("Groq AI Evaluator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("evaluates explanation using Groq API response when key is present", async () => {
    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              alignmentPercent: 92,
              constructiveFeedback:
                "Spot on diagnosis! You accurately identified the stale closure inside setInterval.",
              keyConceptsIdentified: [
                "Stale closure",
                "Empty dependency array",
                "Functional state update needed",
              ],
              missedMechanisms: [],
              preventionAnalysis:
                "Use the functional state updater syntax setCount(c => c + 1) or ESLint react-hooks/exhaustive-deps.",
              rootCauseScore: 24,
            }),
          },
        },
      ],
      model: "llama-3.3-70b-versatile",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => mockGroqResponse,
      ok: true,
    } as Response);

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

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.isAiGraded).toBe(true);
    expect(result.rootCauseScore).toBe(24);
    expect(result.alignmentPercent).toBe(92);
    expect(result.constructiveFeedback).toContain("Spot on diagnosis");
  });

  it("falls back gracefully to deterministic vector scoring when API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
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

  it("generates progressive Socratic hints via Groq", async () => {
    const mockHintResponse = {
      choices: [
        {
          message: {
            content:
              "Think about what value of `count` the interval function sees across multiple ticks.",
          },
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      json: async () => mockHintResponse,
      ok: true,
    } as Response);

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

    expect(hint).toContain("Think about what value of `count`");
  });
});
