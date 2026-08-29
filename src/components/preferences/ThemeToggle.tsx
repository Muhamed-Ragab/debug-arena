"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import type { Theme } from "@/contexts/types";
import { cn } from "@/lib/utils";

const THEMES = [
  { Icon: Monitor, key: "system", label: "System", value: "system" },
  { Icon: Sun, key: "light", label: "Light", value: "light" },
  { Icon: Moon, key: "dark", label: "Dark", value: "dark" },
] as const;

const _THEME_KEY_MAP: Record<string, string> = {
  Dark: "common.theme.dark",
  Light: "common.theme.light",
  System: "common.theme.system",
};

export function ThemeToggle() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[0];
  const CurrentIcon = currentTheme.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.preferences.selectTheme")}
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CurrentIcon
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">
          {t(`common.theme.${currentTheme.key}`)}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-32">
        {THEMES.map(({ value, label, Icon, key }) => {
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
                <span>{t(`common.theme.${key}`)}</span>
              </div>
              {selected && <Check className="text-primary" size={14} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
