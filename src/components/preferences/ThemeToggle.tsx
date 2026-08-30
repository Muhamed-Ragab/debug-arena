"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useExtracted } from "next-intl";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEMES = [
  { Icon: Monitor, key: "system", value: "system" },
  { Icon: Sun, key: "light", value: "light" },
  { Icon: Moon, key: "dark", value: "dark" },
] as const;

export function ThemeToggle() {
  const t = useExtracted();
  const themeLabels: Record<string, string> = {
    dark: t("Dark"),
    light: t("Light"),
    system: t("System"),
  };
  function getThemeLabel(key: string): string {
    return themeLabels[key] ?? key;
  }
  const { theme, setTheme } = useTheme();

  const resolvedTheme = theme ?? "system";
  const currentTheme =
    THEMES.find((v) => v.value === resolvedTheme) || THEMES[0];
  const CurrentIcon = currentTheme.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("Select theme")}
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CurrentIcon
          aria-hidden
          className="absolute inset-s-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{getThemeLabel(currentTheme.key)}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-32">
        {THEMES.map(({ value, key, Icon }) => {
          const selected = value === resolvedTheme;
          return (
            <DropdownMenuItem
              className={cn(
                "justify-between",
                selected && "bg-muted font-medium"
              )}
              key={value}
              onClick={() => setTheme(value)}
            >
              <div className="flex items-center gap-2">
                <Icon aria-hidden className="text-muted-foreground" size={14} />
                <span>{getThemeLabel(key)}</span>
              </div>
              {selected && <Check className="text-primary" size={14} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
