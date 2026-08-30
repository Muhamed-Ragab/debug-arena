import { render, screen } from "@testing-library/react";
import { useExtracted } from "next-intl";
import { getExtracted } from "next-intl/server";
import { describe, expect, it } from "vitest";

function BareComponent() {
  const t = useExtracted();
  return <span>{t("Hello, {name}!", { name: "World" })}</span>;
}

function RichComponent() {
  const t = useExtracted();
  return <span>{t("Welcome, {name}!", { name: "Ada" })}</span>;
}

describe("extraction smoke", () => {
  it("useExtracted without provider returns English literal", () => {
    render(<BareComponent />);
    expect(screen.getByText("Hello, World!")).toBeInTheDocument();
  });

  it("useExtracted handles ICU vars", () => {
    render(<RichComponent />);
    expect(screen.getByText("Welcome, Ada!")).toBeInTheDocument();
  });

  it("getExtracted server returns literal", async () => {
    const t = await getExtracted();
    expect(t("System Health")).toBe("System Health");
    expect(t("Welcome, {name}!", { name: "Bob" })).toBe("Welcome, Bob!");
  });

  it("t with description object returns message", () => {
    function DescComponent() {
      const t = useExtracted();
      return (
        <span>
          {t({ description: "Advance to next slide", message: "Right" })}
        </span>
      );
    }
    render(<DescComponent />);
    expect(screen.getByText("Right")).toBeInTheDocument();
  });
});
