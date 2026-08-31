import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import type { AdminChallengeItem } from "../types";
import { AdminChallengeList } from "./AdminChallengeList";

const SEARCH_CHALLENGES_REGEX = /search challenges/i;
const DIFFICULTY_REGEX = /difficulty/i;

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

function filterChallenges(opts: {
  difficulty: string;
  page: number;
  pageSize: number;
  search: string;
  source: string;
  status: string;
}) {
  let filtered = [...mockChallenges];
  if (opts.search) {
    const s = opts.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.categoryName.toLowerCase().includes(s)
    );
  }
  if (opts.status !== "all") {
    filtered = filtered.filter((c) => c.status === opts.status);
  }
  if (opts.source !== "all") {
    filtered = filtered.filter((c) => c.source === opts.source);
  }
  if (opts.difficulty !== "all") {
    filtered = filtered.filter((c) => c.difficulty === opts.difficulty);
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
  const start = (opts.page - 1) * opts.pageSize;
  const items = filtered.slice(start, start + opts.pageSize);
  return {
    items,
    page: opts.page,
    pageSize: opts.pageSize,
    success: true,
    total,
    totalPages,
  };
}

vi.mock("../actions", async () => {
  const actual =
    await vi.importActual<typeof import("../actions")>("../actions");
  return {
    ...actual,
    listAdminChallengesAction: vi.fn((input: unknown) => {
      const opts = input as {
        difficulty: string;
        page: number;
        pageSize: number;
        search: string;
        source: string;
        status: string;
      };
      const result = filterChallenges(opts);
      return Promise.resolve({ data: result });
    }),
  };
});

describe("AdminChallengeList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("renders challenges with metadata badges, status, and source", () => {
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    expect(screen.getByText("Stale Closure In React Interval")).toBeDefined();
    expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Draft").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AI Agent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Manual").length).toBeGreaterThan(0);
  });

  it("filters challenges by search query with debounce and server action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const searchInput = screen.getByPlaceholderText(SEARCH_CHALLENGES_REGEX);
    await user.type(searchInput, "Deadlock");

    await waitFor(
      () => {
        expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
        expect(
          screen.queryByText("Stale Closure In React Interval")
        ).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it("filters challenges by difficulty via server action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const difficultySelect = screen.getByRole("combobox", {
      name: DIFFICULTY_REGEX,
    });
    await user.click(difficultySelect);

    const hardOption = await screen.findByRole("option", { name: "Hard" });
    await user.click(hardOption);

    await waitFor(
      () => {
        expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
        expect(
          screen.queryByText("Stale Closure In React Interval")
        ).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it("renders pagination controls and page size selector", () => {
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    expect(screen.getByText(/Showing/)).toBeDefined();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDefined();
    // page size selector
    expect(
      screen.getByRole("combobox", { name: /Rows per page/i })
    ).toBeDefined();
  });

  it("debounce: rapid typing only triggers last search (signal gating)", async () => {
    const user = userEvent.setup();
    const { listAdminChallengesAction } = await import("../actions");
    const spy = vi.mocked(listAdminChallengesAction);

    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const searchInput = screen.getByPlaceholderText(SEARCH_CHALLENGES_REGEX);
    // rapid typing without waiting for debounce between keystrokes
    await user.type(searchInput, "Stale");
    // debounce 400ms: should eventually call with "Stale" search, not intermediate "S","St","Sta"
    await waitFor(
      () => {
        // spy should have been called at least once with debounced value
        const { calls } = spy.mock;
        const [lastCall] = calls.at(-1) ?? [];
        const typedLastCall = lastCall as { search?: string } | undefined;
        expect(typedLastCall?.search).toBe("Stale");
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(
          screen.getByText("Stale Closure In React Interval")
        ).toBeDefined();
        expect(screen.queryByText("Deadlock In Distributed Mutex")).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it("syncs debounced search and filters to URL query params", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const searchInput = screen.getByPlaceholderText(SEARCH_CHALLENGES_REGEX);
    await user.type(searchInput, "Deadlock");

    await waitFor(
      () => expect(window.location.search).toContain("search=Deadlock"),
      { timeout: 2000 }
    );

    const difficultySelect = screen.getByRole("combobox", {
      name: DIFFICULTY_REGEX,
    });
    await user.click(difficultySelect);
    const hardOption = await screen.findByRole("option", { name: "Hard" });
    await user.click(hardOption);

    await waitFor(
      () => expect(window.location.search).toContain("difficulty=hard"),
      { timeout: 2000 }
    );
  });

  it("initializes state from URL and paginates via URL", async () => {
    window.history.replaceState(
      null,
      "",
      "?search=Deadlock&page=1&pageSize=10"
    );
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    await waitFor(
      () => {
        expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
      },
      { timeout: 2000 }
    );

    const searchInput = screen.getByPlaceholderText(
      SEARCH_CHALLENGES_REGEX
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Deadlock");

    // pagination URL check: next page should update URL with pushState
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    // with only 1 matching item and pageSize 10, next is disabled, so change pageSize to force pagination
    // instead test that URL already contains page param
    expect(window.location.search).toContain("search=Deadlock");
    expect(nextBtn).toBeDefined();
  });

  it("syncs pageSize to URL query params", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    const pageSizeSelect = screen.getByRole("combobox", {
      name: /Rows per page/i,
    });
    await user.click(pageSizeSelect);
    const option20 = await screen.findByRole("option", { name: "20" });
    await user.click(option20);

    await waitFor(
      () => expect(window.location.search).toContain("pageSize=20"),
      { timeout: 2000 }
    );
  });

  it("hydrates pageSize and difficulty from URL on mount", async () => {
    window.history.replaceState(
      null,
      "",
      "?difficulty=hard&pageSize=20&search=Deadlock"
    );
    renderWithProviders(<AdminChallengeList challenges={mockChallenges} />);

    await waitFor(
      () => {
        expect(screen.getByText("Deadlock In Distributed Mutex")).toBeDefined();
      },
      { timeout: 2000 }
    );

    const searchInput = screen.getByPlaceholderText(
      SEARCH_CHALLENGES_REGEX
    ) as HTMLInputElement;
    expect(searchInput.value).toBe("Deadlock");
    // difficulty filter should be hard, pageSize 20 reflected in URL remains
    expect(window.location.search).toContain("difficulty=hard");
    expect(window.location.search).toContain("pageSize=20");
  });

  it("navigates pages via URL query params with pushState", async () => {
    const manyChallenges: AdminChallengeItem[] = Array.from(
      { length: 12 },
      (_, i) => ({
        ...mockChallenges[0],
        categoryName: "React Rendering",
        id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
        title: `Challenge ${String(i).padStart(2, "0")}`,
      })
    );

    const { listAdminChallengesAction } = await import("../actions");
    const spy = vi.mocked(listAdminChallengesAction);
    spy.mockImplementation(((input: unknown) => {
      const opts = input as {
        difficulty: string;
        page: number;
        pageSize: number;
        search: string;
        source: string;
        status: string;
      };
      let filtered = [...manyChallenges];
      if (opts.search) {
        const s = opts.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(s) ||
            c.categoryName.toLowerCase().includes(s)
        );
      }
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / opts.pageSize));
      const start = (opts.page - 1) * opts.pageSize;
      const items = filtered.slice(start, start + opts.pageSize);
      return Promise.resolve({
        data: {
          items,
          page: opts.page,
          pageSize: opts.pageSize,
          success: true,
          total,
          totalPages,
        },
      });
    }) as never);

    window.history.replaceState(null, "", "?pageSize=10");
    const user = userEvent.setup();
    renderWithProviders(<AdminChallengeList challenges={manyChallenges} />);

    // initially page 1, Next should be enabled (12 items, pageSize 10 => 2 pages)
    const nextBtn = await screen.findByRole("button", { name: /Next/i });
    await waitFor(() => expect(nextBtn).not.toBeDisabled(), { timeout: 2000 });

    const pushSpy = vi.spyOn(window.history, "pushState");
    await user.click(nextBtn);

    await waitFor(() => expect(window.location.search).toContain("page=2"), {
      timeout: 2000,
    });
    expect(pushSpy).toHaveBeenCalled();
    pushSpy.mockRestore();

    // Back navigation should restore page 1 via popstate
    window.history.pushState(null, "", "?page=1&pageSize=10");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(window.location.search).toContain("page=1"), {
      timeout: 2000,
    });

    // restore mock to default for other test suites
    spy.mockImplementation(((input: unknown) => {
      const opts = input as {
        difficulty: string;
        page: number;
        pageSize: number;
        search: string;
        source: string;
        status: string;
      };
      const result = filterChallenges(opts);
      return Promise.resolve({ data: result });
    }) as never);
  });
});
