import { describe, expect, it } from "vitest";
import { calcRatingDelta, formatLocalizationAnswer, isSolved } from "./service";

describe("challenge/service", () => {
  it("isSolved deduped: true when fixCorrect", () => {
    expect(isSolved({ fixCorrect: true, totalScore: 0 })).toBe(true);
  });
  it("isSolved true when totalScore >=60", () => {
    expect(isSolved({ fixCorrect: false, totalScore: 60 })).toBe(true);
  });
  it("isSolved false otherwise", () => {
    expect(isSolved({ fixCorrect: false, totalScore: 30 })).toBe(false);
  });
  it("calcRatingDelta positive when >=70", () => {
    expect(calcRatingDelta(80)).toBeGreaterThan(0);
  });
  it("calcRatingDelta negative when <70", () => {
    expect(calcRatingDelta(50)).toBeLessThan(0);
  });
  it("formatLocalizationAnswer", () => {
    expect(formatLocalizationAnswer([])).toBe("None");
    expect(formatLocalizationAnswer([5])).toBe("Line 5");
    expect(formatLocalizationAnswer([1, 2])).toBe("Lines 1, 2");
  });
});
