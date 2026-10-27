import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryDTO } from "@/features/category/types";
import type { Challenge } from "@/lib/domain/types";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import { ChallengeBrowser } from "./ChallengeBrowser";

const SEARCH_INPUT_REGEX = /search challenges/i;
const ALL_CATEGORIES_REGEX = /all categories/i;
const STATE_MANAGEMENT_REGEX = /state management/i;
const ALL_LEVELS_REGEX = /all levels/i;
const HARD_DIFF_REGEX = /^hard$/i;

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/challenges",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockRawChallenges = [
  {
    buggyArtifact: {
      entryFile: "src/Counter.tsx",
      points: 100,
      timeLimit: "15 min",
    },
    categoryColor: "#3b82f6",
    categoryIcon: "Layers",
    categoryName: "React Rendering",
    categorySlug: "react-rendering",
    difficulty: "easy",
    id: "11111111-1111-1111-1111-111111111111",
    prompt: "Stale Closure in Counter Interval",
    submissions: [{ fixCorrect: true, totalScore: 100, userId: "u1" }],
    title: "Stale Closure in Counter Interval",
  },
  {
    buggyArtifact: {
      entryFile: "src/transfer.ts",
      points: 300,
      timeLimit: "30 min",
    },
    categoryColor: "#10b981",
    categoryIcon: "Cpu",
    categoryName: "Backend Concurrency",
    categorySlug: "backend-concurrency",
    difficulty: "hard",
    id: "22222222-2222-2222-2222-222222222222",
    prompt: "Race Condition in Account Balance",
    submissions: [{ fixCorrect: true, totalScore: 100, userId: "u1" }],
    title: "Race Condition in Account Balance",
  },
  {
    buggyArtifact: {
      entryFile: "src/store.ts",
      points: 200,
      timeLimit: "20 min",
    },
    categoryColor: "#f59e0b",
    categoryIcon: "Database",
    categoryName: "State Management",
    categorySlug: "state-management",
    difficulty: "medium",
    id: "33333333-3333-3333-3333-333333333333",
    prompt: "Direct State Mutation in Nested Object",
    submissions: [{ fixCorrect: true, totalScore: 100, userId: "u1" }],
    title: "Direct State Mutation in Nested Object",
  },
];

function filterRawChallenges(opts: {
  category?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  let filtered = [...mockRawChallenges];
  if (opts.search) {
    const s = opts.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.categoryName.toLowerCase().includes(s)
    );
  }
  if (opts.category && opts.category !== "all") {
    filtered = filtered.filter(
      (c) =>
        c.categorySlug === opts.category || c.categoryName === opts.category
    );
  }
  if (opts.difficulty && opts.difficulty !== "all") {
    filtered = filtered.filter(
      (c) => c.difficulty.toLowerCase() === opts.difficulty?.toLowerCase()
    );
  }
  const pageSize = opts.pageSize ?? 6;
  const page = opts.page ?? 1;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    page,
    pageSize,
    success: true,
    total,
    totalPages,
  };
}

vi.mock("@/features/challenge/actions", () => ({
  listChallengesAction: vi.fn(
    (input: {
      category?: string;
      difficulty?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    }) => {
      const result = filterRawChallenges(input);
      return Promise.resolve({ data: result });
    }
  ),
}));

const mockChallenges: Challenge[] = [
  {
    category: "React Rendering",
    categorySlug: "react-rendering",
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
    categorySlug: "backend-concurrency",
    difficulty: "Hard",
    filePath: "src/transfer.ts",
    id: "22222222-2222-2222-2222-222222222222",
    points: 300,
    solves: 12,
    time: "~30m",
    title: "Race Condition in Account Balance",
  },
  {
    category: "State Management",
    categorySlug: "state-management",
    difficulty: "Medium",
    filePath: "src/store.ts",
    id: "33333333-3333-3333-3333-333333333333",
    points: 200,
    solves: 25,
    time: "~20m",
    title: "Direct State Mutation in Nested Object",
  },
];

const mockCategories: CategoryDTO[] = [
  {
    color: "#3b82f6",
    description: null,
    icon: "Layers",
    id: "category-react",
    isActive: true,
    name: "React Rendering",
    slug: "react-rendering",
    sortOrder: 0,
  },
  {
    color: "#10b981",
    description: null,
    icon: "Cpu",
    id: "category-backend",
    isActive: true,
    name: "Backend Concurrency",
    slug: "backend-concurrency",
    sortOrder: 1,
  },
  {
    color: "#f59e0b",
    description: null,
    icon: "Database",
    id: "category-state",
    isActive: true,
    name: "State Management",
    slug: "state-management",
    sortOrder: 2,
  },
];

describe("ChallengeBrowser Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/challenges");
  });

  it("renders challenge cards from initialChallenges", () => {
    renderWithProviders(
      <ChallengeBrowser
        categories={mockCategories}
        initialChallenges={mockChallenges}
        stats={[]}
      />
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

  it("filters challenges by search term using server query", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser
        categories={mockCategories}
        initialChallenges={mockChallenges}
        stats={[]}
      />
    );

    const searchInput = screen.getByPlaceholderText(SEARCH_INPUT_REGEX);
    await user.type(searchInput, "closure");

    await waitFor(() => {
      expect(
        screen.getByText("Stale Closure in Counter Interval")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Race Condition in Account Balance")
      ).not.toBeInTheDocument();
    });
  });

  it("filters challenges by category using server query", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser
        categories={mockCategories}
        initialChallenges={mockChallenges}
        stats={[]}
      />
    );

    const categorySelectTrigger =
      screen.queryByRole("combobox", { name: ALL_CATEGORIES_REGEX }) ??
      screen.getByText(ALL_CATEGORIES_REGEX);
    await user.click(categorySelectTrigger);

    const categoryOption = screen.getByRole("option", {
      name: STATE_MANAGEMENT_REGEX,
    });
    await user.click(categoryOption);

    await waitFor(() => {
      expect(
        screen.getByText("Direct State Mutation in Nested Object")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Stale Closure in Counter Interval")
      ).not.toBeInTheDocument();
    });
  });

  it("filters challenges by difficulty using server query", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser
        categories={mockCategories}
        initialChallenges={mockChallenges}
        stats={[]}
      />
    );

    const diffSelectTrigger =
      screen.queryByRole("combobox", { name: ALL_LEVELS_REGEX }) ??
      screen.getByText(ALL_LEVELS_REGEX);
    await user.click(diffSelectTrigger);

    const hardOption = screen.getByRole("option", { name: HARD_DIFF_REGEX });
    await user.click(hardOption);

    await waitFor(() => {
      expect(
        screen.getByText("Race Condition in Account Balance")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Stale Closure in Counter Interval")
      ).not.toBeInTheDocument();
    });
  });

  it("renders responsive pagination controls and navigates pages", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeBrowser
        categories={mockCategories}
        initialChallenges={mockChallenges.slice(0, 1)}
        initialPage={1}
        initialPageSize={1}
        initialTotal={3}
        initialTotalPages={3}
        stats={[]}
      />
    );

    // Desktop page buttons
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toBeInTheDocument();

    // Mobile indicator
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();

    // Click next page
    const nextButtons = screen.getAllByRole("button", { name: /next page/i });
    await user.click(nextButtons[0]);

    await waitFor(() => {
      expect(window.location.search).toContain("page=2");
    });
  });
});
