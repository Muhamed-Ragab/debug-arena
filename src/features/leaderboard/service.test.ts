import { describe, expect, it } from "vitest";
import { buildUserLeaderboardEntry, calcPoints, isSolved } from "./service";

describe("leaderboard/service", () => {
  it("isSolved 1 def", () => {
    expect(isSolved({ fixCorrect: false, totalScore: 59 })).toBe(false);
    expect(isSolved({ fixCorrect: false, totalScore: 60 })).toBe(true);
  });
  it("calcPoints", () => {
    expect(calcPoints(1200, 3)).toBe(1200 * 10 + 3 * 50);
  });
  it("buildUserLeaderboardEntry", () => {
    const entry = buildUserLeaderboardEntry(
      {
        categoryStats: [],
        currentRating: 1000,
        displayName: "Test",
        id: "u1",
        name: "Test",
        streakCount: 2,
        submissions: [
          { fixCorrect: true, totalScore: 80 },
          { fixCorrect: false, totalScore: 30 },
        ],
      },
      1
    );
    expect(entry.solved).toBe(1);
    expect(entry.score).toBe(1000 * 10 + 1 * 50);
    expect(entry.rank).toBe(1);
  });
});
