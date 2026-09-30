import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "./constants";
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
    expect(
      calcPoints([
        {
          challenge: {
            buggyArtifact: { points: 200 },
            difficulty: "medium",
          },
          challengeId: "challenge-1",
          createdAt: new Date("2026-09-29T12:00:00.000Z"),
          fixCorrect: true,
          totalScore: 75,
        },
      ])
    ).toBe(150);
  });
  it("buildRadarData entries matches categories", () => {
    const [targetCategory] = DEFAULT_CATEGORIES;
    const map = new Map([[targetCategory, { avgScore: 80 }]]);
    const radar = buildRadarData(map as never);
    expect(radar).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(radar.find((r) => r.subject === targetCategory)?.score).toBe(80);
  });
  it("buildCategoryStats", () => {
    const stats = buildCategoryStats(new Map(), []);
    expect(stats).toHaveLength(DEFAULT_CATEGORIES.length);
  });
});
