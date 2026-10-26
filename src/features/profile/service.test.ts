import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CATEGORIES } from "./constants";

vi.mock("@/lib/ai/rate-limit", () => ({
  getDailyAIQuota: vi.fn(async (_userId, isByok) => ({
    isByok: Boolean(isByok),
    total: isByok ? -1 : 15,
    used: 0,
  })),
}));

import {
  buildCategoryStats,
  buildRadarData,
  calcPoints,
  createProfileService,
  formatSubmissionsCsv,
  formatSubmissionsJson,
  isSolved,
  projectSubmissionToExportDto,
  sanitizeCsvFormula,
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

  describe("sanitizeCsvFormula", () => {
    it("preserves safe plain text", () => {
      expect(sanitizeCsvFormula("Normal Title")).toBe("Normal Title");
      expect(sanitizeCsvFormula("Bug in auth check")).toBe("Bug in auth check");
    });

    it("preserves legitimate numeric strings including negatives", () => {
      expect(sanitizeCsvFormula("-42")).toBe("-42");
      expect(sanitizeCsvFormula("100")).toBe("100");
      expect(sanitizeCsvFormula("-3.14")).toBe("-3.14");
    });

    it("neutralizes formula trigger characters by prepending single quote", () => {
      expect(sanitizeCsvFormula("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvFormula("+cmd|' /C calc'!A0")).toBe(
        "'+cmd|' /C calc'!A0"
      );
      expect(sanitizeCsvFormula("-2+3+cmd")).toBe("'-2+3+cmd");
      expect(sanitizeCsvFormula("@SUM(1,2)")).toBe("'@SUM(1,2)");
      expect(sanitizeCsvFormula("\t=1+1")).toBe("'\t=1+1");
      expect(sanitizeCsvFormula("\r=1+1")).toBe("'\r=1+1");
      expect(sanitizeCsvFormula("|powershell")).toBe("'|powershell");
      expect(sanitizeCsvFormula("%COMSPEC%")).toBe("'%COMSPEC%");
    });

    it("handles null or empty string safely", () => {
      expect(sanitizeCsvFormula("")).toBe("");
      expect(sanitizeCsvFormula(null as unknown as string)).toBe("");
    });
  });

  describe("AI Settings & BYOK Keys in profileService", () => {
    const mockRepo = {
      deleteApiKey: vi.fn(),
      deleteUser: vi.fn(),
      findAiSettingsByUserId: vi.fn(),
      findAllSubmissionsByUserId: vi.fn(),
      findApiKeyByProvider: vi.fn(),
      findApiKeysByUserId: vi.fn(),
      findByIdForSettings: vi.fn(),
      findByIdWithRelations: vi.fn(),
      findCategoryStats: vi.fn(),
      updateUser: vi.fn(),
      upsertAiSettings: vi.fn(),
      upsertApiKey: vi.fn(),
      upsertCategoryStats: vi.fn(),
    };

    it("saveApiKey encrypts key, creates preview, and persists via repo", async () => {
      const svc = createProfileService(mockRepo);
      mockRepo.upsertApiKey.mockResolvedValueOnce({
        createdAt: new Date(),
        encryptedApiKey: "iv:cipher:tag",
        id: "key-1",
        keyPreview: "sk-ant...4a2b",
        provider: "anthropic",
        updatedAt: new Date(),
        userId: "user-1",
      });

      const result = await svc.saveApiKey(
        "user-1",
        "anthropic",
        "sk-ant-api03-1234567890abcdef4a2b"
      );

      expect(mockRepo.upsertApiKey).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPreview: expect.stringContaining("...4a2b"),
          provider: "anthropic",
          userId: "user-1",
        })
      );
      expect(result.provider).toBe("anthropic");
    });

    it("deleteApiKey removes key and resets active provider if matching", async () => {
      const svc = createProfileService(mockRepo);
      mockRepo.findAiSettingsByUserId.mockResolvedValueOnce({
        activeModel: "claude-3-5-sonnet-20241022",
        activeProvider: "anthropic",
        customModel: null,
        id: "settings-1",
        updatedAt: new Date(),
        userId: "user-1",
      });

      await svc.deleteApiKey("user-1", "anthropic");

      expect(mockRepo.deleteApiKey).toHaveBeenCalledWith("user-1", "anthropic");
      expect(mockRepo.upsertAiSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          activeModel: "openai/gpt-oss-120b",
          activeProvider: "platform",
          userId: "user-1",
        })
      );
    });

    it("updateAiSettings rejects provider activation if no key is configured", async () => {
      const svc = createProfileService(mockRepo);
      mockRepo.findApiKeyByProvider.mockResolvedValueOnce(null);

      let caughtError: unknown;
      try {
        await svc.updateAiSettings("user-1", {
          activeModel: "gpt-4o",
          activeProvider: "openai",
        });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(
        /without configured API key/i
      );
    });

    it("getAiConfig aggregates API keys, settings, and daily quota", async () => {
      const svc = createProfileService(mockRepo);
      mockRepo.findApiKeysByUserId.mockResolvedValueOnce([
        {
          createdAt: new Date("2026-10-26T10:00:00Z"),
          encryptedApiKey: "enc",
          id: "k-1",
          keyPreview: "sk-ant...4a2b",
          provider: "anthropic",
          updatedAt: new Date("2026-10-26T10:00:00Z"),
          userId: "user-1",
        },
      ]);
      mockRepo.findAiSettingsByUserId.mockResolvedValueOnce({
        activeModel: "claude-3-5-sonnet-20241022",
        activeProvider: "anthropic",
        customModel: null,
        id: "set-1",
        updatedAt: new Date("2026-10-26T10:00:00Z"),
        userId: "user-1",
      });

      const config = await svc.getAiConfig("user-1");

      expect(config.apiKeys).toHaveLength(1);
      expect(config.apiKeys[0]?.provider).toBe("anthropic");
      expect(config.settings.activeProvider).toBe("anthropic");
      expect(config.dailyQuota.isByok).toBe(true);
    });
  });

  describe("projectSubmissionToExportDto", () => {
    it("whitelists public and user submission fields, stripping referenceFix and internal secrets", () => {
      const raw = {
        aiFeedback: "Good explanation of off-by-one error",
        challenge: {
          buggyArtifact: { secretHiddenCode: true },
          category: { name: "Concurrency" },
          difficulty: "hard",
          id: "chal-1",
          preventionNotes: "secret notes",
          referenceFix: { patch: "diff content that must stay private" },
          title: "Race Condition in Auth",
        },
        challengeId: "chal-1",
        createdAt: new Date("2026-10-01T12:00:00.000Z"),
        evaluationDetails: { internalMetrics: 123 },
        fixCorrect: true,
        hintsUsed: 1,
        id: "sub-123",
        localizationAnswer: "line 42",
        localizationCorrect: true,
        preventionAnswer: "Use mutex lock",
        preventionScore: 100,
        proposedFix: { myDiff: "fixed" },
        rootCauseExplanation: "=SUM(1+1)",
        rootCauseScore: 90,
        timeSpentSeconds: 180,
        totalScore: 95,
        userId: "user-456",
      };

      const dto = projectSubmissionToExportDto(raw as never);

      expect(dto).toEqual({
        aiFeedback: "Good explanation of off-by-one error",
        challengeCategory: "Concurrency",
        challengeDifficulty: "hard",
        challengeTitle: "Race Condition in Auth",
        fixCorrect: true,
        hintsUsed: 1,
        id: "sub-123",
        localizationCorrect: true,
        preventionAnswer: "Use mutex lock",
        rootCauseExplanation: "=SUM(1+1)",
        submittedAt: "2026-10-01T12:00:00.000Z",
        timeSpentSeconds: 180,
        totalScore: 95,
      });
      expect(dto).not.toHaveProperty("referenceFix");
      expect(dto).not.toHaveProperty("buggyArtifact");
      expect(dto).not.toHaveProperty("preventionNotes");
      expect(dto).not.toHaveProperty("evaluationDetails");
      expect(dto).not.toHaveProperty("userId");
    });
  });

  describe("formatSubmissionsCsv", () => {
    it("formats CSV with headers and RFC 4180 escaping and formula sanitization", () => {
      const dtos = [
        {
          aiFeedback: "Nice job!",
          challengeCategory: "State",
          challengeDifficulty: "easy",
          challengeTitle: 'Title with "quotes" and, commas',
          fixCorrect: true,
          hintsUsed: 0,
          id: "sub-1",
          localizationCorrect: true,
          preventionAnswer: "None",
          rootCauseExplanation: "=2+5*cmd",
          submittedAt: "2026-10-01T12:00:00.000Z",
          timeSpentSeconds: 60,
          totalScore: 100,
        },
      ];

      const csv = formatSubmissionsCsv(dtos);
      const lines = csv.split("\r\n");

      expect(lines[0]).toBe(
        "ID,Challenge Title,Category,Difficulty,Total Score,Fix Correct,Localization Correct,Hints Used,Time Spent (s),Root Cause Explanation,Prevention Answer,AI Feedback,Submitted At"
      );
      // Double quotes escaped as "", commas quoted, formula neutralized with '
      expect(lines[1]).toContain('"Title with ""quotes"" and, commas"');
      expect(lines[1]).toContain('"\'=2+5*cmd"');
    });

    it("returns only header row when submissions list is empty", () => {
      const csv = formatSubmissionsCsv([]);
      expect(csv).toBe(
        "ID,Challenge Title,Category,Difficulty,Total Score,Fix Correct,Localization Correct,Hints Used,Time Spent (s),Root Cause Explanation,Prevention Answer,AI Feedback,Submitted At"
      );
    });
  });

  describe("formatSubmissionsJson", () => {
    it("formats submissions into valid indented JSON", () => {
      const dtos = [
        {
          aiFeedback: null,
          challengeCategory: "Auth",
          challengeDifficulty: "medium",
          challengeTitle: "Token Expiry",
          fixCorrect: true,
          hintsUsed: 0,
          id: "sub-2",
          localizationCorrect: true,
          preventionAnswer: null,
          rootCauseExplanation: "Expired token check was inverted",
          submittedAt: "2026-10-02T10:00:00.000Z",
          timeSpentSeconds: 120,
          totalScore: 85,
        },
      ];

      const jsonStr = formatSubmissionsJson(dtos);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toEqual(dtos);
      expect(jsonStr).toContain('  "challengeTitle": "Token Expiry"');
    });
  });

  describe("exportUserSubmissions", () => {
    it("calls repo.findAllSubmissionsByUserId and formats JSON export", async () => {
      const mockRaw = [
        {
          aiFeedback: "Well done",
          challenge: {
            category: { name: "Security" },
            difficulty: "medium",
            title: "SQL Injection",
          },
          createdAt: new Date("2026-10-15T08:00:00.000Z"),
          fixCorrect: true,
          hintsUsed: 0,
          id: "sub-999",
          localizationCorrect: true,
          preventionAnswer: "Use prepared statements",
          rootCauseExplanation: "Direct string concat in query",
          timeSpentSeconds: 45,
          totalScore: 100,
        },
      ];

      const mockRepo = {
        findAllSubmissionsByUserId: vi.fn().mockResolvedValue(mockRaw),
      };

      const svc = createProfileService(mockRepo as never);
      const result = await svc.exportUserSubmissions("user-1", "json");

      expect(mockRepo.findAllSubmissionsByUserId).toHaveBeenCalledWith(
        "user-1",
        1000
      );
      expect(result.mimeType).toContain("application/json");
      expect(result.filename).toMatch(/^submissions-\d{4}-\d{2}-\d{2}\.json$/);
      const parsed = JSON.parse(result.content);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].challengeTitle).toBe("SQL Injection");
    });

    it("formats CSV export with proper MIME type and filename", async () => {
      const mockRaw = [
        {
          aiFeedback: null,
          challenge: {
            category: { name: "Security" },
            difficulty: "easy",
            title: "XSS Defense",
          },
          createdAt: new Date("2026-10-15T08:00:00.000Z"),
          fixCorrect: true,
          hintsUsed: 0,
          id: "sub-1000",
          localizationCorrect: true,
          preventionAnswer: null,
          rootCauseExplanation: "Unescaped HTML insertion",
          timeSpentSeconds: 30,
          totalScore: 90,
        },
      ];

      const mockRepo = {
        findAllSubmissionsByUserId: vi.fn().mockResolvedValue(mockRaw),
      };

      const svc = createProfileService(mockRepo as never);
      const result = await svc.exportUserSubmissions("user-1", "csv");

      expect(result.mimeType).toContain("text/csv");
      expect(result.filename).toMatch(/^submissions-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.content).toContain("XSS Defense");
      expect(result.content.split("\r\n")).toHaveLength(2);
    });
  });
});
