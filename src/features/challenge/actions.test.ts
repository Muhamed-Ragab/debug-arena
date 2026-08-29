import { describe, expect, it } from "vitest";
import { submitChallengeSchema } from "./validation";

describe("submitChallengeSchema", () => {
  it("validates valid submission inputs", () => {
    const parsed = submitChallengeSchema.safeParse({
      challengeId: "11111111-1111-1111-1111-111111111111",
      hintsRevealedCount: 1,
      localizationLines: [8],
      proposedFixCode: "setCount((c) => c + 1);",
      rootCauseExplanation:
        "Stale closure captures initial count from mount render.",
      timeSpentSeconds: 45,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid inputs with short explanation", () => {
    const parsed = submitChallengeSchema.safeParse({
      challengeId: "11111111-1111-1111-1111-111111111111",
      hintsRevealedCount: 0,
      localizationLines: [8],
      rootCauseExplanation: "bad",
      timeSpentSeconds: 10,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates multi-line localization inputs", () => {
    const parsed = submitChallengeSchema.safeParse({
      challengeId: "11111111-1111-1111-1111-111111111111",
      hintsRevealedCount: 0,
      localizationLines: [8, 9, 10],
      proposedFixCode: "setCount((c) => c + 1);",
      rootCauseExplanation:
        "Stale closure captures initial count from mount render.",
      timeSpentSeconds: 45,
    });

    expect(parsed.success).toBe(true);
  });
});
