import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const authContract = c.router({
  register: {
    method: "POST",
    path: "/auth/register",
    body: z.object({
      email: z.string().email(),
      username: z.string().min(3),
      password: z.string().min(8),
    }),
    responses: {
      201: z.object({ token: z.string() }),
      409: z.object({ message: z.string() }),
    },
  },
  login: {
    method: "POST",
    path: "/auth/login",
    body: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    responses: {
      200: z.object({ token: z.string() }),
      401: z.object({ message: z.string() }),
    },
  },
});
