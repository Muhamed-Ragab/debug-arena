import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

describe("QuestionGeneratorStudio", () => {
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
});
