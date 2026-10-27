import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("renders with default type password and placeholder", () => {
    render(<PasswordInput id="pwd" name="password" />);
    const input = screen.getByPlaceholderText("••••••••");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("id", "pwd");
    expect(input).toHaveAttribute("name", "password");
  });

  it("renders a toggle button with label 'Show password'", () => {
    render(<PasswordInput aria-label="Password" />);
    const button = screen.getByRole("button", { name: /show password/i });
    expect(button).toBeInTheDocument();
  });

  it("toggles input type to text and updates aria-label on click", () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    const button = screen.getByRole("button", { name: /show password/i });

    fireEvent.click(button);
    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: /show password/i })
    ).toBeInTheDocument();
  });

  it("supports disabling the input", () => {
    render(<PasswordInput aria-label="Password" disabled />);
    const input = screen.getByLabelText("Password");
    expect(input).toBeDisabled();
  });
});
