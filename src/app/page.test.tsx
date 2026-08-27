import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";
import { Providers } from "./providers";

const HEADING_RE = /Debug like it's 2am on call/i;

describe("HomePage", () => {
  it("renders the hero heading with providers", async () => {
    render(
      <Providers>
        <HomePage />
      </Providers>
    );
    expect(
      await screen.findByRole("heading", {
        name: HEADING_RE,
      })
    ).toBeInTheDocument();
  });
});
