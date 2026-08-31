import { describe, expect, it, vi } from "vitest";
import { getLeaderboardCacheKey } from "./cache";
import {
  buildUserLeaderboardEntry,
  calcPoints,
  createLeaderboardService,
  isSolved,
} from "./service";

vi.mock("./cache", async () => {
  const actual = await vi.importActual<typeof import("./cache")>("./cache");
  return {
    ...actual,
    getCachedLeaderboard: vi.fn().mockResolvedValue(null),
    setCachedLeaderboard: vi.fn().mockResolvedValue(undefined),
  };
});

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

  it("uses v3 cache key format", () => {
    expect(getLeaderboardCacheKey("all_time", null)).toBe(
      "leaderboard:v3:top:24h:all_time:all"
    );
    expect(getLeaderboardCacheKey("weekly", "react-rendering")).toBe(
      "leaderboard:v3:top:24h:weekly:react-rendering"
    );
  });

  it("does not inject admin or banned currentUser", async () => {
    const findAllWithCategoryStats = vi.fn().mockResolvedValue([]);
    const findAllUsersWithSubmissions = vi.fn().mockResolvedValue([]);
    const findByIdWithRelations = vi
      .fn()
      .mockResolvedValueOnce({
        banned: true,
        categoryStats: [],
        currentRating: 1200,
        displayName: "Admin",
        id: "admin1",
        name: "Admin",
        role: "admin",
        streakCount: 0,
        submissions: [],
      })
      .mockResolvedValueOnce({
        banned: true,
        categoryStats: [],
        currentRating: 1200,
        displayName: "Banned",
        id: "banned1",
        name: "Banned",
        role: "user",
        streakCount: 0,
        submissions: [],
      });

    const svc = createLeaderboardService({
      findAllUsersWithSubmissions,
      findAllWithCategoryStats,
      findByIdWithRelations,
    } as unknown as import("./types").LeaderboardRepository);

    const adminResult = await svc.getTopLeaderboard({
      currentUserId: "admin1",
      limit: 10,
      period: "all_time",
    });
    expect(adminResult.some((e) => e.userId === "admin1")).toBe(false);

    const bannedResult = await svc.getTopLeaderboard({
      currentUserId: "banned1",
      limit: 10,
      period: "all_time",
    });
    expect(bannedResult.some((e) => e.userId === "banned1")).toBe(false);
    expect(findByIdWithRelations).toHaveBeenCalledTimes(2);
  });
});
