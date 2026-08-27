"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      className="h-auto p-0 text-muted-foreground text-xs hover:bg-transparent hover:text-destructive"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
      }}
      size="sm"
      variant="ghost"
    >
      <LogOut size={13} />
      <span>Sign out</span>
    </Button>
  );
}
