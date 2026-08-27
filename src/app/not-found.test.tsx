import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";
import { Providers } from "./providers";

const PAGE_NOT_FOUND_RE = /Page Not Found in the Arena/i;
const ENTER_CHALLENGES_RE = /Enter Challenges/i;
const RETURN_HOME_RE = /Return Home/i;

describe("NotFound Page", () => {
  it("renders 404 heading and navigation buttons", () => {
    render(
      <Providers>
        <NotFound />
      </Providers>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "404" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: PAGE_NOT_FOUND_RE,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ENTER_CHALLENGES_RE })
    ).toHaveAttribute("href", "/challenges");
    expect(screen.getByRole("link", { name: RETURN_HOME_RE })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
