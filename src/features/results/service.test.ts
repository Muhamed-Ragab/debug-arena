import { describe, expect, it } from "vitest";
import {
  computeSubmissionScores,
  getDynamicAiFeedback,
  getFixQualityDesc,
  getRootCauseDesc,
} from "./service";

describe("results/service", () => {
  it("getRootCauseDesc", () => {
    expect(getRootCauseDesc(25)).toBe("Accurately diagnosed failure mechanism");
    expect(getRootCauseDesc(15)).toBe(
      "Partially identified the failure mechanism"
    );
    expect(getRootCauseDesc(5)).toBe("Key failure mechanism omitted");
  });
  it("getFixQualityDesc", () => {
    expect(getFixQualityDesc(25)).toBe("Sound and effective solution approach");
    expect(getFixQualityDesc(5)).toBe(
      "Fix failed test assertions or details omitted"
    );
  });
  it("getDynamicAiFeedback prefers submissionAiFeedback", () => {
    expect(getDynamicAiFeedback("existing", "explanation", "cause", 50)).toBe(
      "existing"
    );
  });
  it("computeSubmissionScores pure", () => {
    const result = computeSubmissionScores({
      fixCorrect: true,
      hintsUsed: 0,
      localizationCorrect: true,
      preventionScore: 20,
      proposedFix: { score: 20 } as never,
      rootCauseScore: 20,
      totalScore: null as never,
    } as never);
    expect(result.total).toBeGreaterThan(80);
    expect(result.scoreParts).toHaveLength(4);
  });
});
