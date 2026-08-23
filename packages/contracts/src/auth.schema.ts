import { z } from "zod";

export const RegisterBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
});

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthTokenResponseSchema = z.object({
  token: z.string(),
});

export const AuthErrorResponseSchema = z.object({
  message: z.string(),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;
