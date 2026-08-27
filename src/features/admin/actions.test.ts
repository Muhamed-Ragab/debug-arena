import { describe, expect, it } from "vitest";
import { generateFallbackChallenge } from "./lib/question-generator-agent";

describe("Admin Actions and Schemas", () => {
  it("generates a valid challenge draft structure matching schema requirements", () => {
    const draft = generateFallbackChallenge({
      categorySlug: "react-rendering",
      difficulty: "easy",
      topic: "Stale state update",
    });

    expect(draft.title).toBeDefined();
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

  it("handles backend concurrency challenge generation correctly", () => {
    const draft = generateFallbackChallenge({
      categorySlug: "backend-concurrency",
      difficulty: "hard",
      topic: "Double spend race condition",
    });

    expect(draft.difficulty).toBe("hard");
    expect(draft.buggyArtifact.points).toBe(300);
    expect(draft.buggyArtifact.entryFile).toBe("transfer.ts");
    expect(draft.hiddenTests?.length).toBe(1);
  });
});
