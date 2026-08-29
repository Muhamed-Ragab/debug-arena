import {
  adminClient,
  inferAdditionalFields,
  lastLoginMethodClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./index";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
      : window.location.origin,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient(),
    lastLoginMethodClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
