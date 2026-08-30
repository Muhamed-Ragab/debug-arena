"use client";

import { LogOut } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export interface SignOutButtonProps extends Omit<ButtonProps, "onClick"> {
  redirectTo?: Route | string;
  showIcon?: boolean;
}

export function SignOutButton({
  children,
  className,
  redirectTo = "/login",
  showIcon = true,
  size = "sm",
  variant = "ghost",
  ...props
}: SignOutButtonProps) {
  const t = useExtracted();
  const router = useRouter();

  return (
    <Button
      className={cn(
        "gap-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
        className
      )}
      onClick={async () => {
        await authClient.signOut();
        router.push(redirectTo as Route);
        router.refresh();
      }}
      size={size}
      variant={variant}
      {...props}
    >
      {Boolean(showIcon) && <LogOut size={16} />}
      {children ?? <span>{t("Log out")}</span>}
    </Button>
  );
}
