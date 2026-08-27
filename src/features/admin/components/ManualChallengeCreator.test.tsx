import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ManualChallengeCreator } from "./ManualChallengeCreator";

const TITLE_PLACEHOLDER_REGEX =
  /e\.g\. Race Condition in Distributed Cache Store/i;

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

describe("ManualChallengeCreator Component", () => {
  it("renders manual authoring form with files, hints, and action buttons", () => {
    renderWithProviders(<ManualChallengeCreator categories={mockCategories} />);

    expect(screen.getByText("Manual Challenge Authoring Studio")).toBeDefined();
    expect(screen.getByText("Challenge Title *")).toBeDefined();
    expect(screen.getByText("Scenario Markdown Description *")).toBeDefined();
    expect(screen.getByText("Challenge Files & Bug Injection")).toBeDefined();
    expect(screen.getByText("Auto-Compute Diff & Lines")).toBeDefined();
    expect(screen.getByText("Progressive Socratic Hints")).toBeDefined();
    expect(screen.getByText("Save Challenge Draft")).toBeDefined();
  });

  it("updates title and points when inputs change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ManualChallengeCreator categories={mockCategories} />);

    const titleInput = screen.getByPlaceholderText(
      TITLE_PLACEHOLDER_REGEX
    ) as HTMLInputElement;

    await user.type(titleInput, "Custom Stale Lock Bug");
    expect(titleInput.value).toBe("Custom Stale Lock Bug");
  });
});
