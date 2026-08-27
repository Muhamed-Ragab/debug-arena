import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import {
  AdminChallengeList,
  type AdminChallengeItem,
} from "./AdminChallengeList";

const SEARCH_CHALLENGES_REGEX = /search challenges/i;

const mockChallenges: AdminChallengeItem[] = [
  {
    buggyArtifact: {},
    categoryId: "cat-1",
    categoryName: "React Rendering",
    categorySlug: "react-rendering",
    createdAt: new Date(),
    difficulty: "easy",
    format: "code_snippet",
    hints: [],
    id: "11111111-1111-1111-1111-111111111111",
    preventionNotes: "Notes",
    prompt: "Fix bug",
    referenceFix: {},
    rootCauseSummary: "Summary",
    solvesCount: 5,
    source: "ai_generated",
    status: "published",
    submissionsCount: 10,
    title: "Stale Closure In React Interval",
  },
  {
    buggyArtifact: {},
    categoryId: "cat-2",
    categoryName: "Backend Concurrency",
    categorySlug: "backend-concurrency",
    createdAt: new Date(),
    difficulty: "hard",
    format: "code_snippet",
    hints: [],
    id: "22222222-2222-2222-2222-222222222222",
    preventionNotes: "Notes",
    prompt: "Fix race",
    referenceFix: {},
    rootCauseSummary: "Summary",
    solvesCount: 2,
    source: "manual",
    status: "draft",
    submissionsCount: 3,
    title: "Deadlock In Distributed Mutex",
  },
];

describe("AdminChallengeList", () => {
  it("renders challenges with metadata badges, status, and source", () => {
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    expect(screen.getByText("Stale Closure In React Interval")).toBeDefined();
    expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Draft").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI Agent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Manual").length).toBeGreaterThan(0);
  });

  it("filters challenges by search query", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const searchInput = screen.getByPlaceholderText(SEARCH_CHALLENGES_REGEX);
    await user.type(searchInput, "Deadlock");

    expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
    expect(screen.queryByText("Stale Closure In React Interval")).toBeNull();
  });
});
