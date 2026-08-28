import { describe, expect, it } from "vitest";
import { saveChallenge } from "./service";

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
    await saveChallenge(
      {
        categorySlug: "react-rendering",
        difficulty: "medium",
        hints: [{ socraticPrompt: "hint" }],
        prompt: "prompt",
        rootCauseSummary: "cause",
        status: "draft",
        title: "Test",
      },
      repo
    );
    expect(calls).toEqual([
      "insertChallenge",
      "insertHints",
      "upsertEmbedding",
    ]);
  });
});
