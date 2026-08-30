import { Bug } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

interface LogoProps {
  compact?: boolean;
  href?: Route;
}

export function Logo({
  compact = false,
  href = "/challenges" as Route,
}: LogoProps) {
  return (
    <Link className="flex items-center gap-2.5" href={href}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Bug className="text-primary-foreground" size={18} />
      </div>
      {!compact && (
        <span className="font-semibold text-[15px] text-heading tracking-tight">
          Debug Arena
        </span>
      )}
    </Link>
  );
}
