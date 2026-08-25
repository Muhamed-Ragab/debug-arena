import { createAuthClient } from "better-auth/react";

/**
 * Browser-side path includes /api so the Vite proxy forwards to the API and
 * strips the prefix; the API mounts better-auth at basePath /auth.
 * Cookies stay first-party because every request is same-origin (:5173).
 */
export const authClient = createAuthClient({ baseURL: "/api/auth" });
