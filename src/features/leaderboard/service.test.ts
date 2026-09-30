import { describe, expect, it, vi } from "vitest";
import { getLeaderboardCacheKey } from "./cache";
import {
  buildUserLeaderboardEntry,
  calcPoints,
  createLeaderboardService,
  isSolved,
} from "./service";
import type { LeaderboardRepository } from "./types";

vi.mock("./cache", async () => {
  const actual = await vi.importActual<typeof import("./cache")>("./cache");
  return {
    ...actual,
    getCachedLeaderboard: vi.fn().mockResolvedValue(null),
    setCachedLeaderboard: vi.fn().mockResolvedValue(undefined),
  };
});

const makeSubmission = (options: {
  categorySlug?: string;
  challengeId: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  score: number;
  submittedAt?: Date;
  fixCorrect?: boolean;
}) => ({
  challenge: {
    buggyArtifact: { points: options.points ?? 100 },
    category: {
      name:
        options.categorySlug === "api-design"
          ? "API Design"
          : "React Rendering",
      slug: options.categorySlug ?? "react-rendering",
    },
    difficulty: options.difficulty ?? "easy",
  },
  challengeId: options.challengeId,
  createdAt: options.submittedAt ?? new Date(),
  fixCorrect: options.fixCorrect ?? false,
  totalScore: options.score,
});

describe("leaderboard/service", () => {
  it("uses the shared solve threshold", () => {
    expect(isSolved({ fixCorrect: false, totalScore: 59 })).toBe(false);
    expect(isSolved({ fixCorrect: false, totalScore: 60 })).toBe(true);
  });

  it("calculates points from weighted best challenge scores", () => {
    expect(
      calcPoints([
        makeSubmission({ challengeId: "easy", score: 80 }),
        makeSubmission({
          challengeId: "hard",
          difficulty: "hard",
          points: 300,
          score: 60,
        }),
      ])
    ).toBe(260);
  });

  it("builds a leaderboard entry from the best attempt per challenge", () => {
    const entry = buildUserLeaderboardEntry(
      {
        categoryStats: [],
        displayName: "Test",
        id: "u1",
        name: "Test",
        streakCount: 2,
        submissions: [
          makeSubmission({ challengeId: "c1", score: 30 }),
          makeSubmission({ challengeId: "c1", score: 80 }),
          makeSubmission({ challengeId: "c2", score: 60 }),
        ],
      },
      1
    );
    expect(entry.solved).toBe(2);
    expect(entry.score).toBe(140);
    expect(entry.avgScore).toBe(70);
    expect(entry.rank).toBe(1);
  });

  it("shows the selected category as strongest on a category leaderboard", () => {
    const entry = buildUserLeaderboardEntry(
      {
        categoryStats: [
          { avgScore: 95, category: { name: "React Rendering" } },
          { avgScore: 60, category: { name: "API Design" } },
        ],
        displayName: "API solver",
        id: "api-user",
        name: "API solver",
        streakCount: 0,
        submissions: [
          makeSubmission({
            categorySlug: "api-design",
            challengeId: "api-1",
            score: 60,
          }),
        ],
      },
      1,
      { categorySlug: "api-design", period: "all_time" }
    );

    expect(entry.strongest).toBe("API Design");
  });

  it("applies weekly and category filters before ranking", async () => {
    const now = new Date();
    const user = {
      categoryStats: [],
      currentRating: 1200,
      displayName: "Weekly React",
      id: "weekly-react",
      name: "Weekly React",
      role: "user",
      streakCount: 1,
      submissions: [
        makeSubmission({
          challengeId: "recent-react",
          score: 80,
          submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        }),
        makeSubmission({
          challengeId: "old-react",
          score: 100,
          submittedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        }),
        makeSubmission({
          categorySlug: "api-design",
          challengeId: "recent-api",
          difficulty: "medium",
          points: 200,
          score: 100,
          submittedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        }),
      ],
    };
    const repo = {
      findAllUsersWithSubmissions: vi.fn().mockResolvedValue([user]),
      findAllWithCategoryStats: vi.fn().mockResolvedValue([user]),
      findByIdWithRelations: vi.fn(),
    } as unknown as LeaderboardRepository;
    const service = createLeaderboardService(repo);

    const entries = await service.getTopLeaderboard({
      categorySlug: "react-rendering",
      limit: 10,
      period: "weekly",
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      score: 80,
      solved: 1,
      userId: "weekly-react",
    });
  });

  it("does not rank users before they earn points or solve a challenge", async () => {
    const repo = {
      findAllUsersWithSubmissions: vi.fn().mockResolvedValue([]),
      findAllWithCategoryStats: vi.fn().mockResolvedValue([
        {
          categoryStats: [],
          displayName: "New user",
          id: "new-user",
          name: "New user",
          role: "user",
          streakCount: 0,
          submissions: [],
        },
      ]),
      findByIdWithRelations: vi.fn(),
    } as unknown as LeaderboardRepository;

    await expect(
      createLeaderboardService(repo).getTopLeaderboard({ period: "all_time" })
    ).resolves.toEqual([]);
  });

  it("uses a cache key that includes period, category, and limit", () => {
    expect(getLeaderboardCacheKey("all_time", null, 25)).toBe(
      "leaderboard:v4:top:all_time:all:limit:25"
    );
    expect(getLeaderboardCacheKey("weekly", "react-rendering", 10)).toBe(
      "leaderboard:v4:top:weekly:react-rendering:limit:10"
    );
  });

  it("does not inject admin or banned current users", async () => {
    const findAllWithCategoryStats = vi.fn().mockResolvedValue([]);
    const findAllUsersWithSubmissions = vi.fn().mockResolvedValue([]);
    const findByIdWithRelations = vi
      .fn()
      .mockResolvedValueOnce({
        banned: false,
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
    } as unknown as LeaderboardRepository);

    const adminResult = await svc.getTopLeaderboard({
      currentUserId: "admin1",
      limit: 10,
      period: "all_time",
    });
    expect(adminResult.some((entry) => entry.userId === "admin1")).toBe(false);

    const bannedResult = await svc.getTopLeaderboard({
      currentUserId: "banned1",
      limit: 10,
      period: "all_time",
    });
    expect(bannedResult.some((entry) => entry.userId === "banned1")).toBe(
      false
    );
    expect(findByIdWithRelations).toHaveBeenCalledTimes(2);
  });
});
