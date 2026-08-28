import { describe, expect, it } from "vitest";
import {
  buildCategoryStats,
  buildRadarData,
  calcPoints,
  isSolved,
} from "./service";

describe("profile/service", () => {
  it("isSolved deduped", () => {
    expect(isSolved({ fixCorrect: true, totalScore: 0 })).toBe(true);
    expect(isSolved({ fixCorrect: false, totalScore: 70 })).toBe(true);
  });
  it("calcPoints", () => {
    expect(calcPoints(1000, 2)).toBe(1000 * 10 + 2 * 50);
  });
  it("buildRadarData 4 entries", () => {
    const map = new Map([["State Mutations", { avgScore: 80 }]]);
    const radar = buildRadarData(map as never);
    expect(radar).toHaveLength(4);
    expect(radar.find((r) => r.subject === "State Mutations")?.score).toBe(80);
  });
  it("buildCategoryStats", () => {
    const stats = buildCategoryStats(new Map(), []);
    expect(stats).toHaveLength(4);
  });
});
