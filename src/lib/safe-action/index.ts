import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return e.message;
    }
    console.error("Action error:", e);
    return "An unexpected server error occurred.";
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    throw new ActionError("Unauthorized");
  }

  return next({
    ctx: {
      session: session.session,
      user: session.user,
    },
  });
});
