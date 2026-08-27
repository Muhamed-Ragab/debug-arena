import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ResultsScreen } from "./ResultsScreen";

const BACK_BTN_REGEX = /back to challenges/i;

vi.mock("next/navigation", () => ({
  usePathname: () => "/submissions/123/results",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("ResultsScreen Component", () => {
  const mockScoreParts = [
    {
      desc: "Exact bug location identified",
      label: "Localization",
      max: 25,
      score: 25,
    },
    {
      desc: "Accurately diagnosed stale closure mechanism",
      label: "Root Cause",
      max: 25,
      score: 24,
    },
    {
      desc: "Passed all hidden unit test cases",
      label: "Fix Quality",
      max: 25,
      score: 25,
    },
    {
      desc: "Strong prevention analysis",
      label: "Prevention",
      max: 25,
      score: 20,
    },
  ];

  it("renders total score and challenge title accurately", () => {
    renderWithProviders(
      <ResultsScreen
        aiFeedback="Spot on diagnosis!"
        canonicalExplanation="setInterval captured initial count."
        challengeTitle="Stale Closure in Counter Interval"
        evaluationDetails={{
          alignmentPercent: 90,
          isAiGraded: true,
          isCorrect: true,
          needsEnhancement: false,
        }}
        maxScore={100}
        preventionNotes={[
          "Use functional state updater setCount(c => c + 1).",
          "Enable ESLint exhaustive-deps rule.",
        ]}
        scoreParts={mockScoreParts}
        totalScore={94}
        userExplanation="The setInterval callback forms a closure over count = 0."
        userSolution="setCount(c => c + 1)"
      />
    );

    expect(
      screen.getByText("Stale Closure in Counter Interval")
    ).toBeInTheDocument();
    expect(screen.getByText("94")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("Localization")).toBeInTheDocument();
    expect(screen.getByText("Fix Quality")).toBeInTheDocument();
  });

  it("renders dynamic AI evaluation details including correctness and enhancement suggestions", () => {
    renderWithProviders(
      <ResultsScreen
        aiFeedback="The explanation captures the interval closure but omitted the functional updater fix."
        canonicalExplanation="setInterval captures stale count 0 on mount."
        challengeTitle="Stale Closure in Counter Interval"
        evaluationDetails={{
          alignmentPercent: 88,
          enhancementSuggestions: [
            "Elaborate on functional state updater pattern.",
          ],
          isAiGraded: true,
          isCorrect: true,
          keyConceptsIdentified: ["Stale closure"],
          missedMechanisms: ["State updater syntax"],
          needsEnhancement: true,
        }}
        maxScore={100}
        preventionNotes={[
          "Use functional state updater setCount(c => c + 1).",
          "Enable ESLint exhaustive-deps rule.",
        ]}
        scoreParts={mockScoreParts}
        totalScore={85}
        userExplanation="State variable count is captured in interval closure."
        userSolution="setCount(count + 1)"
      />
    );

    expect(screen.getByText("Correct Diagnosis")).toBeInTheDocument();
    expect(screen.getByText("Needs Enhancement")).toBeInTheDocument();
    expect(screen.getByText("88% alignment")).toBeInTheDocument();
    expect(
      screen.getByText("Elaborate on functional state updater pattern.")
    ).toBeInTheDocument();
    expect(screen.getByText("✓ Stale closure")).toBeInTheDocument();
    expect(screen.getByText("• State updater syntax")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The explanation captures the interval closure but omitted the functional updater fix."
      )
    ).toBeInTheDocument();
  });

  it("invokes onNext when clicking Back to challenges button", async () => {
    const handleNext = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <ResultsScreen
        aiFeedback="Good diagnosis."
        canonicalExplanation="setInterval captures stale count."
        challengeTitle="Stale Closure in Counter Interval"
        evaluationDetails={{
          alignmentPercent: 80,
          isAiGraded: true,
          isCorrect: true,
          needsEnhancement: false,
        }}
        maxScore={100}
        onNext={handleNext}
        preventionNotes={["Use functional state updater."]}
        scoreParts={mockScoreParts}
        totalScore={94}
        userExplanation="The interval closure captures stale count."
        userSolution="setCount(c => c + 1)"
      />
    );

    const backButton = screen.getByRole("button", {
      name: BACK_BTN_REGEX,
    });
    await user.click(backButton);

    expect(handleNext).toHaveBeenCalledTimes(1);
  });
});
