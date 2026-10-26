import { describe, expect, it, vi } from "vitest";
import { profileRepository } from "@/features/profile/repository";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { decryptApiKey } from "@/lib/crypto/encryption";
import { ActionError } from "@/lib/safe-action";
import {
  calcRatingDelta,
  createChallengeService,
  formatLocalizationAnswer,
  isSolved,
} from "./service";

vi.mock("@/features/profile/repository", () => ({
  profileRepository: {
    findAiSettingsByUserId: vi.fn(),
    findApiKeyByProvider: vi.fn(),
    findCategoryStats: vi.fn().mockResolvedValue(null),
    updateUser: vi.fn(),
    upsertCategoryStats: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/lib/ai/rate-limit", () => ({
  checkAIRateLimit: vi.fn(),
}));

vi.mock("@/lib/crypto/encryption", () => ({
  decryptApiKey: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/leaderboard/cache", () => ({
  invalidateLeaderboardCache: vi.fn(),
}));

vi.mock("@/features/leaderboard/service", () => ({
  leaderboardService: {
    calculateUserRank: vi.fn().mockResolvedValue(1),
  },
}));

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

  describe("submitChallenge rate limiting & BYOK resolution", () => {
    const mockChallengeRepo = {
      findById: vi.fn().mockResolvedValue({
        buggyArtifact: { buggyLines: [1, 2], hiddenTests: [] },
        categoryId: "cat-1",
        id: "chal-1",
        preventionNotes: "notes",
        rootCauseSummary: "root cause",
        title: "Test Challenge",
      }),
      findHintsByChallengeId: vi.fn().mockResolvedValue([]),
      findUserChallengeStatsData: vi.fn().mockResolvedValue({ user: null }),
      insertSubmission: vi.fn().mockResolvedValue({ id: "sub-1" }),
      updateUserCategoryStats: vi.fn(),
      updateUserRatingAndStreak: vi.fn(),
    };

    const mockEvaluate = vi.fn().mockResolvedValue({
      alignmentPercent: 85,
      confidence: "high",
      fixScore: 25,
      isAiGraded: true,
      isCorrect: true,
      keyConceptsIdentified: [],
      missedMechanisms: [],
      modelUsed: "gpt-4o",
      needsEnhancement: false,
      preventionAnalysis: "Good",
      preventionScore: 25,
      rootCauseScore: 25,
    });

    const mockGrade = vi.fn().mockReturnValue({
      aiFeedback: "Great job",
      canonicalExplanation: "Canon",
      enhancementSuggestions: [],
      fixCorrect: true,
      isAiGraded: true,
      isCorrect: true,
      keyConceptsIdentified: [],
      localizationCorrect: true,
      missedMechanisms: [],
      needsEnhancement: false,
      preventionNotes: "Prev",
      preventionScore: 25,
      rootCauseScore: 25,
      scoreParts: [{ name: "Localization", score: 25 }],
      totalScore: 95,
    });

    const mockRunSandbox = vi.fn().mockResolvedValue({
      allPassed: true,
      durationMs: 10,
      results: [],
    });

    it("throws ActionError when rate limit or daily quota is exceeded", async () => {
      vi.mocked(profileRepository.findAiSettingsByUserId).mockResolvedValueOnce(
        null
      );
      vi.mocked(checkAIRateLimit).mockResolvedValueOnce({
        allowed: false,
        errorReason: "Daily AI evaluation quota reached (15/15)",
        remaining: 0,
        resetInSeconds: 3600,
      });

      const svc = createChallengeService(mockChallengeRepo as never);

      let caughtError: unknown;
      try {
        await svc.submitChallenge(
          {
            challengeId: "chal-1",
            hintsRevealedCount: 0,
            localizationLines: [1],
            proposedFixCode: "const x = 1;",
            rootCauseExplanation: "Off by one error in loop",
            solutionExplanation: "Fix the loop bound",
            timeSpentSeconds: 60,
            userId: "user-rate-limited",
          },
          {
            challengeRepo: mockChallengeRepo as never,
            evaluate: mockEvaluate,
            grade: mockGrade,
            runSandbox: mockRunSandbox,
          }
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ActionError);
      expect((caughtError as ActionError).message).toMatch(
        /Daily AI evaluation quota reached/i
      );
    });

    it("resolves BYOK settings, decrypts key, and checks rate limit with isByok=true", async () => {
      vi.mocked(profileRepository.findAiSettingsByUserId).mockResolvedValueOnce(
        {
          activeModel: "gpt-4o",
          activeProvider: "openai",
          customModel: null,
          id: "set-1",
          updatedAt: new Date(),
          userId: "user-byok",
        }
      );
      vi.mocked(profileRepository.findApiKeyByProvider).mockResolvedValueOnce({
        createdAt: new Date(),
        encryptedApiKey: "iv:cipher:tag",
        id: "key-1",
        keyPreview: "sk-proj...1234",
        provider: "openai",
        updatedAt: new Date(),
        userId: "user-byok",
      });
      vi.mocked(decryptApiKey).mockReturnValueOnce("sk-decrypted-openai-key");
      vi.mocked(checkAIRateLimit).mockResolvedValueOnce({
        allowed: true,
        remaining: 29,
        resetInSeconds: 60,
      });

      const svc = createChallengeService(mockChallengeRepo as never);

      const result = await svc.submitChallenge(
        {
          challengeId: "chal-1",
          hintsRevealedCount: 0,
          localizationLines: [1],
          proposedFixCode: "const x = 1;",
          rootCauseExplanation: "Off by one error in loop",
          solutionExplanation: "Fix the loop bound",
          timeSpentSeconds: 60,
          userId: "user-byok",
        },
        {
          challengeRepo: mockChallengeRepo as never,
          evaluate: mockEvaluate,
          grade: mockGrade,
          runSandbox: mockRunSandbox,
        }
      );

      expect(checkAIRateLimit).toHaveBeenCalledWith("user-byok", true);
      expect(decryptApiKey).toHaveBeenCalledWith("iv:cipher:tag");
      expect(result.totalScore).toBe(95);
    });
  });
});
