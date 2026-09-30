import { describe, expect, it } from "vitest";
import { buildLeaderboardTabs } from "./tabs";

describe("buildLeaderboardTabs", () => {
  it("builds category tab identities from active database slugs", () => {
    const tabs = buildLeaderboardTabs([
      {
        color: "#123456",
        description: null,
        icon: "Server",
        id: "category-id",
        isActive: true,
        name: "Distributed Systems",
        slug: "distributed-systems",
        sortOrder: 7,
      },
    ]);

    expect(tabs.map(({ id }) => id)).toEqual([
      "week",
      "alltime",
      "category:distributed-systems",
    ]);
    expect(tabs[2]?.category?.name).toBe("Distributed Systems");
  });
});
