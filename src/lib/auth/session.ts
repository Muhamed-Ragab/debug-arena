import "server-only";

import { headers } from "next/headers";
import { auth, type Session, type User } from "@/lib/auth";

export interface ServerSession {
  session: Session;
  user: User;
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session) {
      return null;
    }

    return {
      session: session.session,
      user: session.user,
    };
  } catch (error) {
    console.error("Error retrieving server session:", error);
    return null;
  }
}
