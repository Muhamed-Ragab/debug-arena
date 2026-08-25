import { beforeEach, describe, expect, it, vi } from "vitest";
import { withRequestClaims } from "./request-claims";

type TxLike = { execute: ReturnType<typeof vi.fn> };

const executeMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("../../core", () => ({
  db: {
    transaction: (fn: (tx: unknown) => Promise<unknown>) => transactionMock(fn),
  },
}));

beforeEach(() => {
  executeMock.mockReset();
  transactionMock.mockReset();
});

describe("withRequestClaims", () => {
  it("sets the RLS GUC inside a transaction, scoped to it, then runs fn with tx", async () => {
    const fakeTx: TxLike = { execute: executeMock };
    transactionMock.mockImplementation(async (fn: (tx: TxLike) => Promise<string>) => {
      executeMock.mockResolvedValue(undefined);
      return fn(fakeTx);
    });
    executeMock.mockClear();

    const result = await withRequestClaims("user-1", "admin", async (tx) => {
      expect(tx).toBe(fakeTx);
      return "done";
    });

    expect(result).toBe("done");
    expect(executeMock).toHaveBeenCalledTimes(1);
    const sqlArg = executeMock.mock.calls[0]?.[0];
    // drizzle sql template: check query chunks carry our values
    const rendered = JSON.stringify(sqlArg);
    expect(rendered).toContain("request.jwt.claim.sub");
    expect(rendered).toContain("user-1");
  });

  it("propagates fn failures after setting the claim", async () => {
    const fakeTx: TxLike = { execute: executeMock.mockResolvedValue(undefined) };
    transactionMock.mockImplementation(async (fn: (tx: TxLike) => Promise<void>) => fn(fakeTx));

    await expect(
      withRequestClaims("u", "user", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
