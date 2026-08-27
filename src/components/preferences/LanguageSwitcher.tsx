"use client";

import { useLingui } from "@lingui/react";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dynamicActivate, locales } from "@/i18n/i18n";
import { cn } from "@/lib/utils";

const LANGS = Object.entries(locales) as [string, string][];

export function LanguageSwitcher() {
  const { i18n } = useLingui();
  const active = i18n.locale;

  const current = locales[active as keyof typeof locales] ?? active;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select language"
        className="relative inline-flex h-9 items-center gap-4 rounded-md border border-border bg-inset py-1.5 ps-7 pe-3 text-foreground text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Globe
          aria-hidden
          className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <span className="truncate">{current}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40">
        {LANGS.map(([code, label]) => {
          const selected = code === active;
          return (
            <DropdownMenuItem
              className={cn(
                "justify-between",
                selected && "bg-muted font-medium"
              )}
              key={code}
              onClick={() => dynamicActivate(code)}
            >
              <span>{label}</span>
              {selected && (
                <Check aria-hidden className="text-primary" size={14} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
