import type { z } from "zod";
import type {
  forgetPasswordSchema,
  signInEmailSchema,
  signUpEmailSchema,
} from "./validation";

export type SignUpEmailInput = z.infer<typeof signUpEmailSchema>;
export type SignInEmailInput = z.infer<typeof signInEmailSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;
