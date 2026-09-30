import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import { Providers } from "./providers";

vi.mock("@/features/category/service", () => ({
  categoryService: {
    getActiveCategories: vi.fn().mockResolvedValue([]),
  },
}));

const HEADING_RE = /Debug like it's 2am on call/i;

describe("HomePage", () => {
  it("renders the hero heading with providers", async () => {
    const page = await HomePage();
    render(<Providers>{page}</Providers>);
    expect(
      await screen.findByRole("heading", {
        name: HEADING_RE,
      })
    ).toBeInTheDocument();
  });
});
