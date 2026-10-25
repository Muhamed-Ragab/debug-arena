import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { getServerSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  const { role } = session.user as { role?: string };
  if (role !== "admin") {
    redirect("/challenges");
  }
  return (
    <ProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
