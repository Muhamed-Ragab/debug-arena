import { describe, expect, it } from "vitest";
import { normalizeChallengeDraft } from "./lib/question-generator-agent";

describe("Admin Actions and Schemas", () => {
  it("normalizes a challenge draft structure matching schema requirements", () => {
    const draft = normalizeChallengeDraft(
      {
        buggyArtifact: {
          buggyLines: [10, 11],
          entryFile: "EventFeed.tsx",
          files: [{ code: "const buggy = true;", name: "EventFeed.tsx" }],
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
        preventionNotes: "Add unit tests.",
        prompt: "Fix the race condition in the feed.",
        referenceFix: {
          explanation: "Fixed stale closure.",
          files: [{ code: "const buggy = false;", name: "EventFeed.tsx" }],
        },
        rootCauseSummary: "Stale closure over initial render state.",
        title: "Stale State in Feed",
      },
      "react-rendering",
      "easy"
    );

    expect(draft.title).toBe("Stale State in Feed");
    expect(draft.buggyArtifact.entryFile).toBe("EventFeed.tsx");
    expect(draft.buggyArtifact.files.length).toBeGreaterThan(0);
    expect(draft.referenceFix.files.length).toBeGreaterThan(0);
    expect(draft.hints.length).toBe(3);
    expect(draft.hints[0].penaltyPoints).toBe(10);
    expect(draft.hints[1].penaltyPoints).toBe(20);
    expect(draft.hints[2].penaltyPoints).toBe(30);
    expect(draft.rootCauseSummary.length).toBeGreaterThan(10);
    expect(draft.prompt.length).toBeGreaterThan(10);
  });

  it("handles backend concurrency challenge draft normalization correctly", () => {
    const draft = normalizeChallengeDraft(
      {
        buggyArtifact: {
          buggyLines: [14, 23],
          entryFile: "transfer.ts",
          files: [{ code: "transfer();", name: "transfer.ts" }],
          language: "typescript",
          points: 300,
          timeLimit: "20 min",
        },
        categorySlug: "backend-concurrency",
        difficulty: "hard",
        format: "code_snippet",
        hiddenTests: [
          {
            description: "No negative balance",
            name: "Prevents race",
            testCode: "expect(true).toBe(true);",
          },
        ],
        hints: [],
        preventionNotes: "Atomic transaction required.",
        prompt: "Prevent double spending.",
        referenceFix: {
          explanation: "Wrap in transaction.",
          files: [{ code: "tx.transfer();", name: "transfer.ts" }],
        },
        rootCauseSummary: "TOCTOU race condition without row locking.",
        title: "Double Spend Race Condition",
      },
      "backend-concurrency",
      "hard"
    );

    expect(draft.difficulty).toBe("hard");
    expect(draft.buggyArtifact.points).toBe(300);
    expect(draft.buggyArtifact.entryFile).toBe("transfer.ts");
    expect(draft.hiddenTests?.length).toBe(1);
  });
});
