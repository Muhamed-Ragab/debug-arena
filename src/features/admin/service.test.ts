import { describe, expect, it } from "vitest";
import { createAdminService } from "./service";

describe("admin/service", () => {
  it("saveChallenge calls repo in order", async () => {
    const calls: string[] = [];
    const repo = {
      deleteChallengeCascade: () => {
        calls.push("cascade");
        return Promise.resolve();
      },
      deleteHintsByChallengeId: () => {
        calls.push("deleteHints");
        return Promise.resolve();
      },
      findCategories: () =>
        Promise.resolve([
          {
            id: "cat1",
            name: "React Rendering",
            slug: "react-rendering",
          } as never,
        ]),
      findChallengeById: () => Promise.resolve(null),
      findChallenges: () => Promise.resolve([]),
      findChallengesPaginated: () =>
        Promise.resolve({ rows: [], total: 0 } as never),
      insertChallenge: () => {
        calls.push("insertChallenge");
        return Promise.resolve({ id: "new1" } as never);
      },
      insertHints: () => {
        calls.push("insertHints");
        return Promise.resolve();
      },
      updateChallenge: () => {
        calls.push("updateChallenge");
        return Promise.resolve();
      },
      upsertEmbedding: () => {
        calls.push("upsertEmbedding");
        return Promise.resolve();
      },
    } as unknown as never;
    const svc = createAdminService(repo);
    await svc.saveChallenge({
      categorySlug: "react-rendering",
      difficulty: "medium",
      hints: [{ socraticPrompt: "hint" }],
      prompt: "prompt",
      rootCauseSummary: "cause",
      status: "draft",
      title: "Test",
    });
    expect(calls).toEqual([
      "insertChallenge",
      "insertHints",
      "upsertEmbedding",
    ]);
  });

  it("getAdminChallengesPaginated maps rows and returns pagination meta", async () => {
    const mockRow = {
      buggyArtifact: {},
      category: { name: "React Rendering", slug: "react-rendering" },
      categoryId: "cat1",
      createdAt: new Date("2024-01-01"),
      difficulty: "easy",
      format: "code_snippet",
      hints: [],
      id: "11111111-1111-1111-1111-111111111111",
      preventionNotes: null,
      prompt: "prompt",
      referenceFix: {},
      rootCauseSummary: "cause",
      source: "manual",
      status: "draft",
      submissions: [
        { fixCorrect: true, totalScore: 80 },
        { fixCorrect: false, totalScore: 50 },
      ],
      title: "Test Challenge",
    };
    const repo = {
      deleteChallengeCascade: () => Promise.resolve(),
      deleteHintsByChallengeId: () => Promise.resolve(),
      findAllUsers: () => Promise.resolve([]),
      findCategories: () => Promise.resolve([]),
      findChallengeById: () => Promise.resolve(null),
      findChallenges: () => Promise.resolve([]),
      findChallengesPaginated: () =>
        Promise.resolve({ rows: [mockRow], total: 1 } as never),
      insertChallenge: () => Promise.resolve({ id: "x" } as never),
      insertHints: () => Promise.resolve(),
      updateChallenge: () => Promise.resolve(),
      updateUserBanStatus: () => Promise.resolve(),
      upsertEmbedding: () => Promise.resolve(),
    } as unknown as never;

    const svc = createAdminService(repo);
    const result = await svc.getAdminChallengesPaginated({
      difficulty: "all",
      page: 1,
      pageSize: 10,
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      source: "all",
      status: "all",
    });

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Test Challenge");
    expect(result.items[0].solvesCount).toBe(1);
    expect(result.items[0].submissionsCount).toBe(2);
    expect(result.items[0].categoryName).toBe("React Rendering");
  });
});
