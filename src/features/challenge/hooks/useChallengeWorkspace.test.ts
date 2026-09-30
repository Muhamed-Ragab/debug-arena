import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChallengeWorkspace } from "./useChallengeWorkspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth/client", () => ({
  useSession: () => ({ data: null }),
}));

describe("useChallengeWorkspace", () => {
  it("uses readable English for missing line selection", async () => {
    const { result } = renderHook(() => useChallengeWorkspace());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe(
      "Select at least one line containing the bug."
    );
    expect(result.current.fieldErrors?.localizationLines).toEqual([
      "Select at least one line containing the bug.",
    ]);
  });
});
