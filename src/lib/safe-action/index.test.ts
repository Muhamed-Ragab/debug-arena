import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ActionError, actionClient } from "./index";

describe("safe-action client", () => {
  it("creates and runs a safe action successfully", async () => {
    const testAction = actionClient
      .schema(z.object({ name: z.string() }))
      .action(async ({ parsedInput }) => ({
        greeting: `Hello, ${parsedInput.name}!`,
      }));

    const result = await testAction({ name: "Alice" });
    expect(result?.data).toEqual({ greeting: "Hello, Alice!" });
  });

  it("handles ActionError custom message", () => {
    const err = new ActionError("Forbidden action");
    expect(err.message).toBe("Forbidden action");
  });
});
