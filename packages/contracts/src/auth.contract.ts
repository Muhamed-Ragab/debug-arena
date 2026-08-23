import { initContract } from "@ts-rest/core";
import {
  RegisterBodySchema,
  LoginBodySchema,
  AuthTokenResponseSchema,
  AuthErrorResponseSchema,
} from "./auth.schema";

const c = initContract();

export const authContract = c.router({
  register: {
    method: "POST",
    path: "/auth/register",
    body: RegisterBodySchema,
    responses: {
      201: AuthTokenResponseSchema,
      409: AuthErrorResponseSchema,
    },
  },
  login: {
    method: "POST",
    path: "/auth/login",
    body: LoginBodySchema,
    responses: {
      200: AuthTokenResponseSchema,
      401: AuthErrorResponseSchema,
    },
  },
});
