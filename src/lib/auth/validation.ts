import { z } from "zod";

/**
 * Server-side payload validation for better-auth endpoints,
 * enforced by the `validation-better-auth` plugin (Standard Schema).
 * Paths must match better-auth's built-in email/password routes.
 */

export const signUpEmailSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export const signInEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email(),
});

export type {
  ForgetPasswordInput,
  SignInEmailInput,
  SignUpEmailInput,
} from "./types";
