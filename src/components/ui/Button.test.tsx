import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children with default variant", () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
  });

  it("renders with outline variant", () => {
    render(<Button variant="outline">Inspect</Button>);
    const btn = screen.getByRole("button", { name: "Inspect" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("border-border");
  });
});
