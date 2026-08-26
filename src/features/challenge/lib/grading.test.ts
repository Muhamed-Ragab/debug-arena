import { describe, expect, it } from "vitest";
import { gradeSubmission } from "./grading";

describe("gradeSubmission", () => {
  it("awards full localization score when line is exact match", () => {
    const result = gradeSubmission({
      buggyLines: [8, 8],
      canonicalPreventionNotes:
        "Always use functional updates in timers. Add test in CI.",
      canonicalRootCause:
        "setInterval captured stale closure count without functional updater.",
      hintsUsedCount: 0,
      hintsUsedPenalty: 0,
      localizationLine: 8,
      rootCauseExplanation:
        "The setInterval callback closes over the initial count without functional updater.",
      sandboxResult: {
        executionTimeMs: 1,
        passed: true,
        passedTests: 1,
        testResults: [{ durationMs: 1, name: "t1", passed: true }],
        totalTests: 1,
      },
    });

    expect(result.localizationCorrect).toBe(true);
    expect(result.scoreParts[0].score).toBe(25);
    expect(result.fixCorrect).toBe(true);
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.preventionNotes.length).toBeGreaterThan(0);
  });

  it("applies hint penalties properly and clamps to 0", () => {
    const result = gradeSubmission({
      buggyLines: [15, 15],
      canonicalPreventionNotes: "Use atomic transactions.",
      canonicalRootCause: "Race condition in database read-then-write",
      hintsUsedCount: 3,
      hintsUsedPenalty: 50,
      localizationLine: 3, // wrong line
      rootCauseExplanation: "I am not sure what is wrong",
      sandboxResult: {
        executionTimeMs: 1,
        passed: false,
        passedTests: 0,
        testResults: [{ durationMs: 1, name: "t1", passed: false }],
        totalTests: 1,
      },
    });

    expect(result.localizationCorrect).toBe(false);
    expect(result.scoreParts[0].score).toBe(0);
    expect(result.totalScore).toBe(0);
  });
});
