import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import * as actions from "../actions";
import type { SessionData } from "../types";
import { SessionManager } from "./SessionManager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("../actions", () => ({
  getActiveSessionsAction: vi.fn(),
  revokeAllOtherSessionsAction: vi.fn(),
  revokeSessionAction: vi.fn(),
}));

const mockSessions: SessionData[] = [
  {
    browser: "Chrome",
    current: true,
    device: "MacBook / Mac",
    deviceType: "desktop",
    id: "session-1",
    ip: "127.0.0.1 (Localhost)",
    lastActive: "Active now",
    location: "Local Network",
    newLogin: false,
    os: "macOS",
  },
  {
    browser: "Safari",
    current: false,
    device: "iPhone",
    deviceType: "mobile",
    id: "session-2",
    ip: "192.168.1.***",
    lastActive: "15m ago",
    location: "Local Network",
    newLogin: true,
    os: "iOS",
  },
];

describe("SessionManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active sessions and badges from props", () => {
    renderWithProviders(<SessionManager sessions={mockSessions} />);

    expect(screen.getByText("Active sessions")).toBeInTheDocument();
    expect(screen.getByText("MacBook / Mac")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("This device")).toBeInTheDocument();
    expect(screen.getByText("New login")).toBeInTheDocument();
    expect(screen.getByText("127.0.0.1 (Localhost)")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.***")).toBeInTheDocument();
  });

  it("fetches active sessions from backend when initialSessions are empty", async () => {
    vi.mocked(actions.getActiveSessionsAction).mockResolvedValueOnce({
      data: { sessions: mockSessions, success: true },
    } as never);

    renderWithProviders(<SessionManager sessions={[]} />);

    await waitFor(() => {
      expect(actions.getActiveSessionsAction).toHaveBeenCalledTimes(1);
      expect(screen.getByText("MacBook / Mac")).toBeInTheDocument();
      expect(screen.getByText("iPhone")).toBeInTheDocument();
    });
  });

  it("invokes revokeSessionAction and removes item on revoke click", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.revokeSessionAction).mockResolvedValueOnce({
      data: { success: true },
    } as never);

    renderWithProviders(<SessionManager sessions={mockSessions} />);

    const revokeButton = screen.getByRole("button", { name: /^revoke$/i });
    await user.click(revokeButton);

    expect(actions.revokeSessionAction).toHaveBeenCalledWith({
      sessionId: "session-2",
    });

    await waitFor(() => {
      expect(screen.queryByText("iPhone")).not.toBeInTheDocument();
    });
  });

  it("invokes revokeAllOtherSessionsAction when clicking revoke all other sessions", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.revokeAllOtherSessionsAction).mockResolvedValueOnce({
      data: { success: true },
    } as never);

    renderWithProviders(<SessionManager sessions={mockSessions} />);

    const revokeAllButton = screen.getByRole("button", {
      name: /revoke all other sessions/i,
    });
    await user.click(revokeAllButton);

    expect(actions.revokeAllOtherSessionsAction).toHaveBeenCalledWith({});

    await waitFor(() => {
      expect(screen.queryByText("iPhone")).not.toBeInTheDocument();
      expect(screen.getByText("MacBook / Mac")).toBeInTheDocument();
    });
  });

  it("re-fetches sessions when clicking the refresh button", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.getActiveSessionsAction).mockResolvedValueOnce({
      data: { sessions: mockSessions, success: true },
    } as never);

    renderWithProviders(<SessionManager sessions={mockSessions} />);

    const refreshButton = screen.getByRole("button", {
      name: /refresh sessions/i,
    });
    await user.click(refreshButton);

    expect(actions.getActiveSessionsAction).toHaveBeenCalledTimes(1);
  });
});
