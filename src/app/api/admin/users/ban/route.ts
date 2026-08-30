import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", success: false },
      { status: 403 }
    );
  }
  try {
    const body = (await request.json()) as {
      banExpiresIn?: number;
      banReason?: string;
      banned?: boolean;
      userId?: string;
    };
    const userId = body.userId;
    const banned = body.banned;
    if (!userId || typeof banned !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload", success: false },
        { status: 400 }
      );
    }
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "error.cannotBanSelf", success: false },
        { status: 400 }
      );
    }
    const requestHeaders = await headers();
    if (banned) {
      await auth.api.banUser({
        body: {
          banExpiresIn: body.banExpiresIn,
          banReason: body.banReason ?? "Admin ban",
          userId,
        },
        headers: requestHeaders,
      });
    } else {
      await auth.api.unbanUser({
        body: {
          userId,
        },
        headers: requestHeaders,
      });
    }
    return NextResponse.json({ data: { banned, userId }, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed", success: false },
      { status: 500 }
    );
  }
}
