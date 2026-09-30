import { describe, expect, it } from "vitest";
import {
  calcPoints,
  filterLeaderboardSubmissions,
  getChallengeMaxPoints,
  getSubmissionPoints,
} from "./scoring";

const submission = (overrides: Record<string, unknown> = {}) => ({
  challenge: {
    buggyArtifact: { points: 100 },
    category: { slug: "react-rendering" },
    difficulty: "easy",
  },
  challengeId: "challenge-1",
  createdAt: new Date("2026-09-28T12:00:00.000Z"),
  fixCorrect: false,
  totalScore: 0,
  ...overrides,
});

describe("domain/scoring", () => {
  it("uses configured challenge points and falls back to difficulty defaults", () => {
    expect(getChallengeMaxPoints(submission().challenge)).toBe(100);
    expect(
      getChallengeMaxPoints({
        buggyArtifact: {},
        difficulty: "hard",
      })
    ).toBe(300);
  });

  it("converts a graded score into difficulty-weighted earned points", () => {
    expect(
      getSubmissionPoints(
        submission({
          challenge: {
            buggyArtifact: { points: 200 },
            category: { slug: "api-design" },
            difficulty: "medium",
          },
          totalScore: 75,
        })
      )
    ).toBe(150);
  });

  it("clamps invalid scores and returns no points for an ungraded attempt", () => {
    expect(getSubmissionPoints(submission({ totalScore: 150 }))).toBe(100);
    expect(getSubmissionPoints(submission({ totalScore: null }))).toBe(0);
  });

  it("counts only each challenge's best attempt", () => {
    const first = submission({ totalScore: 40 });
    const replay = submission({ totalScore: 85 });
    const hardChallenge = submission({
      challenge: {
        buggyArtifact: { points: 300 },
        category: { slug: "security" },
        difficulty: "hard",
      },
      challengeId: "challenge-2",
      totalScore: 60,
    });

    expect(calcPoints([first, replay, hardChallenge])).toBe(265);
  });

  it("filters leaderboard attempts by category and rolling seven-day window", () => {
    const recentCategoryAttempt = submission();
    const oldAttempt = submission({
      challengeId: "challenge-old",
      createdAt: new Date("2026-09-22T11:59:59.999Z"),
    });
    const otherCategoryAttempt = submission({
      challenge: {
        buggyArtifact: { points: 200 },
        category: { slug: "api-design" },
        difficulty: "medium",
      },
      challengeId: "challenge-api",
    });

    const filtered = filterLeaderboardSubmissions(
      [recentCategoryAttempt, oldAttempt, otherCategoryAttempt],
      {
        categorySlug: "react-rendering",
        now: new Date("2026-09-29T12:00:00.000Z"),
        period: "weekly",
      }
    );

    expect(filtered).toEqual([recentCategoryAttempt]);
  });
});
