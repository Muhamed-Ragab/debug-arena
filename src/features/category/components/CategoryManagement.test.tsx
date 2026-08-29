import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "@/test/test-utils";
import type { CategoryDTO } from "../types";
import { CategoryManagement } from "./CategoryManagement";

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../actions", () => ({
  createCategoryAction: (...args: unknown[]) => mockCreate(...args),
  deleteCategoryAction: (...args: unknown[]) => mockDelete(...args),
  updateCategoryAction: (...args: unknown[]) => mockUpdate(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const SEED: CategoryDTO[] = [
  {
    color: "#3b82f6",
    description: "desc",
    icon: "Layers",
    id: "1",
    isActive: true,
    name: "React Rendering",
    slug: "react-rendering",
    sortOrder: 0,
  },
  {
    color: "#10b981",
    description: "desc",
    icon: "Cpu",
    id: "2",
    isActive: true,
    name: "Backend Concurrency",
    slug: "backend-concurrency",
    sortOrder: 1,
  },
  {
    color: "#f59e0b",
    description: "desc",
    icon: "Database",
    id: "3",
    isActive: true,
    name: "State Management",
    slug: "state-management",
    sortOrder: 2,
  },
  {
    color: "#ef4444",
    description: "desc",
    icon: "Globe",
    id: "4",
    isActive: true,
    name: "API Design",
    slug: "api-design",
    sortOrder: 3,
  },
  {
    color: "#8b5cf6",
    description: "desc",
    icon: "Zap",
    id: "5",
    isActive: false,
    name: "Performance",
    slug: "performance",
    sortOrder: 4,
  },
  {
    color: "#06b6d4",
    description: "desc",
    icon: "Shield",
    id: "6",
    isActive: true,
    name: "Security",
    slug: "security",
    sortOrder: 5,
  },
];

describe("CategoryManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      data: {
        category: {
          color: null,
          description: null,
          icon: null,
          id: "new-id",
          isActive: true,
          name: "New Cat",
          slug: "new-cat",
          sortOrder: 0,
        },
        success: true,
      },
    });
    mockUpdate.mockResolvedValue({
      data: { category: { ...SEED[0], name: "Updated" }, success: true },
    });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  it("renders table with 6 rows sorted by sortOrder", () => {
    renderWithProviders(<CategoryManagement categories={SEED} />);
    // Check header
    expect(screen.getByText("Categories")).toBeInTheDocument();
    // All 6 names present
    for (const cat of SEED) {
      expect(screen.getByText(cat.name)).toBeInTheDocument();
    }
    // Check slugs
    expect(screen.getByText("react-rendering")).toBeInTheDocument();
    // Check badges
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    // Color swatch rendered
    const swatches = document.querySelectorAll('[style*="background-color"]');
    expect(swatches.length).toBeGreaterThanOrEqual(6);
  });

  it("shows empty state when 0 categories", () => {
    renderWithProviders(<CategoryManagement categories={[]} />);
    expect(
      screen.getByText("No categories yet — create one")
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /create category/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("create dialog validates - shows inline error when name missing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManagement categories={SEED} />);

    await user.click(
      screen.getAllByRole("button", { name: /create category/i })[0]
    );
    expect(await screen.findByLabelText("Name")).toBeInTheDocument();

    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement;
    const createBtn = within(dialog).getByRole("button", { name: /^create$/i });
    await user.click(createBtn);

    expect(
      await within(dialog).findByText("Name must be at least 2 characters")
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("create dialog validates hex color inline", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManagement categories={SEED} />);
    await user.click(
      screen.getAllByRole("button", { name: /create category/i })[0]
    );
    expect(await screen.findByLabelText("Name")).toBeInTheDocument();

    const nameInput = document.getElementById(
      "create-name"
    ) as HTMLInputElement;
    const colorInput = document.getElementById(
      "create-color"
    ) as HTMLInputElement;
    await user.type(nameInput, "Valid Name");
    await user.type(colorInput, "not-a-color");

    const content = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement;
    const createBtn = within(content).getByRole("button", {
      name: /^create$/i,
    });
    await user.click(createBtn);

    expect(
      await within(content).findByText("Invalid hex color (e.g. #3b82f6)")
    ).toBeInTheDocument();
  });

  it("delete handles 409 and shows error alert", async () => {
    mockDelete.mockResolvedValue({
      serverError: "Cannot delete — 3 challenges use this category",
    });
    const user = userEvent.setup();
    renderWithProviders(<CategoryManagement categories={SEED} />);

    // Click delete on first category
    const deleteButtons = screen.getAllByLabelText(/Delete React Rendering/i);
    expect(deleteButtons.length).toBe(1);
    await user.click(deleteButtons[0]);

    // Delete confirm dialog
    expect(
      await screen.findByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();
    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement;
    const confirmDelete = within(dialog).getByRole("button", {
      name: /^delete$/i,
    });
    await user.click(confirmDelete);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ id: "1" });
    });
    // Alert should show 409 message
    await waitFor(() => {
      expect(
        screen.getByText("Cannot delete — 3 challenges use this category")
      ).toBeInTheDocument();
    });
    // Category still in table
    expect(screen.getByText("React Rendering")).toBeInTheDocument();
  });

  it("filters by isActive toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryManagement categories={SEED} />);

    // Initially all 6 visible
    expect(screen.getByText("Performance")).toBeInTheDocument();

    // Change filter to Active only - Performance is inactive so should hide
    // Open select and click Active only
    const trigger = screen.getByLabelText("Filter by status");
    await user.click(trigger);
    const activeOption = await screen.findByText("Active only");
    await user.click(activeOption);

    // Performance (inactive) should not be visible
    await waitFor(() => {
      expect(screen.queryByText("Performance")).not.toBeInTheDocument();
    });
    expect(screen.getByText("React Rendering")).toBeInTheDocument();

    // Switch to Inactive only -> only Performance visible
    await user.click(screen.getByLabelText("Filter by status"));
    const inactiveOption = await screen.findByText("Inactive only");
    await user.click(inactiveOption);

    await waitFor(() => {
      expect(screen.getByText("Performance")).toBeInTheDocument();
    });
    expect(screen.queryByText("React Rendering")).not.toBeInTheDocument();
  });

  it("successful delete removes row from table", async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();
    renderWithProviders(<CategoryManagement categories={SEED} />);

    const deleteBtn = screen.getByLabelText("Delete Security");
    await user.click(deleteBtn);
    expect(
      await screen.findByText(/Are you sure you want to delete "Security"/)
    ).toBeInTheDocument();
    const dialog = document.querySelector(
      '[data-slot="dialog-content"]'
    ) as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.queryByText("Security")).not.toBeInTheDocument();
    });
    // other rows remain
    expect(screen.getByText("React Rendering")).toBeInTheDocument();
  });
});
