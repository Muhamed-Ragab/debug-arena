"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Theme, useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const THEMES = [
  { Icon: Monitor, label: "System", value: "system" },
  { Icon: Sun, label: "Light", value: "light" },
  { Icon: Moon, label: "Dark", value: "dark" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const CurrentIcon = currentTheme.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select theme"
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CurrentIcon
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{currentTheme.label}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-32">
        {THEMES.map(({ value, label, Icon }) => {
          const selected = value === theme;
          return (
            <DropdownMenuItem
              className={cn(
                "justify-between",
                selected && "bg-muted font-medium"
              )}
              key={value}
              onClick={() => setTheme(value as Theme)}
            >
              <div className="flex items-center gap-2">
                <Icon aria-hidden className="text-muted-foreground" size={14} />
                <span>{label}</span>
              </div>
              {selected && <Check className="text-primary" size={14} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
