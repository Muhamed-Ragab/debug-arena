import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { getPaginationItems, ResponsivePagination } from "./pagination";

describe("getPaginationItems", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("returns window near the start with trailing ellipsis", () => {
    expect(getPaginationItems(2, 13)).toEqual([1, 2, 3, 4, 5, "ellipsis", 13]);
    expect(getPaginationItems(4, 13)).toEqual([1, 2, 3, 4, 5, "ellipsis", 13]);
  });

  it("returns window near the end with leading ellipsis", () => {
    expect(getPaginationItems(12, 13)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      12,
      13,
    ]);
    expect(getPaginationItems(10, 13)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      12,
      13,
    ]);
  });

  it("returns window in the middle with two ellipses", () => {
    expect(getPaginationItems(7, 13)).toEqual([
      1,
      "ellipsis",
      6,
      7,
      8,
      "ellipsis",
      13,
    ]);
  });
});

describe("ResponsivePagination component", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = renderWithProviders(
      <ResponsivePagination
        currentPage={1}
        onPageChange={vi.fn()}
        totalPages={1}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders desktop and mobile views with active page and item summary", () => {
    renderWithProviders(
      <ResponsivePagination
        currentPage={5}
        onPageChange={vi.fn()}
        pageSize={6}
        totalItems={76}
        totalPages={13}
      />
    );

    // Summary
    expect(screen.getByText(/showing 25–30 of 76/i)).toBeInTheDocument();

    // Mobile indicator
    expect(screen.getByText(/page 5 of 13/i)).toBeInTheDocument();

    // Page 5 button should be active (aria-current="page")
    const page5Btn = screen.getByRole("button", { name: "Page 5" });
    expect(page5Btn).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange when clicking a page number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderWithProviders(
      <ResponsivePagination
        currentPage={5}
        onPageChange={onPageChange}
        totalPages={13}
      />
    );

    const page6Btn = screen.getByRole("button", { name: "Page 6" });
    await user.click(page6Btn);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it("handles Previous and Next button clicks and boundary disabled states", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    const { rerender } = renderWithProviders(
      <ResponsivePagination
        currentPage={1}
        onPageChange={onPageChange}
        totalPages={5}
      />
    );

    // On page 1, previous buttons should be disabled
    const prevButtons = screen.getAllByRole("button", {
      name: /previous page/i,
    });
    for (const btn of prevButtons) {
      expect(btn).toBeDisabled();
    }

    // Next button should be enabled and call onPageChange(2)
    const nextButtons = screen.getAllByRole("button", {
      name: /next page/i,
    });
    expect(nextButtons[0]).toBeEnabled();
    await user.click(nextButtons[0]);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Rerender on last page: next buttons should be disabled
    rerender(
      <ResponsivePagination
        currentPage={5}
        onPageChange={onPageChange}
        totalPages={5}
      />
    );
    const nextButtonsLast = screen.getAllByRole("button", {
      name: /next page/i,
    });
    for (const btn of nextButtonsLast) {
      expect(btn).toBeDisabled();
    }
  });
});
