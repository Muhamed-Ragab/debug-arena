import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Challenge } from "@/lib/domain/types";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ChallengeBrowser } from "./ChallengeBrowser";

const SEARCH_INPUT_REGEX = /search challenges/i;
const ALL_CATEGORIES_REGEX = /all categories/i;
const STATE_MUTATIONS_REGEX = /state mutations/i;
const ALL_LEVELS_REGEX = /all levels/i;
const HARD_DIFF_REGEX = /^hard$/i;

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/challenges",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockChallenges: Challenge[] = [
  {
    category: "React Rendering",
    difficulty: "Easy",
    filePath: "src/Counter.tsx",
    id: "11111111-1111-1111-1111-111111111111",
    points: 100,
    solves: 42,
    time: "~15m",
    title: "Stale Closure in Counter Interval",
  },
  {
    category: "Backend Concurrency",
    difficulty: "Hard",
    filePath: "src/transfer.ts",
    id: "22222222-2222-2222-2222-222222222222",
    points: 300,
    solves: 12,
    time: "~30m",
    title: "Race Condition in Account Balance",
  },
  {
    category: "State Mutations",
    difficulty: "Medium",
    filePath: "src/store.ts",
    id: "33333333-3333-3333-3333-333333333333",
    points: 200,
    solves: 25,
    time: "~20m",
    title: "Direct State Mutation in Nested Object",
  },
];

describe("ChallengeBrowser Component", () => {
  it("renders challenge cards from initialChallenges", () => {
    renderWithProviders(
      <ChallengeBrowser initialChallenges={mockChallenges} />
    );

    expect(
      screen.getByText("Stale Closure in Counter Interval")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Race Condition in Account Balance")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Direct State Mutation in Nested Object")
    ).toBeInTheDocument();
  });

  it("filters challenges by search term", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser initialChallenges={mockChallenges} />
    );

    const searchInput = screen.getByPlaceholderText(SEARCH_INPUT_REGEX);
    await user.type(searchInput, "closure");

    expect(
      screen.getByText("Stale Closure in Counter Interval")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Race Condition in Account Balance")
    ).not.toBeInTheDocument();
  });

  it("filters challenges by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser initialChallenges={mockChallenges} />
    );

    const categorySelectTrigger = screen.getByRole("button", {
      name: ALL_CATEGORIES_REGEX,
    });
    await user.click(categorySelectTrigger);

    const categoryOption = screen.getByRole("option", {
      name: STATE_MUTATIONS_REGEX,
    });
    await user.click(categoryOption);

    expect(
      screen.getByText("Direct State Mutation in Nested Object")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Stale Closure in Counter Interval")
    ).not.toBeInTheDocument();
  });

  it("filters challenges by difficulty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser initialChallenges={mockChallenges} />
    );

    const diffSelectTrigger = screen.getByRole("button", {
      name: ALL_LEVELS_REGEX,
    });
    await user.click(diffSelectTrigger);

    const hardOption = screen.getByRole("option", { name: HARD_DIFF_REGEX });
    await user.click(hardOption);

    expect(
      screen.getByText("Race Condition in Account Balance")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Stale Closure in Counter Interval")
    ).not.toBeInTheDocument();
  });
});
