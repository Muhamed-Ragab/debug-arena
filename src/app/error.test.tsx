import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OFFLINE_MESSAGE, OfflineError } from "@/lib/offline";
import { renderWithProviders, screen } from "@/test/test-utils";
import ErrorComponent from "./error";

describe("Error boundary", () => {
  it("renders offline branch with OFFLINE_MESSAGE and retry", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = new OfflineError(OFFLINE_MESSAGE);

    renderWithProviders(<ErrorComponent error={error} reset={reset} />);

    expect(screen.getByText("You are offline")).toBeInTheDocument();
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders offline branch when cause is offline", () => {
    const reset = vi.fn();
    const cause = Object.assign(new Error("fetch failed"), {
      code: "ECONNREFUSED",
    });
    const error = new Error("outer", { cause });

    renderWithProviders(<ErrorComponent error={error} reset={reset} />);

    expect(screen.getByText("You are offline")).toBeInTheDocument();
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
  });

  it("renders generic branch for non-offline error", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = new Error("Something unexpected");

    renderWithProviders(<ErrorComponent error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Something went wrong").length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(OFFLINE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText("You are offline")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("shows digest when provided", () => {
    const reset = vi.fn();
    const error = Object.assign(new Error("fail"), { digest: "abc123" });

    renderWithProviders(<ErrorComponent error={error} reset={reset} />);

    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();
  });
});
