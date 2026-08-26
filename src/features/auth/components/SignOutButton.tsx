"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-destructive"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
      }}
      type="button"
    >
      <LogOut size={13} />
      <span>Sign out</span>
    </button>
  );
}
