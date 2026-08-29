import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("not-found", () => {
  it("renders common.notFound keys", () => {
    render(<NotFound />);
    // Badge stable literal
    expect(
      screen.getByText("404 // NULL_POINTER_EXCEPTION")
    ).toBeInTheDocument();
    expect(screen.getByText("Page Not Found in the Arena")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The breakpoint you set led nowhere. The requested route does not exist or may have been refactored out of production."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Error: ROUTE_NOT_FOUND")).toBeInTheDocument();
    expect(
      screen.getByText("at resolveRoute (debug-arena://router.ts:404:12)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("at handleRequest (debug-arena://server.ts:89:4)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suggested Fix: Navigate back to the challenge lobby.")
    ).toBeInTheDocument();
    expect(screen.getByText("Enter Challenges")).toBeInTheDocument();
    expect(screen.getByText("Return Home")).toBeInTheDocument();
  });
});
