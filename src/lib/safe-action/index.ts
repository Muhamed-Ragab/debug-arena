import "server-only";

import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";
import { isOfflineError, OFFLINE_MESSAGE } from "@/lib/offline";
import { ActionError } from "./errors";

export { ActionError, ConflictError, NotFoundError } from "./errors";

export function handleServerError(e: Error): string {
  if (isOfflineError(e)) {
    return OFFLINE_MESSAGE;
  }
  if (e instanceof ActionError) {
    return e.message;
  }
  console.error(e);
  return "error.somethingWrong";
}

export const actionClient = createSafeActionClient({
  handleServerError,
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    throw new ActionError("error.unauthorized");
  }

  return next({
    ctx: {
      session: session.session,
      user: session.user,
    },
  });
});

export const adminActionClient = authActionClient.use(async ({ ctx, next }) => {
  const userRole = ctx.user?.role;
  if (userRole !== "admin") {
    throw new ActionError("error.forbiddenAdmin");
  }

  return await next({
    ctx,
  });
});
