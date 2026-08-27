import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { FormattedMarkdown } from "./FormattedMarkdown";

describe("FormattedMarkdown Component", () => {
  it("renders fenced code blocks with language badge and syntax lines", () => {
    const markdown =
      "Here is an example:\n\n```typescript\nconst count = 1;\nconst message = 'hello';\n```";

    renderWithProviders(<FormattedMarkdown content={markdown} />);

    expect(screen.getByText("Here is an example:")).toBeDefined();
    expect(screen.getByText(/typescript/i)).toBeDefined();
    expect(screen.getByText("Copy")).toBeDefined();
    expect(screen.getAllByText("const").length).toBeGreaterThan(0);
  });

  it("renders headings and inline code blocks", () => {
    const markdown = "## Scenario Header\n\nInspect the `useEffect` hook.";

    renderWithProviders(<FormattedMarkdown content={markdown} />);

    expect(screen.getByText("Scenario Header")).toBeDefined();
    expect(screen.getByText("useEffect")).toBeDefined();
  });

  it("renders bullet and numbered lists", () => {
    const markdown = "1. First step\n2. Second step\n- Bullet item";

    renderWithProviders(<FormattedMarkdown content={markdown} />);

    expect(screen.getByText("First step")).toBeDefined();
    expect(screen.getByText("Second step")).toBeDefined();
    expect(screen.getByText("Bullet item")).toBeDefined();
  });
});
