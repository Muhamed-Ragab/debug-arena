"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type"> {
  showLockIcon?: boolean;
}

export function PasswordInput({
  className,
  placeholder = "••••••••",
  showLockIcon = true,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      {Boolean(showLockIcon) && (
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={15}
        />
      )}
      <Input
        className={cn("h-10 pe-10", showLockIcon ? "ps-10" : "ps-3", className)}
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setShowPassword((prev) => !prev)}
        type="button"
      >
        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
