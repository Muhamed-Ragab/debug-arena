import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { QuestionGeneratorStudio } from "./QuestionGeneratorStudio";

const STALE_CLOSURE_REGEX = /e\.g\. Stale closure/i;

const mockCategories = [
  {
    description: "Component lifecycle and state",
    id: "cat-1",
    name: "React Rendering",
    slug: "react-rendering",
  },
  {
    description: "Race conditions and concurrency",
    id: "cat-2",
    name: "Backend Concurrency",
    slug: "backend-concurrency",
  },
];

vi.mock("../actions", () => ({
  generateQuestionAction: vi.fn().mockResolvedValue({ data: { draft: null } }),
  refineQuestionAction: vi.fn().mockResolvedValue({ data: { draft: null } }),
  saveAdminChallengeAction: vi
    .fn()
    .mockResolvedValue({ data: { challengeId: "test-id", success: true } }),
}));

import { generateQuestionAction } from "../actions";

describe("QuestionGeneratorStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders scenario presets, category selectors, and generator trigger", () => {
    renderWithProviders(
      <QuestionGeneratorStudio categories={mockCategories} />
    );

    expect(screen.getByText("AI Challenge Synthesis Agent")).toBeDefined();
    expect(screen.getByText("Stale Closure in useEffect")).toBeDefined();
    expect(screen.getByText("Double-Spending Race Condition")).toBeDefined();
    expect(screen.getByText("Synthesize Challenge Draft")).toBeDefined();
  });

  it("updates topic input when clicking preset chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <QuestionGeneratorStudio categories={mockCategories} />
    );

    const presetChip = screen.getByText("Double-Spending Race Condition");
    await user.click(presetChip);

    const input = screen.getByPlaceholderText(
      STALE_CLOSURE_REGEX
    ) as HTMLInputElement;
    expect(input.value).toContain("Concurrent wallet balance deduction");
  });

  it("renders difficulty Select with id difficulty-select-studio and default medium", () => {
    renderWithProviders(
      <QuestionGeneratorStudio categories={mockCategories} />
    );

    const trigger = document.getElementById("difficulty-select-studio");
    expect(trigger).not.toBeNull();
    expect(trigger?.textContent?.toLowerCase()).toContain("medium");
    // Ensure button group removed: old grid-cols-3 gap-1 inside bg-inset p-1 should not exist as 3 difficulty buttons
    // Select handles difficulty now, not 3 ghost buttons
    const difficultyLabel = screen.getByText("Difficulty");
    expect(difficultyLabel.tagName.toLowerCase()).toBe("label");
    expect(difficultyLabel.getAttribute("for")).toBe(
      "difficulty-select-studio"
    );
  });

  it("does not render old 3-button difficulty grid", () => {
    renderWithProviders(
      <QuestionGeneratorStudio categories={mockCategories} />
    );
    // Old implementation had 3 buttons with exact lowercase text "easy"/"medium"/"hard" in a grid
    // New Select shows capitalized labels, and trigger is combobox not button group
    const trigger = document.getElementById("difficulty-select-studio");
    expect(trigger).not.toBeNull();
    // Query for lowercase easy button that was part of old grid — should be absent as button role
    // Note: Select options are role=option after opening, not buttons in initial render
    const easyButtons = screen.queryAllByRole("button", { name: /^easy$/i });
    // There might be 0 easy buttons in new UI (Select trigger is combobox)
    // Filter to ensure no ghost variant buttons remain
    const hasOldEasyButton = easyButtons.some(
      (btn) => btn.textContent?.trim().toLowerCase() === "easy"
    );
    expect(hasOldEasyButton).toBe(false);
  });

  it("changing Select to hard and clicking Generate sends difficulty hard to action", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <QuestionGeneratorStudio categories={mockCategories} />
    );

    const trigger = document.getElementById("difficulty-select-studio");
    expect(trigger).not.toBeNull();
    await user.click(trigger as HTMLElement);

    // Base UI Select renders options with role="option"
    const hardOption = await screen.findByRole("option", { name: /^Hard$/i });
    await user.click(hardOption);

    expect(trigger?.textContent?.toLowerCase()).toContain("hard");

    const generateBtn = screen.getByText("Synthesize Challenge Draft");
    await user.click(generateBtn);

    expect(generateQuestionAction).toHaveBeenCalledTimes(1);
    const callArg = (generateQuestionAction as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(callArg.difficulty).toBe("hard");
  });
});
