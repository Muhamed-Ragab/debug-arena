import type { Request } from "express";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}
