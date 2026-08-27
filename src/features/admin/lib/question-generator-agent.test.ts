import { describe, expect, it, vi } from "vitest";
import {
  computeUnifiedDiff,
  detectBuggyLines,
  generateFallbackChallenge,
  generateQuestionDraft,
  normalizeChallengeDraft,
  refineQuestionDraft,
} from "./question-generator-agent";

describe("Question Generator Agent", () => {
  describe("computeUnifiedDiff", () => {
    it("computes diff lines accurately between buggy and fixed code", () => {
      const buggyCode = "const a = 1;\nconst b = 2;\nconst c = 3;";
      const fixedCode = "const a = 1;\nconst b = 20;\nconst c = 3;";

      const diff = computeUnifiedDiff(buggyCode, fixedCode);
      expect(diff).toBeDefined();
      expect(
        diff.some((d) => d.type === "ctx" && d.text === "const a = 1;")
      ).toBe(true);
      expect(
        diff.some((d) => d.type === "del" && d.text === "const b = 2;")
      ).toBe(true);
      expect(
        diff.some((d) => d.type === "add" && d.text === "const b = 20;")
      ).toBe(true);
      expect(
        diff.some((d) => d.type === "ctx" && d.text === "const c = 3;")
      ).toBe(true);
    });
  });

  describe("detectBuggyLines", () => {
    it("identifies the line range where modifications occurred", () => {
      const buggyCode = "line1\nline2\nline3_bug\nline4";
      const fixedCode = "line1\nline2\nline3_fixed\nline4";

      const [start, end] = detectBuggyLines(buggyCode, fixedCode);
      expect(start).toBe(3);
      expect(end).toBe(3);
    });
  });

  describe("normalizeChallengeDraft", () => {
    it("ensures all required fields, progressive hints, and points are properly shaped", () => {
      const raw = {
        buggyArtifact: {
          entryFile: "app.tsx",
          files: [{ code: "const x = 1;", name: "app.tsx" }],
          language: "typescript",
        },
        difficulty: "hard",
        hints: [{ order: 1, socraticPrompt: "Look at x" }],
        preventionNotes: "Use linters",
        prompt: "Fix x",
        referenceFix: {
          files: [{ code: "const x = 2;", name: "app.tsx" }],
        },
        rootCauseSummary: "x was 1 instead of 2",
        title: "Test Challenge",
      };

      const normalized = normalizeChallengeDraft(
        raw,
        "react-rendering",
        "hard"
      );

      expect(normalized.title).toBe("Test Challenge");
      expect(normalized.difficulty).toBe("hard");
      expect(normalized.buggyArtifact.points).toBe(300);
      expect(normalized.buggyArtifact.timeLimit).toBe("30 min");
      expect(normalized.hints.length).toBe(1);
      expect(normalized.referenceFix.diff.length).toBeGreaterThan(0);
    });
  });

  describe("generateFallbackChallenge", () => {
    it("generates a high-quality React fallback challenge", () => {
      const draft = generateFallbackChallenge({
        categorySlug: "react-rendering",
        difficulty: "easy",
        topic: "Stale closure in counter",
      });

      expect(draft.title).toBeDefined();
      expect(draft.buggyArtifact.files.length).toBeGreaterThan(0);
      expect(draft.referenceFix.files.length).toBeGreaterThan(0);
      expect(draft.hints.length).toBe(3);
      expect(draft.rootCauseSummary).toContain("Stale closure");
    });

    it("generates a high-quality Backend Concurrency fallback challenge", () => {
      const draft = generateFallbackChallenge({
        categorySlug: "backend-concurrency",
        difficulty: "medium",
        topic: "Concurrent wallet transfer race condition",
      });

      expect(draft.title).toContain("Race Condition");
      expect(draft.buggyArtifact.files[0].name).toBe("transfer.ts");
      expect(draft.hints.length).toBe(3);
      expect(draft.hiddenTests?.length).toBeGreaterThan(0);
    });
  });

  describe("generateQuestionDraft & refineQuestionDraft with LLM mocks", () => {
    it("parses valid LLM response properly", async () => {
      const originalKey = process.env.GROQ_API_KEY;
      process.env.GROQ_API_KEY = "gsk-mock-key-for-test";

      const mockChallenge = {
        buggyArtifact: {
          entryFile: "Counter.tsx",
          files: [{ code: "const buggy = true;", name: "Counter.tsx" }],
          language: "typescript",
          points: 200,
          timeLimit: "20 min",
        },
        categorySlug: "react-rendering",
        difficulty: "medium",
        format: "code_snippet",
        hints: [
          { order: 1, penaltyPoints: 10, socraticPrompt: "Check state" },
          { order: 2, penaltyPoints: 20, socraticPrompt: "Look at lifecycle" },
          {
            order: 3,
            penaltyPoints: 30,
            socraticPrompt: "Use functional updater",
          },
        ],
        preventionNotes: "Enable linting",
        prompt: "Fix the counter",
        referenceFix: {
          explanation: "Fixed the state",
          files: [{ code: "const buggy = false;", name: "Counter.tsx" }],
        },
        rootCauseSummary: "State update was wrong",
        title: "Generated Counter Bug",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockChallenge) } }],
        }),
        ok: true,
      } as Response);

      const result = await generateQuestionDraft({
        categorySlug: "react-rendering",
        difficulty: "medium",
        topic: "Counter bug",
      });

      expect(result.title).toBe("Generated Counter Bug");
      expect(result.hints.length).toBe(3);
      fetchSpy.mockRestore();
      process.env.GROQ_API_KEY = originalKey;
    });

    it("falls back gracefully when LLM API call fails or times out", async () => {
      const originalKey = process.env.GROQ_API_KEY;
      process.env.GROQ_API_KEY = "gsk-mock-key-for-test";

      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("Network timeout"));

      const result = await generateQuestionDraft({
        categorySlug: "backend-concurrency",
        difficulty: "hard",
        topic: "Race condition in mutex lock",
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.hints.length).toBe(3);
      fetchSpy.mockRestore();
      process.env.GROQ_API_KEY = originalKey;
    });

    it("refines existing draft using LLM instructions", async () => {
      const originalKey = process.env.GROQ_API_KEY;
      process.env.GROQ_API_KEY = "gsk-mock-key-for-test";

      const currentDraft = generateFallbackChallenge({
        categorySlug: "react-rendering",
        difficulty: "easy",
      });

      const refinedMock = {
        ...currentDraft,
        difficulty: "hard",
        title: "Refined Harder Challenge",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(refinedMock) } }],
        }),
        ok: true,
      } as Response);

      const refined = await refineQuestionDraft({
        currentDraft,
        instruction:
          "Make this challenge hard difficulty with deeper explanation",
      });

      expect(refined.title).toBe("Refined Harder Challenge");
      expect(refined.difficulty).toBe("hard");
      fetchSpy.mockRestore();
      process.env.GROQ_API_KEY = originalKey;
    });
  });
});
