import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Challenge } from "@/lib/domain/types";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ChallengeScreen } from "./ChallengeScreen";

const LINE_MARK_REGEX = /Line 5 marked|Click lines/i;
const HINTS_TAB_REGEX = /^hints$/i;
const REVEAL_REGEX = /Reveal \(−10 pts\)/i;
const HINT_1_REGEX = /Hint 1/i;

vi.mock("next/navigation", () => ({
  usePathname: () => "/challenges/123",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("ChallengeScreen Component", () => {
  const mockChallenge: Challenge = {
    category: "React Rendering",
    difficulty: "Easy",
    filePath: "Counter.tsx",
    id: "11111111-1111-1111-1111-111111111111",
    points: 100,
    time: "~15m",
    title: "Stale Closure in Counter Interval",
  };

  const mockCodeLines = [
    "export function Counter() {",
    "  const [count, setCount] = useState(0);",
    "  useEffect(() => {",
    "    const id = setInterval(() => {",
    "      setCount(count + 1);",
    "    }, 1000);",
    "    return () => clearInterval(id);",
    "  }, []);",
    "}",
  ];

  const mockHints = [
    {
      order: 1,
      penaltyPoints: 10,
      socraticPrompt: "Look at the dependency array and closure of count.",
    },
  ];

  it("renders scenario, code lines, and tabs", () => {
    renderWithProviders(
      <ChallengeScreen
        challenge={mockChallenge}
        codeLines={mockCodeLines}
        fileName="Counter.tsx"
        hints={mockHints}
        scenarioParagraphs={["The counter increments once then stops."]}
      />
    );

    expect(
      screen.getAllByText("Stale Closure in Counter Interval").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Counter.tsx").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("The counter increments once then stops.")
    ).toBeInTheDocument();
    expect(screen.getByText(LINE_MARK_REGEX)).toBeInTheDocument();
  });

  it("switches to hints tab and reveals a hint", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChallengeScreen
        challenge={mockChallenge}
        codeLines={mockCodeLines}
        hints={mockHints}
      />
    );

    // Switch to hints tab
    const hintsTabBtn = screen.getByRole("button", { name: HINTS_TAB_REGEX });
    await user.click(hintsTabBtn);

    expect(screen.getByText(REVEAL_REGEX)).toBeInTheDocument();

    // Click to reveal hint
    const revealBtn = screen.getByRole("button", { name: HINT_1_REGEX });
    await user.click(revealBtn);

    expect(
      screen.getByText("Look at the dependency array and closure of count.")
    ).toBeInTheDocument();
  });
});
