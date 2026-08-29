import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeUnifiedDiff,
  detectBuggyLines,
  generateQuestionDraft,
  getGeneratorStrategy,
  normalizeChallengeDraft,
  refineQuestionDraft,
} from "./question-generator-agent";

vi.mock("@/lib/env/env", () => ({ env: { GROQ_API_KEY: "test_key" } }));

// Mock AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn().mockImplementation(({ system }) => {
    // If it's a refinement request
    if (system?.includes("helping an admin refine")) {
      return {
        output: {
          buggyArtifact: {
            buggyLines: [1, 2],
            entryFile: "index.ts",
            files: [],
            language: "typescript",
            points: 300,
            timeLimit: "30 min",
          },
          categorySlug: "react-rendering",
          difficulty: "hard",
          format: "code_snippet",
          hints: [],
          preventionNotes: "Refined",
          prompt: "Refined prompt",
          referenceFix: { explanation: "Refined", files: [] },
          rootCauseSummary: "Refined",
          title: "Refined Harder Challenge",
        },
      };
    }

    // Otherwise it's a generate request
    return {
      output: {
        buggyArtifact: {
          buggyLines: [1, 2],
          entryFile: "index.ts",
          files: [],
          language: "typescript",
          points: 100,
          timeLimit: "15 min",
        },
        categorySlug: "react-rendering",
        difficulty: "easy",
        format: "code_snippet",
        hints: [
          { order: 1, penaltyPoints: 10, socraticPrompt: "Hint 1" },
          { order: 2, penaltyPoints: 20, socraticPrompt: "Hint 2" },
          { order: 3, penaltyPoints: 30, socraticPrompt: "Hint 3" },
        ],
        preventionNotes: "Use deps",
        prompt: "Fix the counter",
        referenceFix: { explanation: "Fixed", files: [] },
        rootCauseSummary: "Stale closure",
        title: "Generated Counter Bug",
      },
    };
  }),
  Output: {
    object: vi.fn(({ schema }: { schema: unknown }) => ({ schema })),
    text: vi.fn(() => ({})),
  },
}));

describe("Question Generator Agent", () => {
  describe("computeUnifiedDiff", () => {
    it("computes diff lines accurately between buggy and fixed code", () => {
      const diff = computeUnifiedDiff("const x = 1;", "const x = 2;");
      expect(diff).toHaveLength(2);
      expect(diff[0].type).toBe("del");
      expect(diff[1].type).toBe("add");
    });
  });

  describe("detectBuggyLines", () => {
    it("identifies the line range where modifications occurred", () => {
      const lines = detectBuggyLines("A\nB\nC", "A\nX\nC");
      expect(lines).toEqual([2, 2]);
    });
  });

  describe("normalizeChallengeDraft", () => {
    it("ensures all required fields, progressive hints, and points are properly shaped", () => {
      const draft = normalizeChallengeDraft({
        buggyArtifact: {
          entryFile: "index.ts",
          files: [{ code: "", name: "index.ts" }],
          language: "typescript",
        },
        categorySlug: "test",
        difficulty: "easy",
        format: "code_snippet",
        hints: [],
        preventionNotes: "Prev",
        prompt: "Prompt",
        referenceFix: {
          explanation: "Exp",
          files: [{ code: "", name: "index.ts" }],
        },
        rootCauseSummary: "Root",
        title: "Test",
      });
      expect(draft.hints.length).toBe(3); // auto-fills defaults
    });
  });

  describe("generateQuestionDraft & refineQuestionDraft with LLM mocks", () => {
    afterEach(() => {
      vi.clearAllMocks();
    });

    it("parses valid LLM response properly", async () => {
      const result = await generateQuestionDraft({ topic: "Counter bug" });
      expect(result.title).toBe("Generated Counter Bug");
      expect(result.hints.length).toBe(3);
    });

    it("throws an error when LLM API call fails or times out", async () => {
      const ai = await import("ai");
      vi.mocked(ai.generateText).mockRejectedValueOnce(
        new Error("Network timeout")
      );

      await expect(
        generateQuestionDraft({ topic: "Counter bug" })
      ).rejects.toThrow();
    });

    it("throws an error when API key is missing", async () => {
      const strategy = getGeneratorStrategy("");
      await expect(strategy({ topic: "Counter bug" })).rejects.toThrow();
    });

    it("refines existing draft using LLM instructions", async () => {
      const sampleDraft = normalizeChallengeDraft({
        buggyArtifact: {
          entryFile: "index.ts",
          files: [{ code: "const a = 1;", name: "index.ts" }],
          language: "typescript",
        },
        categorySlug: "react-rendering",
        difficulty: "easy",
        format: "code_snippet",
        hints: [],
        preventionNotes: "Prev",
        prompt: "Initial prompt",
        referenceFix: {
          explanation: "Fix",
          files: [{ code: "const a = 2;", name: "index.ts" }],
        },
        rootCauseSummary: "Root cause",
        title: "Initial Challenge",
      });

      const refined = await refineQuestionDraft({
        currentDraft: sampleDraft,
        instruction: "Make it harder",
      });

      expect(refined.title).toBe("Refined Harder Challenge");
      expect(refined.difficulty).toBe("hard");
    });
  });
});
