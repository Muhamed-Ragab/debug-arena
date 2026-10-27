import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    getLastUsedLoginMethod: () => null,
    getSession: vi.fn(),
    isLastUsedLoginMethod: () => false,
    signIn: { email: vi.fn(), social: vi.fn() },
    useSession: () => ({ data: null, isPending: false }),
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));

describe("LoginPage password visibility toggle", () => {
  it("defaults password input to type password", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders a toggle button with label 'Show password'", () => {
    render(<LoginPage />);
    const toggleButton = screen.getByRole("button", { name: /show password/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("toggles password input type to text and updates label to 'Hide password' on click", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(
      screen.getByRole("button", { name: /show password/i })
    ).toBeInTheDocument();
  });
});
